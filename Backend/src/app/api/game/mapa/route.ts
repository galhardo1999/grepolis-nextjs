// ============================================================
// API: Mapa do Mundo
// GET: Retorna cidades e aldeias em um raio
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const centroX = parseInt(searchParams.get('x') || '0');
  const centroY = parseInt(searchParams.get('y') || '0');
  const raio = parseInt(searchParams.get('raio') || '300');
  const ilha = searchParams.get('ilha');

  // Buscar cidades com aliança no raio
  const cidadesQuery: Record<string, unknown> = {};
  if (ilha) {
    cidadesQuery.ilha = parseInt(ilha);
  } else {
    cidadesQuery.mapaX = { gte: centroX - raio, lte: centroX + raio };
    cidadesQuery.mapaY = { gte: centroY - raio, lte: centroY + raio };
  }

  const cidadesJogadores = await prisma.cidade.findMany({
    where: cidadesQuery,
    select: {
      id: true,
      nomeCidade: true,
      mapaX: true,
      mapaY: true,
      ilha: true,
      pontos: true,
      nivelMaravilha: true,
      user: { select: { username: true } },
      aliaca: { select: { tag: true, nome: true } },
    },
    take: 200,
  });

  // Buscar aldeias bárbaras na mesma região (IDs 0-5)
  const ALDEIAS_COORDS = [
    { x: centroX - 200, y: centroY - 200, ilha: 0, nome: 'Aldeia Bárbara I' },
    { x: centroX + 150, y: centroY - 100, ilha: 0, nome: 'Aldeia Bárbara II' },
    { x: centroX - 50, y: centroY + 180, ilha: 0, nome: 'Aldeia Bárbara III' },
    { x: centroX + 250, y: centroY + 50, ilha: 1, nome: 'Aldeia Bárbara IV' },
    { x: centroX - 180, y: centroY + 100, ilha: 1, nome: 'Aldeia Bárbara V' },
    { x: centroX + 80, y: centroY - 250, ilha: 1, nome: 'Aldeia Bárbara VI' },
  ];

  const cidades = cidadesJogadores.map(c => ({
    cidadeId: c.id,
    nomeCidade: c.nomeCidade,
    username: c.user.username,
    mapaX: c.mapaX,
    mapaY: c.mapaY,
    ilha: c.ilha,
    pontos: c.pontos,
    aliacaTag: c.aliaca?.tag || null,
    aliacaNome: c.aliaca?.nome || null,
    nivelMaravilha: c.nivelMaravilha,
    eBarbaro: false,
  }));

  const aldeias = ALDEIAS_COORDS.map((a, i) => ({
    id: `barbaro-${i}`,
    nome: a.nome,
    mapaX: a.x,
    mapaY: a.y,
    nivel: i + 1,
    eBarbaro: true,
  }));

  return NextResponse.json({ cidades, aldeias });
}
