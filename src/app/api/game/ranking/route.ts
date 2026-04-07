// ============================================================
// API: Ranking — Leaderboard global
// GET: Lista ranking por categorias
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const cidadeAtual = await prisma.cidade.findFirst({
    where: { userId: session.userId },
    select: { id: true, nomeCidade: true },
  });
  if (!cidadeAtual) return NextResponse.json({ erro: 'Cidade não encontrada' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get('categoria') || 'pontos'; // pontos, militar, marvilha
  const pagina = parseInt(searchParams.get('pagina') || '0');
  const porPagina = 20;

  let orderBy: Record<string, 'desc' | 'asc'>;
  switch (categoria) {
    case 'maravilha':
      orderBy = { nivelMaravilha: 'desc' as const };
      break;
    default:
      orderBy = { pontos: 'desc' as const };
  }

  const cities = await prisma.cidade.findMany({
    where: {},
    select: {
      id: true,
      nomeCidade: true,
      pontos: true,
      nivelMaravilha: true,
      mapaX: true,
      mapaY: true,
      user: { select: { username: true } },
      aliaca: { select: { tag: true, nome: true } },
    },
    orderBy,
    skip: pagina * porPagina,
    take: porPagina,
  });

  // Minha posição
  const minhaPosicao = await prisma.cidade.findMany({
    select: { id: true },
    orderBy,
  });
  const meuIndex = minhaPosicao.findIndex((c: { id: string }) => c.id === cidadeAtual.id) + 1;

  // Ranking por aliança
  const aliancas = await prisma.alianca.findMany({
    select: {
      id: true,
      nome: true,
      tag: true,
      membros: {
        select: { pontos: true },
      },
    },
    take: 20,
  });

  const rankingAliancas = aliancas
    .map(a => ({
      id: a.id,
      nome: a.nome,
      tag: a.tag,
      membrosCount: a.membros.length,
      pontosTotais: a.membros.reduce((sum: number, m: { pontos: number }) => sum + m.pontos, 0),
    }))
    .sort((a, b) => b.pontosTotais - a.pontosTotais);

  return NextResponse.json({
    ranking: cities.map((c, i) => ({
      posicao: pagina * porPagina + i + 1,
      id: c.id,
      nomeCidade: c.nomeCidade,
      username: c.user.username,
      pontos: c.pontos,
      nivelMaravilha: c.nivelMaravilha,
      aliacaTag: c.aliaca?.tag || null,
      aliacaNome: c.aliaca?.nome || null,
    })),
    minhasPosicoes: {
      pontos: meuIndex,
    },
    rankingAliancas: rankingAliancas.map((a, i) => ({
      posicao: i + 1,
      id: a.id,
      nome: a.nome,
      tag: a.tag,
      membrosCount: a.membrosCount,
      pontosTotais: a.pontosTotais,
    })),
    pagina,
    totalPaginas: Math.ceil(minhaPosicao.length / porPagina),
  });
}
