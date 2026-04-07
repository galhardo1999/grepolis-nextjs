// ============================================================
// API: Cancelar item da fila — Construção ou Recrutamento
// POST { tipo: 'edificio' | 'recrutamento', indice: number }
// Devolve recursos, realinha a fila, salva no banco
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession, getCidadeByUserId, recalcularEstadoServidor, DadosCidade } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EDIFICIOS } from '@/lib/edificios';
import { UNIDADES } from '@/lib/unidades';

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

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  let body: { tipo?: string; indice?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Body inválido' }, { status: 400 });
  }

  const { tipo, indice } = body;
  if (tipo !== 'edificio' && tipo !== 'recrutamento') {
    return NextResponse.json({ erro: 'Tipo inválido' }, { status: 400 });
  }
  if (typeof indice !== 'number' || indice < 0) {
    return NextResponse.json({ erro: 'Índice inválido' }, { status: 400 });
  }

  const cidadeRaw = await getCidadeByUserId(session.userId);
  if (!cidadeRaw) return NextResponse.json({ erro: 'Cidade não encontrada' }, { status: 404 });

  // 1. Recalcular estado atual
  const cidade = recalcularEstadoServidor(cidadeRaw as unknown as DadosCidade);

  let madeira = Math.floor(cidade.madeira);
  let pedra = Math.floor(cidade.pedra);
  let prata = Math.floor(cidade.prata);
  let populacao = Math.floor(cidade.populacao);
  const recursosMax = cidade.recursosMaximos;

  let novaFila = (cidade.fila as ItemFilaServidor[]).map(i => ({ ...i }));
  let novaFilaRecrutamento = (cidade.filaRecrutamento as ItemFilaRecrutamentoServidor[]).map(i => ({ ...i }));

  const agora = Date.now();

  if (tipo === 'edificio') {
    if (indice >= novaFila.length) {
      return NextResponse.json({ erro: 'Item não encontrado na fila' }, { status: 404 });
    }

    const tarefa = novaFila[indice];
    const edificioConfig = EDIFICIOS[tarefa.edificio as keyof typeof EDIFICIOS];

    // Reembolsar recursos do item cancelado
    const multiplicador = Math.pow(edificioConfig.multiplicadorCusto, tarefa.nivel - 1);
    madeira = Math.min(recursosMax, madeira + Math.floor(edificioConfig.custoBase.madeira * multiplicador));
    pedra = Math.min(recursosMax, pedra + Math.floor(edificioConfig.custoBase.pedra * multiplicador));
    prata = Math.min(recursosMax, prata + Math.floor(edificioConfig.custoBase.prata * multiplicador));
    populacao += (edificioConfig as { custoPop?: number }).custoPop ?? 0;

    novaFila.splice(indice, 1);

    // Verificar dependências: remover itens que dependiam do cancelado
    const edificiosSimulados = { ...(cidade.edificios as Record<string, number>) };
    let p = 0;
    while (p < novaFila.length) {
      const item = novaFila[p];
      const cfg = EDIFICIOS[item.edificio as keyof typeof EDIFICIOS];
      let requisitoOk = true;

      if ('requisitos' in cfg && cfg.requisitos) {
        const reqs = cfg.requisitos as Record<string, number>;
        for (const [idReq, nivelReq] of Object.entries(reqs)) {
          const nivelAtualReq = (edificiosSimulados[idReq] || 0) + novaFila.slice(0, p).filter(f => f.edificio === idReq).length;
          if (nivelAtualReq < nivelReq) {
            requisitoOk = false;
            break;
          }
        }
      }

      if (!requisitoOk) {
        const cfgRemovido = EDIFICIOS[item.edificio as keyof typeof EDIFICIOS];
        const mult = Math.pow(cfgRemovido.multiplicadorCusto, item.nivel - 1);
        madeira = Math.min(recursosMax, madeira + Math.floor(cfgRemovido.custoBase.madeira * mult));
        pedra = Math.min(recursosMax, pedra + Math.floor(cfgRemovido.custoBase.pedra * mult));
        prata = Math.min(recursosMax, prata + Math.floor(cfgRemovido.custoBase.prata * mult));
        populacao += (cfgRemovido as { custoPop?: number }).custoPop ?? 0;
        novaFila.splice(p, 1);
      } else {
        p++;
      }
    }

    // Realinhar timestamps da fila restante
    for (let i = 0; i < novaFila.length; i++) {
      const item = novaFila[i];
      const duracao = item.fimTempo - item.inicioTempo;
      item.inicioTempo = i === 0 ? agora : novaFila[i - 1].fimTempo;
      item.fimTempo = item.inicioTempo + duracao;
    }

  } else {
    // Recrutamento
    if (indice >= novaFilaRecrutamento.length) {
      return NextResponse.json({ erro: 'Item não encontrado na fila de recrutamento' }, { status: 404 });
    }

    const tarefa = novaFilaRecrutamento[indice];
    const unidadeConfig = UNIDADES[tarefa.unidade as keyof typeof UNIDADES];

    madeira = Math.min(recursosMax, madeira + unidadeConfig.custos.madeira * tarefa.quantidade);
    pedra = Math.min(recursosMax, pedra + unidadeConfig.custos.pedra * tarefa.quantidade);
    prata = Math.min(recursosMax, prata + unidadeConfig.custos.prata * tarefa.quantidade);
    populacao += unidadeConfig.custos.populacao * tarefa.quantidade;

    novaFilaRecrutamento.splice(indice, 1);

    // Realinhar timestamps
    for (let i = 0; i < novaFilaRecrutamento.length; i++) {
      const item = novaFilaRecrutamento[i];
      const duracao = item.fimTempo - item.inicioTempo;
      item.inicioTempo = i === 0 ? agora : novaFilaRecrutamento[i - 1].fimTempo;
      item.fimTempo = item.inicioTempo + duracao;
    }
  }

  // 2. Salvar no banco
  await prisma.cidade.update({
    where: { id: cidadeRaw.id },
    data: {
      madeira,
      pedra,
      prata,
      populacao,
      populacaoMaxima: cidade.populacaoMaxima,
      recursosMaximos: cidade.recursosMaximos,
      favor: Math.floor(cidade.favor),
      edificios: cidade.edificios as object,
      unidades: cidade.unidades as object,
      pesquisasConcluidas: cidade.pesquisasConcluidas,
      missoesColetadas: cidade.missoesColetadas,
      fila: novaFila as object,
      filaRecrutamento: novaFilaRecrutamento as object,
      cooldownsAldeias: cidade.cooldownsAldeias,
      nomeCidade: cidade.nomeCidade,
      ultimaAtualizacao: new Date(),
    },
  });

  // 3. Retornar estado atualizado
  const estadoRetornado: DadosCidade = {
    ...(cidade as DadosCidade),
    madeira,
    pedra,
    prata,
    populacao,
    fila: novaFila,
    filaRecrutamento: novaFilaRecrutamento,
    ultimaAtualizacao: new Date(),
  };

  return NextResponse.json({ sucesso: true, estado: formatarEstadoParaCliente(estadoRetornado) });
}

function formatarEstadoParaCliente(cidade: DadosCidade) {
  return {
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
    edificios: cidade.edificios,
    unidades: cidade.unidades,
    pesquisasConcluidas: cidade.pesquisasConcluidas,
    missoesColetadas: cidade.missoesColetadas,
    fila: cidade.fila,
    filaRecrutamento: cidade.filaRecrutamento,
    cooldownsAldeias: cidade.cooldownsAldeias,
    nomeCidade: cidade.nomeCidade,
    deusAtual: cidade.deusAtual,
    ultimaAtualizacao: (cidade.ultimaAtualizacao instanceof Date)
      ? cidade.ultimaAtualizacao.getTime()
      : cidade.ultimaAtualizacao,
  };
}
