// ============================================================
// API: Construir Edifício — Validação e persistência no servidor
// POST { edificio: IdEdificio }
// Retorna o estado atualizado da cidade ou erro
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-helpers';
import { getCidadeByUserId, recalcularEstadoServidor, DadosCidade, AuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EDIFICIOS } from '@/lib/edificios';
import {
  TEMPO_CONSTRUCAO_EDIFICIOS,
  TAMANHO_MAXIMO_FILA_OBRAS,
} from '@/lib/config';
import { formatarEstadoParaCliente } from '@/lib/utils';

// Tipos da fila (espelhados do gameStore para uso no servidor)
interface ItemFilaServidor {
  edificio: string;
  inicioTempo: number;
  fimTempo: number;
  nivel: number;
}

export const POST = withAuth(async (req: NextRequest, session: AuthSession) => {
  let body: { edificio?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Body inválido' }, { status: 400 });
  }

  const { edificio: idEdificio } = body;
  if (!idEdificio || !(idEdificio in EDIFICIOS)) {
    return NextResponse.json({ erro: 'Edifício inválido' }, { status: 400 });
  }

  const cidadeRaw = await getCidadeByUserId(session.userId);
  if (!cidadeRaw) return NextResponse.json({ erro: 'Cidade não encontrada' }, { status: 404 });

  // 1. Recalcular estado atual (processa filas pendentes antes de validar)
  const cidade = recalcularEstadoServidor(cidadeRaw as unknown as DadosCidade);

  const edificios = cidade.edificios as Record<string, number>;
  const fila = (cidade.fila as ItemFilaServidor[]);
  const pesquisas = cidade.pesquisasConcluidas as string[];

  // 2. Validações (espelham gameStore.melhorarEdificio)
  if (fila.length >= TAMANHO_MAXIMO_FILA_OBRAS) {
    return NextResponse.json({ erro: `Fila de obras cheia (Máximo ${TAMANHO_MAXIMO_FILA_OBRAS})` }, { status: 400 });
  }

  const edificioConfig = EDIFICIOS[idEdificio as keyof typeof EDIFICIOS];
  if (!edificioConfig) {
    return NextResponse.json({ erro: 'Edifício não encontrado' }, { status: 400 });
  }

  // Verificar requisitos
  if ('requisitos' in edificioConfig && edificioConfig.requisitos) {
    const reqs = edificioConfig.requisitos as Record<string, number>;
    for (const [idReq, nivelReq] of Object.entries(reqs)) {
      const nivelAtualReq = (edificios[idReq] || 0) + fila.filter(f => f.edificio === idReq).length;
      if (nivelAtualReq < nivelReq) {
        const reqConfig = EDIFICIOS[idReq as keyof typeof EDIFICIOS];
        return NextResponse.json({
          erro: `Requer ${reqConfig?.nome ?? idReq} Nv. ${nivelReq}`
        }, { status: 400 });
      }
    }
  }

  const qtdPendente = fila.filter(f => f.edificio === idEdificio).length;
  const nivelAtual = (edificios[idEdificio] || 0) + qtdPendente;
  const nivelMaximo = (edificioConfig as { nivelMaximo?: number }).nivelMaximo ?? 0;

  if (nivelAtual >= nivelMaximo) {
    return NextResponse.json({ erro: 'Nível máximo atingido' }, { status: 400 });
  }

  // 3. Calcular custo do próximo nível
  const proximoNivel = nivelAtual + 1;
  const multiplicador = Math.pow(edificioConfig.multiplicadorCusto, proximoNivel - 1);
  const custos = {
    madeira: Math.floor(edificioConfig.custoBase.madeira * multiplicador),
    pedra: Math.floor(edificioConfig.custoBase.pedra * multiplicador),
    prata: Math.floor(edificioConfig.custoBase.prata * multiplicador),
  };
  const custoPop = (edificioConfig as { custoPop?: number }).custoPop ?? 0;

  // 4. Verificar recursos
  const r = cidade;
  if (r.madeira < custos.madeira || r.pedra < custos.pedra || r.prata < custos.prata) {
    return NextResponse.json({ erro: 'Recursos insuficientes' }, { status: 400 });
  }
  if (r.populacao < custoPop) {
    return NextResponse.json({ erro: 'População insuficiente (Melhore a Fazenda)' }, { status: 400 });
  }

  // 5. Calcular tempo de construção
  const temForja = pesquisas.includes('forja');
  const bonusForja = temForja ? 0.85 : 1;
  const nivelSenado = edificios['senado'] || 0;
  const bonusSenado = Math.max(0.1, 1 - nivelSenado * 0.05);
  const tempoFinalSegundos = (
    edificioConfig.tempoBase *
    Math.pow(edificioConfig.multiplicadorTempo, proximoNivel) *
    bonusSenado *
    bonusForja
  ) / TEMPO_CONSTRUCAO_EDIFICIOS;

  const agora = Date.now();
  const inicioTempo = fila.length > 0 ? fila[fila.length - 1].fimTempo : agora;
  const fimTempo = inicioTempo + Math.round(tempoFinalSegundos * 1000);

  // 6. Aplicar mudanças e salvar no banco
  const novaFila: ItemFilaServidor[] = [
    ...fila,
    { edificio: idEdificio, inicioTempo, fimTempo, nivel: proximoNivel },
  ];

  const dadosParaSalvar: Parameters<typeof prisma.cidade.update>[0]['data'] = {
    madeira: Math.floor(cidade.madeira) - custos.madeira,
    pedra: Math.floor(cidade.pedra) - custos.pedra,
    prata: Math.floor(cidade.prata) - custos.prata,
    populacao: Math.floor(cidade.populacao) - custoPop,
    populacaoMaxima: cidade.populacaoMaxima,
    recursosMaximos: cidade.recursosMaximos,
    favor: Math.floor(cidade.favor),
    edificios: cidade.edificios as object,
    unidades: cidade.unidades as object,
    pesquisasConcluidas: cidade.pesquisasConcluidas,
    missoesColetadas: cidade.missoesColetadas,
    fila: novaFila as object,
    filaRecrutamento: cidade.filaRecrutamento as object,
    cooldownsAldeias: cidade.cooldownsAldeias,
    nomeCidade: cidade.nomeCidade,
    ultimaAtualizacao: new Date(),
  };

  await prisma.cidade.update({
    where: { id: cidadeRaw.id },
    data: dadosParaSalvar,
  });

  // 7. Retornar o estado completo pós-ação para o cliente sincronizar
  const estadoRetornado: DadosCidade = {
    ...(cidade as DadosCidade),
    madeira: (dadosParaSalvar.madeira as number),
    pedra: (dadosParaSalvar.pedra as number),
    prata: (dadosParaSalvar.prata as number),
    populacao: (dadosParaSalvar.populacao as number),
    fila: novaFila,
    ultimaAtualizacao: new Date(),
  };

  return NextResponse.json({ sucesso: true, estado: formatarEstadoParaCliente(estadoRetornado) });
});
