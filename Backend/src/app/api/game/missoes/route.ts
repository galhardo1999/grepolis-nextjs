// ============================================================
// API: Coletar Missão — Valida e persiste no banco de dados
// POST { missaoId: string }
// Retorna o estado atualizado da cidade ou erro
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-helpers';
import { getCidadeByUserId, recalcularEstadoServidor, DadosCidade, AuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MISSOES } from '@/lib/missoes';
import { EstadoJogo } from '@/store/gameStore';

export const POST = withAuth(async (req: NextRequest, session: AuthSession) => {
  let body: { missaoId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Body inválido' }, { status: 400 });
  }

  const { missaoId } = body;
  if (!missaoId) {
    return NextResponse.json({ erro: 'ID de missão inválido' }, { status: 400 });
  }

  const missao = MISSOES.find(m => m.id === missaoId);
  if (!missao) {
    return NextResponse.json({ erro: 'Missão não encontrada' }, { status: 400 });
  }

  const cidadeRaw = await getCidadeByUserId(session.userId);
  if (!cidadeRaw) return NextResponse.json({ erro: 'Cidade não encontrada' }, { status: 404 });

  // 1. Recalcular estado atual antes de validar
  const cidade = recalcularEstadoServidor(cidadeRaw as unknown as DadosCidade);

  const missoesColetadas = cidade.missoesColetadas as string[];

  // 2. Verificar se já foi coletada
  if (missoesColetadas.includes(missaoId)) {
    return NextResponse.json({ erro: 'Missão já coletada' }, { status: 400 });
  }

  // 3. Verificar se a missão foi concluída (usando o estado atual do servidor)
  const estadoParaVerificar: EstadoJogo = {
    recursos: {
      madeira: cidade.madeira,
      pedra: cidade.pedra,
      prata: cidade.prata,
      populacao: cidade.populacao,
      populacaoMaxima: cidade.populacaoMaxima,
      recursosMaximos: cidade.recursosMaximos,
      favor: cidade.favor,
      favorMaximo: cidade.favorMaximo,
      prataNaGruta: cidade.prataNaGruta,
    },
    deusAtual: cidade.deusAtual as import('@/lib/deuses').IdDeus | null,
    edificios: cidade.edificios as Record<string, number>,
    unidades: cidade.unidades as Record<string, number>,
    pesquisasConcluidas: cidade.pesquisasConcluidas as import('@/lib/pesquisas').IdPesquisa[],
    missoesColetadas: missoesColetadas,
    fila: cidade.fila as import('@/store/gameStore').ItemFila[],
    filaRecrutamento: cidade.filaRecrutamento as import('@/store/gameStore').ItemFilaRecrutamento[],
    ultimaAtualizacao: Date.now(),
    nomeCidade: cidade.nomeCidade,
    cooldownsAldeias: cidade.cooldownsAldeias as Record<string, number>,
    poderesUsadosHoje: (cidade.poderesUsadosHoje ?? {}) as Record<string, number>,
  };

  if (!missao.verificarConclusao(estadoParaVerificar)) {
    return NextResponse.json({ erro: 'Missão ainda não concluída' }, { status: 400 });
  }

  // 4. Aplicar recompensa capped pelo max de recursos
  const recompensa = missao.recompensa;
  const recursosMax = cidade.recursosMaximos;

  const novaMadeira = Math.min(recursosMax, Math.floor(cidade.madeira) + (recompensa.madeira ?? 0));
  const novaPedra = Math.min(recursosMax, Math.floor(cidade.pedra) + (recompensa.pedra ?? 0));
  const novaPrata = Math.min(recursosMax, Math.floor(cidade.prata) + (recompensa.prata ?? 0));
  const novoFavor = Math.min(cidade.favorMaximo, Math.floor(cidade.favor) + (recompensa.favor ?? 0));
  const novasMissoesColetadas = [...missoesColetadas, missaoId];

  // 5. Salvar no banco
  await prisma.cidade.update({
    where: { id: cidadeRaw.id },
    data: {
      madeira: novaMadeira,
      pedra: novaPedra,
      prata: novaPrata,
      favor: novoFavor,
      missoesColetadas: novasMissoesColetadas,
      // Preservar todo o resto calculado
      populacao: Math.floor(cidade.populacao),
      populacaoMaxima: cidade.populacaoMaxima,
      recursosMaximos: cidade.recursosMaximos,
      prataNaGruta: cidade.prataNaGruta,
      edificios: cidade.edificios as object,
      unidades: cidade.unidades as object,
      pesquisasConcluidas: cidade.pesquisasConcluidas,
      fila: cidade.fila as object,
      filaRecrutamento: cidade.filaRecrutamento as object,
      cooldownsAldeias: cidade.cooldownsAldeias,
      ultimaAtualizacao: new Date(),
    },
  });

  // 6. Retornar estado atualizado para o cliente sincronizar
  return NextResponse.json({
    sucesso: true,
    estado: {
      recursos: {
        madeira: novaMadeira,
        pedra: novaPedra,
        prata: novaPrata,
        populacao: Math.floor(cidade.populacao),
        populacaoMaxima: cidade.populacaoMaxima,
        recursosMaximos: cidade.recursosMaximos,
        favor: novoFavor,
        favorMaximo: cidade.favorMaximo,
        prataNaGruta: cidade.prataNaGruta,
      },
      edificios: cidade.edificios,
      unidades: cidade.unidades,
      pesquisasConcluidas: cidade.pesquisasConcluidas,
      missoesColetadas: novasMissoesColetadas,
      fila: cidade.fila,
      filaRecrutamento: cidade.filaRecrutamento,
      cooldownsAldeias: cidade.cooldownsAldeias,
      nomeCidade: cidade.nomeCidade,
      deusAtual: cidade.deusAtual,
      ultimaAtualizacao: Date.now(),
    },
  });
});
