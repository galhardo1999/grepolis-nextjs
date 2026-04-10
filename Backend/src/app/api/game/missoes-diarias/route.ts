// ============================================================
// API: Missoes Diarias — GET para listar, POST para coletar
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMissoesDoDia, dataChave } from '@/lib/missoes-diarias';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('session')?.value;
    if (!token) return NextResponse.json({ erro: 'Nao autenticado' }, { status: 401 });

    const session = await prisma.session.findUnique({
      where: { tokenHash: token },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ erro: 'Sessao expirada' }, { status: 401 });
    }

    const cidade = await prisma.cidade.findUnique({
      where: { userId: session.userId },
    });
    if (!cidade) return NextResponse.json({ erro: 'Cidade nao encontrada' }, { status: 404 });

    // Missoes de hoje
    const missoesHoje = getMissoesDoDia(new Date());
    const hoje = dataChave(new Date());

    // Completadas hoje
    const inicioDia = new Date(hoje + 'T00:00:00Z');
    const fimDia = new Date(inicioDia.getTime() + 86400000);
    const completadas = await prisma.missaoDiariaCompletada.findMany({
      where: { cidadeId: cidade.id, data: { gte: inicioDia, lt: fimDia } },
    });
    const completadasIds = new Set(completadas.map(c => c.missaoId));
    const coletadasIds = new Set(completadas.filter(c => c.coletada).map(c => c.missaoId));

    const missoes = missoesHoje.map((missao) => {
      const completa = completadasIds.has(missao.id);
      const coletada = coletadasIds.has(missao.id);
      return {
        id: missao.id,
        titulo: missao.titulo,
        descricao: missao.descricao,
        recompensa: missao.recompensa,
        dificuldade: missao.dificuldade,
        completa,
        coletada,
      };
    });

    return NextResponse.json({ missoes });
  } catch {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('session')?.value;
    if (!token) return NextResponse.json({ erro: 'Nao autenticado' }, { status: 401 });

    const session = await prisma.session.findUnique({
      where: { tokenHash: token },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ erro: 'Sessao expirada' }, { status: 401 });
    }

    const cidade = await prisma.cidade.findUnique({
      where: { userId: session.userId },
    });
    if (!cidade) return NextResponse.json({ erro: 'Cidade nao encontrada' }, { status: 404 });

    const body = await req.json();
    const { missaoId } = body as { missaoId?: string };
    if (!missaoId) return NextResponse.json({ erro: 'missaoId necessario' }, { status: 400 });

    const hoje = dataChave(new Date());
    const missoesHoje = getMissoesDoDia(new Date());
    const missaoDef = missoesHoje.find(m => m.id === missaoId);
    if (!missaoDef) return NextResponse.json({ erro: 'Missao nao encontrada hoje' }, { status: 404 });

    // Verificar se ja coletou hoje
    const inicioDia = new Date(hoje + 'T00:00:00Z');
    const fimDia = new Date(inicioDia.getTime() + 86400000);
    const existentes = await prisma.missaoDiariaCompletada.findMany({
      where: { cidadeId: cidade.id, missaoId, data: { gte: inicioDia, lt: fimDia } },
    });
    if (existentes.length > 0 && existentes[0].coletada) return NextResponse.json({ erro: 'Ja coletada hoje' }, { status: 400 });

    const estado = {
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
      edificios: cidade.edificios as Record<string, number>,
      unidades: cidade.unidades as Record<string, number>,
      pesquisasConcluidas: cidade.pesquisasConcluidas,
      missoesColetadas: cidade.missoesColetadas,
      fila: cidade.fila as any[],
      filaRecrutamento: cidade.filaRecrutamento as any[],
      cooldownsAldeias: cidade.cooldownsAldeias as Record<string, number>,
      deusAtual: cidade.deusAtual,
      poderesUsadosHoje: (cidade.poderesUsadosHoje ?? {}) as Record<string, number>,
      ultimaAtualizacao: cidade.ultimaAtualizacao.getTime(),
      nomeCidade: cidade.nomeCidade,
    };

    const progresso = missaoDef.verificarProgresso(estado as any);
    if (progresso.atual < progresso.necessario) {
      return NextResponse.json({ erro: 'Missao nao completa' }, { status: 400 });
    }

    // Aplicar recompensas
    const updateData: Record<string, unknown> = {};
    const rec = missaoDef.recompensa;
    if (rec.madeira) updateData.madeira = Math.min(cidade.recursosMaximos, cidade.madeira + rec.madeira);
    if (rec.pedra) updateData.pedra = Math.min(cidade.recursosMaximos, cidade.pedra + rec.pedra);
    if (rec.prata) updateData.prata = Math.min(cidade.recursosMaximos, cidade.prata + rec.prata);
    if (rec.favor) updateData.favor = Math.min(cidade.favorMaximo, cidade.favor + rec.favor);

    await prisma.$transaction([
      prisma.cidade.update({ where: { id: cidade.id }, data: updateData }),
      existentes.length > 0
        ? prisma.missaoDiariaCompletada.update({
            where: { id: existentes[0].id },
            data: { coletada: true },
          })
        : prisma.missaoDiariaCompletada.create({
            data: { cidadeId: cidade.id, missaoId, data: inicioDia, coletada: true },
          }),
    ]);

    return NextResponse.json({ sucesso: true, recompensa: rec });
  } catch {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
