// ============================================================
// API: Ataques — Enviar e consultar ataques
// GET: Lista ataques em transito do jogador
// POST: Enviar ataque para outra cidade
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-helpers';
import { AuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verificarProtecao } from '@/lib/protecao';

const TEMPO_VIAGEM_MINUTOS = 5; // 5 min de viagem entre cidades

export const GET = withAuth(async (_req: NextRequest, session: AuthSession) => {
  const cidade = await prisma.cidade.findFirst({ where: { userId: session.userId } });
  if (!cidade) return NextResponse.json({ erro: 'Cidade não encontrada' }, { status: 404 });

  const ataquesEnvados = await prisma.ataque.findMany({
    where: { atacanteCidadeId: cidade.id, processado: false },
    orderBy: { tempoChegada: 'asc' },
  });

  const ataquesRecebidos = await prisma.ataque.findMany({
    where: { defensorCidadeId: cidade.id, processado: false },
    include: { atacante: { select: { user: { select: { username: true } }, nomeCidade: true } } },
    orderBy: { tempoChegada: 'asc' },
  });

  const relatorios = await prisma.relatorioCombate.findMany({
    where: { cidadeId: cidade.id },
    orderBy: { dataOcorrencia: 'desc' },
    take: 50,
  });

  return NextResponse.json({
    cidadeId: cidade.id,
    ataquesEnviados: ataquesEnvados.map(a => ({
      id: a.id,
      tipo: a.tipo,
      defensorTipo: a.defensorTipo,
      tempoChegada: a.tempoChegada.getTime(),
      processado: a.processado,
    })),
    ataquesRecebidos: ataquesRecebidos.map(a => ({
      id: a.id,
      atacanteUsername: a.atacante.user.username,
      atacanteCidadeNome: a.atacante.nomeCidade,
      tempoChegada: a.tempoChegada.getTime(),
    })),
    relatorios: relatorios.map(r => ({
      id: r.id,
      titulo: r.titulo,
      tipo: r.tipo,
      conteudo: r.conteudo,
      contraQuem: r.contraQuem,
      data: r.dataOcorrencia.getTime(),
      lido: r.lido,
    })),
  });
});

export const POST = withAuth(async (req: NextRequest, session: AuthSession) => {
  const cidadeAtual = await prisma.cidade.findFirst({
    where: { userId: session.userId },
    include: { user: { select: { username: true } } },
  });
  if (!cidadeAtual) return NextResponse.json({ erro: 'Cidade não encontrada' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Body inválido' }, { status: 400 });
  }

  const { alvoId, exercito, tipo } = body as { alvoId: string; exercito: Record<string, number>; tipo: string };

  if (!alvoId || !exercito || !tipo) {
    return NextResponse.json({ erro: 'Dados insuficientes' }, { status: 400 });
  }

  if (tipo !== 'saque' && tipo !== 'ataque') {
    return NextResponse.json({ erro: 'Tipo de ataque inválido' }, { status: 400 });
  }

  // Verificar se tem tropas suficientes
  const unidadesAtuais = cidadeAtual.unidades as Record<string, number>;
  for (const [id, qtd] of Object.entries(exercito)) {
    if ((unidadesAtuais[id] || 0) < (qtd as number)) {
      return NextResponse.json({ erro: `Tropas insuficientes: ${id}` }, { status: 400 });
    }
  }

  const totalTropas = Object.values(exercito).reduce((a, b) => a + b, 0);
  if (totalTropas <= 0) {
    return NextResponse.json({ erro: 'Envie pelo menos uma tropa' }, { status: 400 });
  }

  // Não pode atacar a si mesmo
  if (alvoId === cidadeAtual.id) {
    return NextResponse.json({ erro: 'Não pode atacar a si mesmo' }, { status: 400 });
  }

  // Buscar defensor antes de verificar proteção
  const defensor = await prisma.cidade.findUnique({
    where: { id: alvoId },
    include: { user: { select: { username: true } } },
  });

  if (!defensor) {
    return NextResponse.json({ erro: 'Alvo não encontrado' }, { status: 404 });
  }

  // Verificar proteção de escudo do atacante
  const protecaoAtacante = await verificarProtecao(cidadeAtual.id);
  if (protecaoAtacante.protegido) {
    return NextResponse.json({
      erro: 'Você está sob proteção de escudo e não pode atacar.',
      tempoRestante: protecaoAtacante.tempoRestanteMinutos,
    }, { status: 400 });
  }

  // Verificar proteção de escudo do defensor
  const protecaoDefensor = await verificarProtecao(defensor.id);
  if (protecaoDefensor.protegido) {
    return NextResponse.json({
      erro: `Alvo protegido por escudo (${Math.ceil(protecaoDefensor.tempoRestanteMinutos)}min restante).`,
    }, { status: 400 });
  }

  const agora = new Date();
  const chegada = new Date(agora.getTime() + TEMPO_VIAGEM_MINUTOS * 60 * 1000);

  // Descontar tropas do atacante
  const novasUnidades: Record<string, number> = {};
  for (const [id, qtd] of Object.entries(unidadesAtuais)) {
    novasUnidades[id] = (qtd || 0) - (exercito[id] || 0);
  }

  await prisma.$transaction([
    // Atualizar unidades do atacante
    prisma.cidade.update({
      where: { id: cidadeAtual.id },
      data: {
        unidades: novasUnidades as object,
        ultimaAtualizacao: agora,
      },
    }),

    // Criar registro de ataque
    prisma.ataque.create({
      data: {
        atacanteCidadeId: cidadeAtual.id,
        defensorCidadeId: defensor.id,
        defensorTipo: 'cidade',
        defensorAldeiaId: undefined,
        exercito: exercito as object,
        defensores: defensor.unidades as object, // Snapshot do exercito defensor
        tipo: tipo as string,
        tempoPartida: agora,
        tempoChegada: chegada,
        processado: false,
        atacanteAliancaId: cidadeAtual.aliacaId || undefined,
        defensorAliancaId: defensor.aliacaId || undefined,
      },
    }),

    // Avisar defensor via relatório
    prisma.relatorioCombate.create({
      data: {
        cidadeId: defensor.id,
        titulo: '⚠️ Ataque Entrante!',
        conteudo: {
          atacanteUsername: cidadeAtual.user.username,
          atacanteCidade: cidadeAtual.nomeCidade,
          exercito: exercito,
          tempoChegada: chegada.getTime(),
        } as object,
        tipo: 'alerta',
        contraQuem: cidadeAtual.user.username,
      },
    }),
  ]);

  return NextResponse.json({
    sucesso: true,
    tempoChegada: chegada.getTime(),
    mensagem: `Ataque enviado contra ${defensor.nomeCidade} de ${defensor.user.username}. Chegada em ${TEMPO_VIAGEM_MINUTOS} min.`,
  });
});
