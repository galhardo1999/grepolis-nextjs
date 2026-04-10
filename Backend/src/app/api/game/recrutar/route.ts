// ============================================================
// API: Recrutar Unidades — Validação e persistência no servidor
// POST { unidade: IdUnidade, quantidade: number }
// Retorna o estado atualizado da cidade ou erro
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-helpers';
import { getCidadeByUserId, recalcularEstadoServidor, DadosCidade, AuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UNIDADES } from '@/lib/unidades';
import {
  TEMPO_TREINAMENTO_UNIDADES,
  TAMANHO_MAXIMO_FILA_RECRUTAMENTO,
} from '@/lib/config';
import { formatarEstadoParaCliente } from '@/lib/utils';

interface ItemFilaRecrutamentoServidor {
  unidade: string;
  quantidade: number;
  inicioTempo: number;
  fimTempo: number;
}

export const POST = withAuth(async (req: NextRequest, session: AuthSession) => {
  let body: { unidade?: string; quantidade?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Body inválido' }, { status: 400 });
  }

  const { unidade: idUnidade, quantidade } = body;
  if (!idUnidade || !quantidade || quantidade <= 0) {
    return NextResponse.json({ erro: 'Dados inválidos' }, { status: 400 });
  }
  if (!(idUnidade in UNIDADES)) {
    return NextResponse.json({ erro: 'Unidade inválida' }, { status: 400 });
  }

  const cidadeRaw = await getCidadeByUserId(session.userId);
  if (!cidadeRaw) return NextResponse.json({ erro: 'Cidade não encontrada' }, { status: 404 });

  // 1. Recalcular estado atual (processa filas pendentes)
  const cidade = recalcularEstadoServidor(cidadeRaw as unknown as DadosCidade);

  const edificios = cidade.edificios as Record<string, number>;
  const filaRecrutamento = (cidade.filaRecrutamento as ItemFilaRecrutamentoServidor[]);
  const pesquisas = cidade.pesquisasConcluidas as string[];

  // 2. Validações
  if (filaRecrutamento.length >= TAMANHO_MAXIMO_FILA_RECRUTAMENTO) {
    return NextResponse.json({ erro: `Fila cheia (Máximo ${TAMANHO_MAXIMO_FILA_RECRUTAMENTO})` }, { status: 400 });
  }

  const unidadeConfig = UNIDADES[idUnidade as keyof typeof UNIDADES];
  if (!unidadeConfig) {
    return NextResponse.json({ erro: 'Unidade não encontrada' }, { status: 400 });
  }

  const isNaval = ['birreme', 'navio-de-transporte', 'trirreme'].includes(idUnidade);
  if (isNaval && !pesquisas.includes('navegacao')) {
    return NextResponse.json({ erro: 'Requer pesquisa: Navegação Avançada' }, { status: 400 });
  }
  if (isNaval && (edificios['porto'] || 0) === 0) {
    return NextResponse.json({ erro: 'Requer Porto construído' }, { status: 400 });
  }

  const custosTotal = {
    madeira: unidadeConfig.custos.madeira * quantidade,
    pedra: unidadeConfig.custos.pedra * quantidade,
    prata: unidadeConfig.custos.prata * quantidade,
    populacao: unidadeConfig.custos.populacao * quantidade,
  };

  if (cidade.madeira < custosTotal.madeira ||
    cidade.pedra < custosTotal.pedra ||
    cidade.prata < custosTotal.prata) {
    return NextResponse.json({ erro: 'Recursos insuficientes' }, { status: 400 });
  }
  if (cidade.populacao < custosTotal.populacao) {
    return NextResponse.json({ erro: 'População insuficiente' }, { status: 400 });
  }

  // 3. Calcular tempo de recrutamento
  const nivelEdificio = isNaval ? (edificios['porto'] || 0) : (edificios['quartel'] || 0);
  const reducao = Math.pow(0.95, nivelEdificio);
  const temEstrategia = pesquisas.includes('estrategia');
  const reducaoEstrategia = temEstrategia ? 0.80 : 1;
  const tempoFinalSegundos = (unidadeConfig.tempoBase * quantidade * reducao * reducaoEstrategia) / TEMPO_TREINAMENTO_UNIDADES;

  const agora = Date.now();
  const inicioTempo = filaRecrutamento.length > 0
    ? filaRecrutamento[filaRecrutamento.length - 1].fimTempo
    : agora;
  const fimTempo = inicioTempo + Math.round(tempoFinalSegundos * 1000);

  // 4. Aplicar e salvar no banco
  const novaFilaRecrutamento: ItemFilaRecrutamentoServidor[] = [
    ...filaRecrutamento,
    { unidade: idUnidade, quantidade, inicioTempo, fimTempo },
  ];

  const dadosParaSalvar: Parameters<typeof prisma.cidade.update>[0]['data'] = {
    madeira: Math.floor(cidade.madeira) - custosTotal.madeira,
    pedra: Math.floor(cidade.pedra) - custosTotal.pedra,
    prata: Math.floor(cidade.prata) - custosTotal.prata,
    populacao: Math.floor(cidade.populacao) - custosTotal.populacao,
    populacaoMaxima: cidade.populacaoMaxima,
    recursosMaximos: cidade.recursosMaximos,
    favor: Math.floor(cidade.favor),
    edificios: cidade.edificios as object,
    unidades: cidade.unidades as object,
    pesquisasConcluidas: cidade.pesquisasConcluidas,
    missoesColetadas: cidade.missoesColetadas,
    fila: cidade.fila as object,
    filaRecrutamento: novaFilaRecrutamento as object,
    cooldownsAldeias: cidade.cooldownsAldeias,
    nomeCidade: cidade.nomeCidade,
    ultimaAtualizacao: new Date(),
  };

  await prisma.cidade.update({
    where: { id: cidadeRaw.id },
    data: dadosParaSalvar,
  });

  // 5. Retornar estado para o cliente
  const estadoRetornado: DadosCidade = {
    ...(cidade as DadosCidade),
    madeira: (dadosParaSalvar.madeira as number),
    pedra: (dadosParaSalvar.pedra as number),
    prata: (dadosParaSalvar.prata as number),
    populacao: (dadosParaSalvar.populacao as number),
    filaRecrutamento: novaFilaRecrutamento,
    ultimaAtualizacao: new Date(),
  };

  return NextResponse.json({ sucesso: true, estado: formatarEstadoParaCliente(estadoRetornado) });
});
