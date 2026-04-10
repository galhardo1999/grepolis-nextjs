// ============================================================
// API: Ranking — Leaderboard global
// GET: Lista ranking por categorias
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Simple in-memory cache for ranking data (5 second TTL)
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 5000; // 5 seconds

function getCache(key: string): unknown | null {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const cidadeAtual = await prisma.cidade.findFirst({
    where: { userId: session.userId },
    select: { id: true, nomeCidade: true, pontos: true, nivelMaravilha: true },
  });
  if (!cidadeAtual) return NextResponse.json({ erro: 'Cidade não encontrada' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get('categoria') || 'pontos';
  const pagina = parseInt(searchParams.get('pagina') || '0');

  // Check cache for paginated ranking (but not for user position which is always fresh)
  const cacheKey = `ranking:${categoria}:${pagina}`;
  const cachedRanking = getCache(cacheKey);
  const cachedAlliances = getCache('ranking:alliances');

  let cachedData: { ranking: unknown; rankingAliancas: unknown } | null = null;
  if (cachedRanking && cachedAlliances) {
    cachedData = { ranking: cachedRanking, rankingAliancas: cachedAlliances } as any;
  }

  if (cachedData) {
    // Return cached data with fresh user position
    const userValue = categoria === 'maravilha' ? cidadeAtual.nivelMaravilha : cidadeAtual.pontos;
    const whereBetter: Record<string, unknown> = {};
    whereBetter[categoria === 'maravilha' ? 'nivelMaravilha' : 'pontos'] = { gt: userValue };
    
    const [countBetter, countEqual] = await Promise.all([
      prisma.cidade.count({ where: whereBetter }),
      prisma.cidade.count({ where: { [categoria === 'maravilha' ? 'nivelMaravilha' : 'pontos']: userValue } }),
    ]);

    return NextResponse.json({
      ranking: cachedData.ranking,
      minhasPosicoes: { pontos: countBetter + Math.ceil(countEqual / 2) },
      rankingAliancas: cachedData.rankingAliancas,
      pagina,
      totalPaginas: (cachedData.ranking as any[]).length > 0 ? Math.ceil(countBetter / 20) + 1 : 1,
    });
  }

  const porPagina = 20;
  let orderBy: Record<string, 'desc' | 'asc'>;
  let userValue: number;
  
  switch (categoria) {
    case 'maravilha':
      orderBy = { nivelMaravilha: 'desc' as const };
      userValue = cidadeAtual.nivelMaravilha;
      break;
    default:
      orderBy = { pontos: 'desc' as const };
      userValue = cidadeAtual.pontos;
  }

  // OPTIMIZED: Fetch only the paginated ranking data
  const [cities, totalCities] = await Promise.all([
    prisma.cidade.findMany({
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
    }),
    prisma.cidade.count(),
  ]);

  // OPTIMIZED: Calculate user position using count queries
  const whereBetter: Record<string, unknown> = {};
  whereBetter[categoria === 'maravilha' ? 'nivelMaravilha' : 'pontos'] = { gt: userValue };
  
  const whereEqual: Record<string, unknown> = {};
  whereEqual[categoria === 'maravilha' ? 'nivelMaravilha' : 'pontos'] = userValue;

  const [countBetter, countEqual] = await Promise.all([
    prisma.cidade.count({ where: whereBetter }),
    prisma.cidade.count({ where: whereEqual }),
  ]);

  const minhaPosicao = countBetter + Math.ceil(countEqual / 2);

  // OPTIMIZED: Use SQL aggregation for alliance ranking
  const aliancasComPontos = await prisma.alianca.findMany({
    select: {
      id: true,
      nome: true,
      tag: true,
      _count: {
        select: { membros: true }
      },
      membros: {
        select: {
          pontos: true
        }
      }
    },
    orderBy: {
      membros: {
        _count: 'desc'
      }
    },
    take: 20,
  });

  const rankingAliancas = aliancasComPontos
    .map(a => ({
      id: a.id,
      nome: a.nome,
      tag: a.tag,
      membrosCount: a._count.membros,
      pontosTotais: a.membros.reduce((sum: number, m: { pontos: number }) => sum + m.pontos, 0),
    }))
    .sort((a, b) => b.pontosTotais - a.pontosTotais);

  const responseData = {
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
      pontos: minhaPosicao,
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
    totalPaginas: Math.ceil(totalCities / porPagina),
  };

  // Cache the paginated data and alliances separately
  setCache(cacheKey, responseData.ranking);
  setCache('ranking:alliances', responseData.rankingAliancas);

  return NextResponse.json(responseData);
}
