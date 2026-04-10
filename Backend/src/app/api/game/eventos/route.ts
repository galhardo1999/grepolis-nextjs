// ============================================================
// API: Eventos Mundiais — GET lista eventos ativos, POST cria (admin)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DEFINICOES_EVENTOS, criarEvento, EventoTipo } from '@/lib/eventos';

export async function GET() {
  try {
    const agora = new Date();
    const eventos = await prisma.eventoMundial.findMany({
      where: { ativo: true, tempoFim: { gte: agora } },
      orderBy: { tempoFim: 'asc' },
    });

    const eventosComInfo = eventos.map((e) => {
      const def = DEFINICOES_EVENTOS[e.tipo as EventoTipo];
      return {
        id: e.id,
        tipo: e.tipo,
        nome: def?.nome ?? e.tipo,
        descricao: def?.descricao ?? '',
        tempoFim: e.tempoFim.getTime(),
        tempoRestanteMinutos: Math.max(0, (e.tempoFim.getTime() - agora.getTime()) / 60000),
      };
    });

    return NextResponse.json({ eventos: eventosComInfo });
  } catch {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

// POST: criar evento (sem auth por enquanto — depois proteger)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tipo, duracaoMinutos } = body as { tipo?: string; duracaoMinutos?: number };
    if (!tipo || !(tipo in DEFINICOES_EVENTOS)) {
      return NextResponse.json({ erro: 'Tipo de evento invalido' }, { status: 400 });
    }

    await criarEvento(tipo as EventoTipo, duracaoMinutos);
    return NextResponse.json({ sucesso: true });
  } catch {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
