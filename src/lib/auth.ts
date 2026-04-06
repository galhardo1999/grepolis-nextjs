// ============================================================
// AUTENTICAÇÃO — bcryptjs + JWT assinado + Session no DB
// ============================================================

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './db';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { PRODUCAO_BASE_FAVOR } from './config';
import { EDIFICIOS } from './edificios';
import { calcularProducaoRecurso, calcularProducaoFavor } from './calculoProducao';

const COOKIE_NAME = 'granpolis_session';
const SALT_ROUNDS = 12;
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

// JWT secreta — fallback para desenvolvimento
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-do-not-use-in-production-change-me'
);

// Schemas de validação
export const loginSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e underscore'),
  senha: z.string().min(6).max(72),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e underscore'),
  senha: z.string().min(6).max(72),
});

// ============================================================
// JWT — stateless validation no middleware
// ============================================================

export async function criarJWT(userId: string, username: string): Promise<string> {
  return new SignJWT({ userId, username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(JWT_SECRET);
}

export async function verificarJWT(token: string): Promise<{ userId: string; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      username: payload.username as string,
    };
  } catch {
    return null;
  }
}

// ============================================================
// SESSION — armazenamento no DB para revogação
// ============================================================

function gerarTokenHash(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(48).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

async function criarSession(userId: string): Promise<string> {
  const { token, tokenHash } = gerarTokenHash();

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000),
    },
  });

  return token;
}

async function revogarSession(tokenHash: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash } });
}

async function limparSessionsExpiradas(): Promise<void> {
  await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}

// ============================================================
// AUTH PUBLIC API
// ============================================================

export interface AuthSession {
  userId: string;
  username: string;
}

export async function registrarUsuario(
  email: string,
  username: string,
  senha: string,
  nomeCidade?: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  const validacao = registerSchema.safeParse({ email, username, senha });
  if (!validacao.success) {
    return { sucesso: false, erro: validacao.error.issues[0].message };
  }

  const usernameExistente = await prisma.user.findUnique({ where: { username } });
  if (usernameExistente) return { sucesso: false, erro: 'Username já utilizado' };

  const emailExistente = await prisma.user.findUnique({ where: { email } });
  if (emailExistente) return { sucesso: false, erro: 'Email já cadastrado' };

  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: senhaHash,
      },
    });

    await prisma.cidade.create({
      data: {
        userId: user.id,
        nomeCidade: nomeCidade || username,
        madeira: 250,
        pedra: 250,
        prata: 250,
        populacao: 100,
        populacaoMaxima: 100,
        recursosMaximos: 300,
        favor: 0,
        favorMaximo: 500,
        prataNaGruta: 0,
        deusAtual: null,
        edificios: {
          senate: 1, 'timber-camp': 0, quarry: 0, 'silver-mine': 0,
          farm: 0, warehouse: 0, barracks: 0, temple: 0,
          market: 0, harbor: 0, academy: 0, walls: 0, cave: 0,
        },
        unidades: {
          swordsman: 0, slinger: 0, archer: 0, hoplite: 0,
          horseman: 0, chariot: 0, catapult: 0, bireme: 0,
          'transport-ship': 0, trireme: 0,
        },
        pesquisasConcluidas: [],
        missoesColetadas: [],
        fila: [],
        filaRecrutamento: [],
        cooldownsAldeias: {},
      },
    });
  } catch {
    return { sucesso: false, erro: 'Erro ao criar conta. Tente novamente.' };
  }

  return { sucesso: true };
}

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function loginUsuario(
  username: string,
  senha: string,
): Promise<{ sucesso: boolean; erro?: string; sessionToken?: string; jwtToken?: string }> {
  const validacao = loginSchema.safeParse({ username, senha });
  if (!validacao.success) {
    return { sucesso: false, erro: validacao.error.issues[0].message };
  }

  const user = await prisma.user.findUnique({ where: { username: validacao.data.username } });
  if (!user) return { sucesso: false, erro: 'Usuário ou senha incorretos' };

  const senhaValida = await bcrypt.compare(senha, user.password);
  if (!senhaValida) return { sucesso: false, erro: 'Usuário ou senha incorretos' };

  // Criar JWT + session no DB
  const jwt = await criarJWT(user.id, user.username);
  const sessionToken = await criarSession(user.id);

  return { sucesso: true, sessionToken, jwtToken: jwt };
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME);

  if (!token) return null;

  // Validar session no DB
  const tokenHash = crypto.createHash('sha256').update(token.value).digest('hex');
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await revogarSession(tokenHash);
    cookieStore.delete(COOKIE_NAME);
    cookieStore.delete('granpolis_jwt');
    return null;
  }

  return {
    userId: session.user.id,
    username: session.user.username,
  };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME);

  if (token) {
    const tokenHash = crypto.createHash('sha256').update(token.value).digest('hex');
    await revogarSession(tokenHash);
  }

  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete('granpolis_jwt');
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

export async function getCidadeByUserId(userId: string) {
  return prisma.cidade.findUnique({ where: { userId } });
}

export interface DadosCidade {
  madeira: number;
  pedra: number;
  prata: number;
  populacao: number;
  populacaoMaxima: number;
  recursosMaximos: number;
  favor: number;
  favorMaximo: number;
  prataNaGruta: number;
  deusAtual: string | null;
  edificios: Record<string, number>;
  unidades: Record<string, number>;
  pesquisasConcluidas: string[];
  missoesColetadas: string[];
  fila: unknown[];
  filaRecrutamento: unknown[];
  cooldownsAldeias: Record<string, number>;
  nomeCidade: string;
  ultimaAtualizacao: Date;
}

// ============================================================
// RECALCULA ESTADO NO SERVIDOR — fonte da verdade
// ============================================================

export function recalcularEstadoServidor(cidade: DadosCidade): DadosCidade {
  const deltaSegundos = Math.max(0, (Date.now() - cidade.ultimaAtualizacao.getTime()) / 1000);
  if (deltaSegundos <= 0) return cidade;

  const e = cidade.edificios;

  const madeiraPorHora = calcularProducaoRecurso(e['timber-camp'] || 0, EDIFICIOS['timber-camp'].multiplicadorProducao);
  const pedraPorHora = calcularProducaoRecurso(e['quarry'] || 0, EDIFICIOS['quarry'].multiplicadorProducao);
  const prataPorHora = calcularProducaoRecurso(e['silver-mine'] || 0, EDIFICIOS['silver-mine'].multiplicadorProducao);
  const favorPorHora = calcularProducaoFavor(cidade.deusAtual, e['temple'] || 0);

  const recursosMax = cidade.recursosMaximos;
  const popMax = cidade.populacaoMaxima;

  return {
    ...cidade,
    madeira: Math.min(recursosMax, Math.floor(cidade.madeira + (madeiraPorHora / 3600) * deltaSegundos)),
    pedra: Math.min(recursosMax, Math.floor(cidade.pedra + (pedraPorHora / 3600) * deltaSegundos)),
    prata: Math.min(recursosMax, Math.floor(cidade.prata + (prataPorHora / 3600) * deltaSegundos)),
    populacao: Math.min(popMax, Math.floor(cidade.populacao + (1 / 3600) * deltaSegundos)),
    favor: Math.min(cidade.favorMaximo, Math.floor(cidade.favor + (favorPorHora / 3600) * deltaSegundos)),
    ultimaAtualizacao: new Date(),
  };
}

// Mantido para compatibilidade, mas com validação
export async function salvarEstadoCidade(userId: string, data: Record<string, unknown>) {
  const onde = { userId };
  const existente = await prisma.cidade.findUnique({ where: onde });
  if (!existente) return null;

  // NUNCA confiar numeros de recursos enviados pelo cliente.
  // Recalcular com base no tempo decorrido.
  const dadosRecalculados = recalcularEstadoServidor({
    madeira: existente.madeira as number,
    pedra: existente.pedra as number,
    prata: existente.prata as number,
    populacao: existente.populacao as number,
    populacaoMaxima: existente.populacaoMaxima as number,
    recursosMaximos: existente.recursosMaximos as number,
    favor: existente.favor as number,
    favorMaximo: existente.favorMaximo as number,
    prataNaGruta: existente.prataNaGruta as number,
    deusAtual: existente.deusAtual as string | null,
    edificios: (existente.edificios ?? {}) as Record<string, number>,
    unidades: (existente.unidades ?? {}) as Record<string, number>,
    pesquisasConcluidas: (existente.pesquisasConcluidas ?? []) as string[],
    missoesColetadas: (existente.missoesColetadas ?? []) as string[],
    fila: (existente.fila ?? []) as unknown[],
    filaRecrutamento: (existente.filaRecrutamento ?? []) as unknown[],
    cooldownsAldeias: (existente.cooldownsAldeias ?? {}) as Record<string, number>,
    nomeCidade: existente.nomeCidade,
    ultimaAtualizacao: existente.ultimaAtualizacao,
  });

  return prisma.cidade.update({
    where: onde,
    data: {
      madeira: dadosRecalculados.madeira,
      pedra: dadosRecalculados.pedra,
      prata: dadosRecalculados.prata,
      populacao: dadosRecalculados.populacao,
      populacaoMaxima: dadosRecalculados.populacaoMaxima,
      recursosMaximos: dadosRecalculados.recursosMaximos,
      favor: dadosRecalculados.favor,
      favorMaximo: dadosRecalculados.favorMaximo,
      prataNaGruta: dadosRecalculados.prataNaGruta,
      deusAtual: dadosRecalculados.deusAtual,
      edificios: dadosRecalculados.edificios,
      unidades: dadosRecalculados.unidades,
      pesquisasConcluidas: dadosRecalculados.pesquisasConcluidas,
      missoesColetadas: dadosRecalculados.missoesColetadas,
      fila: dadosRecalculados.fila as object,
      filaRecrutamento: dadosRecalculados.filaRecrutamento as object,
      cooldownsAldeias: dadosRecalculados.cooldownsAldeias,
      nomeCidade: dadosRecalculados.nomeCidade,
      ultimaAtualizacao: new Date(),
    },
  });
}

export async function autenticarOuCidade(
  username: string,
  senha: string,
  nomeCidade?: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  const user = await prisma.user.findUnique({ where: { username } });

  if (user) {
    const senhaValida = await bcrypt.compare(senha, user.password);
    if (!senhaValida) return { sucesso: false, erro: 'Usuário ou senha incorretos' };

    const jwt = await criarJWT(user.id, user.username);
    const sessionToken = await criarSession(user.id);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });
    cookieStore.set('granpolis_jwt', jwt, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });
    return { sucesso: true };
  }

  return registrarUsuario('', username, senha, nomeCidade);
}
