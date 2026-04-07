// ============================================================
// API: Login Streak — Registro e recompensas
// POST: Registrar login diário (chamado pelo /game page load)
// ============================================================

import { NextResponse } from 'next/server';
import { getSession, getCidadeByUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calcularProximoStreak, RECOMPENSAS_STREAK } from '@/lib/login-streak';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const cidadeDb = await getCidadeByUserId(session.userId);
  if (!cidadeDb) return NextResponse.json({ erro: 'Cidade não encontrada' }, { status: 404 });

  const { streak, recompensa } = calcularProximoStreak(
    cidadeDb.ultimoLogin,
    cidadeDb.loginStreak || 0,
  );

  let rewardsApplied = null;

  if (recompensa) {
    await prisma.cidade.update({
      where: { id: cidadeDb.id },
      data: {
        loginStreak: streak,
        ultimoLogin: new Date(),
        madeira: { increment: recompensa.madeira },
        pedra: { increment: recompensa.pedra },
        prata: { increment: recompensa.prata },
        favor: { increment: recompensa.favor },
      },
    });

    rewardsApplied = {
      madeira: recompensa.madeira,
      pedra: recompensa.pedra,
      prata: recompensa.prata,
      favor: recompensa.favor,
      bonusEspecial: recompensa.bonusEspecial || null,
    };
  } else {
    await prisma.cidade.update({
      where: { id: cidadeDb.id },
      data: {
        loginStreak: streak,
        ultimoLogin: new Date(),
      },
    });
  }

  return NextResponse.json({
    streak,
    recompensaAtual: RECOMPENSAS_STREAK[(streak - 1) % 7],
    proximaRecompensa: RECOMPENSAS_STREAK[streak % 7],
    rewardsApplied,
  });
}
