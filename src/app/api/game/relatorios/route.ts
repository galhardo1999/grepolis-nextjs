// ============================================================
// API: Processador de Ataques — Cron job que processa ataques
// Quando chamado, processa todos os ataques com tempoChegada <= now
// ============================================================

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { simularBatalha } from '@/lib/combate';
import { UNIDADES } from '@/lib/unidades';

export async function POST() {
  const agora = new Date();

  // Buscar ataques não processados com tempo de chegada passado
  const ataques = await prisma.ataque.findMany({
    where: {
      processado: false,
      defensorTipo: 'cidade',
      tempoChegada: { lte: agora },
    },
  });

  for (const ataque of ataques) {
    await processarAtaque(ataque);
  }

  return NextResponse.json({ processados: ataques.length });
}

async function processarAtaque(ataque: {
  id: string;
  atacanteCidadeId: string;
  defensorCidadeId: string | null;
  exercito: unknown;
  defensores: unknown;
  tipo: string;
  resultado: unknown;
  recursosRoubados: unknown;
}) {
  const { atacanteCidadeId, defensorCidadeId, id: ataqueId } = ataque;

  if (!defensorCidadeId) return;

  const atacante = await prisma.cidade.findUnique({
    where: { id: atacanteCidadeId },
    include: { user: { select: { username: true } } },
  });
  const defensor = await prisma.cidade.findUnique({
    where: { id: defensorCidadeId },
    include: { user: { select: { username: true } } },
  });

  if (!atacante || !defensor) {
    // Marcar como processado mesmo assim
    await prisma.ataque.update({ where: { id: ataqueId }, data: { processado: true } });
    return;
  }

  const exercitoAtacante = ataque.exercito as Record<string, number>;
  const exercitoDefensor = (defensor.unidades ?? {}) as Record<string, number>;
  const recursosDefensor = {
    madeira: defensor.madeira,
    pedra: defensor.pedra,
    prata: defensor.prata,
  };

  const nivelMuralha = ((defensor.edificios ?? {}) as Record<string, number>)['walls'] || 0;

  const bonusAtaque = atacante.pesquisasConcluidas.includes('metalurgia') ? 1.1 : 1;
  const bonusDefesa = defensor.pesquisasConcluidas.includes('escudo') ? 1.1 : 1;

  const resultado = simularBatalha(
    exercitoAtacante,
    exercitoDefensor,
    nivelMuralha,
    recursosDefensor,
    bonusAtaque,
    bonusDefesa,
  );

  // Aplicar baixas no atacante (tropas estão "em trânsito")
  const unidadesAtacanteAtual = { ...((atacante.unidades ?? {}) as Record<string, number>) };
  for (const [id, baixas] of Object.entries(resultado.baixasAtacante)) {
    const qtdEmTrnsito = exercitoAtacante[id] || 0;
    const baixasAplicadas = Math.min(baixas as number, qtdEmTrnsito);
    // Baixas já foram descontadas no envio, só precisamos remover as que sobraram menos
    const sobravam = qtdEmTrnsito - (baixasAplicadas);
    unidadesAtacanteAtual[id] = (unidadesAtacanteAtual[id] || 0) + Math.max(0, sobravam);
  }

  // Se o atacante venceu, tropas sobreviventes voltam + saque
  if (resultado.sucesso) {
    // Tropas sobreviventes voltam à cidade do atacante
    await prisma.cidade.update({
      where: { id: atacanteCidadeId },
      data: {
        unidades: unidadesAtacanteAtual as object,
        madeira: Math.min(defensor.recursosMaximos, defensor.madeira + resultado.recursosRoubados.madeira),
        pedra: Math.min(defensor.recursosMaximos, defensor.pedra + resultado.recursosRoubados.pedra),
        prata: Math.min(defensor.recursosMaximos, defensor.prata + resultado.recursosRoubados.prata),
      },
    });

    // Deduzir recursos do defensor
    const prataProtegida = ((defensor.edificios ?? {}) as Record<string, number>)['cave'] || 0;
    const protecaoGruta = prataProtegida * 300;
    const prataSaqueavel = Math.max(0, defensor.prata - protecaoGruta);
    const prataSaqueadaReal = Math.min(prataSaqueavel, resultado.recursosRoubados.prata);

    await prisma.cidade.update({
      where: { id: defensorCidadeId },
      data: {
        unidades: { ...(defensor.unidades as Record<string, number>) }, // Será atualizado abaixo
        madeira: Math.max(0, defensor.madeira - resultado.recursosRoubados.madeira),
        pedra: Math.max(0, defensor.pedra - resultado.recursosRoubados.pedra),
        prata: Math.max(0, defensor.prata - prataSaqueadaReal),
        ultimaAtualizacao: new Date(),
      },
    });

    // Aplicar baixas no defensor
    const unidadesDefensorAtual = { ...exercitoDefensor };
    for (const [id, baixas] of Object.entries(resultado.baixasDefensor)) {
      unidadesDefensorAtual[id] = Math.max(0, (unidadesDefensorAtual[id] || 0) - (baixas as number));
    }
    await prisma.cidade.update({
      where: { id: defensorCidadeId },
      data: { unidades: unidadesDefensorAtual as object },
    });
  } else {
    // Atacante perdeu: tropas que voltam são as sobreviventes que não estavam em trânsito
    await prisma.cidade.update({
      where: { id: atacanteCidadeId },
      data: { unidades: unidadesAtacanteAtual as object },
    });

    // Todas as tropas em trânsito do atacante perderam
    // Defensor mantém tropas menos baixas
    const unidadesDefensorAtual = { ...exercitoDefensor };
    for (const [id, baixas] of Object.entries(resultado.baixasDefensor)) {
      unidadesDefensorAtual[id] = Math.max(0, (unidadesDefensorAtual[id] || 0) - (baixas as number));
    }
    await prisma.cidade.update({
      where: { id: defensorCidadeId },
      data: { unidades: unidadesDefensorAtual as object },
    });
  }

  // Calcular pontos
  const pontosAtaque = Object.values(exercitoAtacante).reduce((a, b) => a + b, 0) * 10;
  const bonusPontos = resultado.sucesso ? 2 : 0;

  // Criar relatórios para ambos
  await prisma.$transaction([
    // Relatorio do atacante
    prisma.relatorioCombate.create({
      data: {
        cidadeId: atacanteCidadeId,
        titulo: resultado.sucesso ? '⚔️ Vitória!' : '💀 Derrota!',
        conteudo: {
          resultado,
          defensorCidade: defensor.nomeCidade,
          defensorUsername: defensor.user.username,
        } as object,
        tipo: resultado.sucesso ? 'vitoria' : 'derrota',
        contraQuem: defensor.user.username,
      },
    }),

    // Relatorio do defensor
    prisma.relatorioCombate.create({
      data: {
        cidadeId: defensorCidadeId,
        titulo: resultado.sucesso ? '💀 Você foi saqueado!' : '🛡️ Defesa bem-sucedida!',
        conteudo: {
          resultado,
          atacanteCidade: atacante.nomeCidade,
          atacanteUsername: atacante.user.username,
        } as object,
        tipo: resultado.sucesso ? 'derrota' : 'vitoria',
        contraQuem: atacante.user.username,
      },
    }),

    // Atualizar pontos
    prisma.cidade.update({
      where: { id: atacanteCidadeId },
      data: { pontos: { increment: pontosAtaque + bonusPontos } },
    }),
    prisma.cidade.update({
      where: { id: defensorCidadeId },
      data: { pontos: { increment: resultado.sucesso ? 0 : pontosAtaque } },
    }),

    // Marcar ataque como processado
    prisma.ataque.update({
      where: { id: ataqueId },
      data: {
        processado: true,
        resultado: {
          sucesso: resultado.sucesso,
          baixasAtacante: resultado.baixasAtacante,
          baixasDefensor: resultado.baixasDefensor,
          relatorio: resultado.relatorio,
        } as object,
        recursosRoubados: resultado.recursosRoubados as object,
      },
    }),
  ]);
}
