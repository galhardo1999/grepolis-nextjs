// ============================================================
// AUTENTICAÇÃO — bcryptjs + JWT assinado + Session no DB
// ============================================================

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './db';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { calcularCapacidadeArmazem, calcularPopulacaoMaxima } from './config';
import { EDIFICIOS } from './edificios';
import { calcularProducaoRecurso, calcularProducaoFavor } from './calculoProducao';
import { gerarPosicaoMapa } from './mapa';
import { PROTECAO_NOVO_PLAYER } from './protecao';
import { calcularProximoStreak } from './login-streak';

// Tipos internos para processar filas no servidor
interface ItemFilaServidor {
  edificio: string;
  inicioTempo: number;
  fimTempo: number;
  nivel: number;
}

interface ItemFilaRecrutamentoServidor {
  unidade: string;
  quantidade: number;
  inicioTempo: number;
  fimTempo: number;
}

const COOKIE_NAME = 'granpolis_session';
const SALT_ROUNDS = 12;
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

// JWT secreta — falha se não estiver definida
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is required. Run `npm run setup` or `bun run setup` in the Backend directory to generate it automatically.'
    );
  }

  if (secret.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long. Run `npm run setup` to generate a secure secret.'
    );
  }

  return new TextEncoder().encode(secret);
}

const JWT_SECRET = getJwtSecret();

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

// Chamar periodicamente via cron job: /api/cron/cleanup-sessions
export async function limparSessionsExpiradas(): Promise<void> {
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

    const posicao = gerarPosicaoMapa();

    await prisma.cidade.create({
      data: {
        userId: user.id,
        nomeCidade: nomeCidade || username,
        mapaX: posicao.x,
        mapaY: posicao.y,
        ilha: posicao.ilha,
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
          senado: 1, 'serraria': 0, pedreira: 0, 'mina-de-prata': 0,
          fazenda: 0, armazem: 0, quartel: 0, templo: 0,
          mercado: 0, porto: 0, academia: 0, muralha: 0, gruta: 0,
        },
        unidades: {
          espadachim: 0, fundeiro: 0, arqueiro: 0, hoplita: 0,
          cavaleiro: 0, carruagem: 0, catapulta: 0, birreme: 0,
          'navio-de-transporte': 0, trirreme: 0,
        },
        pesquisasConcluidas: [],
        missoesColetadas: [],
        fila: [],
        filaRecrutamento: [],
        cooldownsAldeias: {},
        loginStreak: 1,
        ultimoLogin: new Date(),
        protecaoOfflineAte: new Date(Date.now() + PROTECAO_NOVO_PLAYER),
        poderesUsadosHoje: {},
        pontos: 0,
        nivelMaravilha: 0,
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
  if (!user) {
    // Fake work para prevenir timing attack de enumeração de usuários
    await bcrypt.hash('dummy-password-for-timing', SALT_ROUNDS);
    return { sucesso: false, erro: 'Usuário ou senha incorretos' };
  }

  const senhaValida = await bcrypt.compare(senha, user.password);
  if (!senhaValida) return { sucesso: false, erro: 'Usuário ou senha incorretos' };

  // Criar JWT + session no DB
  const jwt = await criarJWT(user.id, user.username);
  const sessionToken = await criarSession(user.id);

  // Atualizar loginStreak e ultimoLogin na cidade do usuario
  const cidade = await prisma.cidade.findFirst({ where: { userId: user.id } });
  if (cidade) {
    const { streak: novoStreak } = calcularProximoStreak(
      cidade.ultimoLogin,
      cidade.loginStreak ?? 1,
    );

    await prisma.cidade.update({
      where: { id: (cidade as any).id },
      data: {
        loginStreak: novoStreak,
        ultimoLogin: new Date(),
      },
    });
  }

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
  return prisma.cidade.findFirst({ where: { userId } });
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
  // Novos campos do schema
  mapaX: number;
  mapaY: number;
  ilha: number;
  aliacaId: string | null;
  loginStreak: number;
  ultimoLogin: Date | null;
  ultimoPoderUsado: Date | null;
  poderesUsadosHoje: Record<string, unknown>;
  pontos: number;
  nivelMaravilha: number;
  protecaoOfflineAte: Date | null;
}

// ============================================================
// RECALCULA ESTADO NO SERVIDOR — fonte da verdade (Grepolis-style)
// Processa recursos, fila de construção e fila de recrutamento
// com base apenas no timestamp — sem confiar no cliente.
// ============================================================

export function recalcularEstadoServidor(cidade: DadosCidade): DadosCidade {
  const agora = Date.now();
  const deltaSegundos = Math.max(0, (agora - cidade.ultimaAtualizacao.getTime()) / 1000);

  // Clonar estado mutável
  const edificios = { ...cidade.edificios };
  const unidades = { ...cidade.unidades };
  const fila = (cidade.fila as ItemFilaServidor[]).map(i => ({ ...i }));
  const filaRecrutamento = (cidade.filaRecrutamento as ItemFilaRecrutamentoServidor[]).map(i => ({ ...i }));

  // ── 1. Processar fila de construção ────────────────────────
  const nivelFarmAntigo = cidade.edificios['fazenda'] || 0;
  const temArado = cidade.pesquisasConcluidas.includes('arado');
  const popMaxAntigoTotal = calcularPopulacaoMaxima(nivelFarmAntigo, temArado);

  // Para cada item cujo fimTempo já passou, aplica o level-up
  while (fila.length > 0 && agora >= fila[0].fimTempo) {
    const tarefa = fila.shift()!;
    edificios[tarefa.edificio] = (edificios[tarefa.edificio] || 0) + 1;
  }

  // ── 2. Recalcular capacidades derivadas dos novos níveis ───
  const temCeramica = cidade.pesquisasConcluidas.includes('ceramica');
  const nivelWarehouse = edificios['armazem'] || 0;
  const nivelFarm = edificios['fazenda'] || 0;

  const recursosMax = calcularCapacidadeArmazem(nivelWarehouse, temCeramica);
  const popMax = calcularPopulacaoMaxima(nivelFarm, temArado);
  const popMaxFinal = Math.max(cidade.populacaoMaxima, popMax);

  let populacaoExtra = 0;
  if (popMaxFinal > popMaxAntigoTotal) {
    populacaoExtra = popMaxFinal - popMaxAntigoTotal;
  }

  // ── 3. Processar fila de recrutamento ──────────────────────
  // Cada tropa tem um tempo fixo; processa unidade por unidade
  while (filaRecrutamento.length > 0) {
    const tarefa = filaRecrutamento[0];
    if (tarefa.quantidade <= 0) { filaRecrutamento.shift(); continue; }

    const duracao = tarefa.fimTempo - tarefa.inicioTempo;
    const tempoPorUnidade = duracao / tarefa.quantidade;
    if (tempoPorUnidade <= 0) { filaRecrutamento.shift(); continue; }

    // Quantas unidades ficaram prontas desde inicioTempo?
    const tempoDecorrido = agora - tarefa.inicioTempo;
    const unidadesProntas = Math.min(
      tarefa.quantidade,
      Math.floor(tempoDecorrido / tempoPorUnidade)
    );

    if (unidadesProntas > 0) {
      unidades[tarefa.unidade] = (unidades[tarefa.unidade] || 0) + unidadesProntas;
      tarefa.quantidade -= unidadesProntas;
      tarefa.inicioTempo += unidadesProntas * tempoPorUnidade;
    }

    if (tarefa.quantidade <= 0) {
      filaRecrutamento.shift();
    } else {
      break; // Ainda há unidades na tarefa atual — para de processar
    }
  }

  // ── 4. Calcular produção de recursos (on-the-fly) ──────────
  const e = edificios;
  const madeiraPorHora = calcularProducaoRecurso(e['serraria'] || 0, EDIFICIOS['serraria'].multiplicadorProducao);
  const pedraPorHora = calcularProducaoRecurso(e['pedreira'] || 0, EDIFICIOS['pedreira'].multiplicadorProducao);
  const prataPorHora = calcularProducaoRecurso(e['mina-de-prata'] || 0, EDIFICIOS['mina-de-prata'].multiplicadorProducao);
  const favorPorHora = calcularProducaoFavor(cidade.deusAtual, e['templo'] || 0);

  return {
    ...cidade,
    edificios,
    unidades,
    fila,
    filaRecrutamento,
    populacaoMaxima: popMaxFinal,
    recursosMaximos: recursosMax,
    madeira: Math.min(recursosMax, cidade.madeira + (madeiraPorHora / 3600) * deltaSegundos),
    pedra: Math.min(recursosMax, cidade.pedra + (pedraPorHora / 3600) * deltaSegundos),
    prata: Math.min(recursosMax, cidade.prata + (prataPorHora / 3600) * deltaSegundos),
    populacao: Math.min(popMax, cidade.populacao + populacaoExtra),
    favor: Math.min(cidade.favorMaximo, cidade.favor + (favorPorHora / 3600) * deltaSegundos),
    ultimaAtualizacao: new Date(),
  };
}

// Mantido para compatibilidade, mas com validação
export async function salvarEstadoCidade(userId: string, data: Record<string, unknown>) {
  const existente = await prisma.cidade.findFirst({ where: { userId } });
  if (!existente) return null;

  // NUNCA confiar numeros de recursos enviados pelo cliente.
  // Recalcular com base no tempo decorrido.
  const raw = existente as unknown as Record<string, unknown>;
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
    mapaX: (raw.mapaX as number) ?? 0,
    mapaY: (raw.mapaY as number) ?? 0,
    ilha: (raw.ilha as number) ?? 0,
    aliacaId: (raw.aliacaId as string | null) ?? null,
    loginStreak: (raw.loginStreak as number) ?? 0,
    ultimoLogin: (raw.ultimoLogin as Date | null) ?? null,
    ultimoPoderUsado: (raw.ultimoPoderUsado as Date | null) ?? null,
    poderesUsadosHoje: (raw.poderesUsadosHoje as Record<string, unknown>) ?? {},
    pontos: (raw.pontos as number) ?? 0,
    nivelMaravilha: (raw.nivelMaravilha as number) ?? 0,
    protecaoOfflineAte: (raw.protecaoOfflineAte as Date | null) ?? null,
  });

  return prisma.cidade.update({
    where: { id: existente.id },
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
      mapaX: dadosRecalculados.mapaX,
      mapaY: dadosRecalculados.mapaY,
      ilha: dadosRecalculados.ilha,
      aliacaId: dadosRecalculados.aliacaId,
      loginStreak: dadosRecalculados.loginStreak,
      ultimoLogin: dadosRecalculados.ultimoLogin,
      ultimoPoderUsado: dadosRecalculados.ultimoPoderUsado,
      poderesUsadosHoje: dadosRecalculados.poderesUsadosHoje as object,
      pontos: dadosRecalculados.pontos,
      nivelMaravilha: dadosRecalculados.nivelMaravilha,
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
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });
    return { sucesso: true };
  }

  // Auto-registro: gerar email placeholder se não fornecido
  const email = `${username}@auto-generated.local`;
  return registrarUsuario(email, username, senha, nomeCidade);
}
