// ============================================================
// API: Mensagens (Correio) — GET inbox, POST mark as read
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
    if (!cidade) {
      return NextResponse.json({ erro: 'Cidade nao encontrada' }, { status: 404 });
    }

    // Relatorios de combate
    const relatorios = await prisma.relatorioCombate.findMany({
      where: { cidadeId: cidade.id },
      orderBy: { dataOcorrencia: 'desc' },
      take: 50,
    });

    // Mensagens de alianca
    let mensagensAlianca: {
      id: string;
      remetenteUsername: string;
      remetenteCidade: string;
      texto: string;
      criadoEm: Date;
      tipo: 'alianca';
      lido: boolean;
    }[] = [];

    if (cidade.aliacaId) {
      const msgs = await prisma.mensagemAlianca.findMany({
        where: { aliacaId: cidade.aliacaId },
        orderBy: { criadoEm: 'desc' },
        take: 50,
        include: {
          cidade: {
            select: {
              nomeCidade: true,
              user: { select: { username: true } },
            },
          },
        },
      });

      mensagensAlianca = msgs.map((m: { id: string; cidade: { nomeCidade: string; user: { username: string } }; texto: string; criadoEm: Date }) => ({
        id: m.id,
        remetenteUsername: m.cidade.user.username,
        remetenteCidade: m.cidade.nomeCidade,
        texto: m.texto,
        criadoEm: m.criadoEm,
        tipo: 'alianca' as const,
        lido: true, // mensagens de alianca nao tem "lido" — sao sempre visiveis
      }));
    }

    // Contar nao lidos
    const naoLidos = relatorios.filter((r: { lido: boolean }) => !r.lido).length;

    const inbox = [
      ...relatorios.map((r) => ({
        id: r.id,
        titulo: r.titulo,
        conteudo: r.conteudo as object,
        tipo: 'combate' as const,
        contraQuem: r.contraQuem,
        data: r.dataOcorrencia,
        lido: r.lido,
      })),
      ...mensagensAlianca,
    ].sort((a, b) => {
      const da = 'data' in a ? a.data : a.criadoEm;
      const db = 'data' in b ? b.data : b.criadoEm;
      return new Date(db).getTime() - new Date(da).getTime();
    });

    return NextResponse.json({
      messages: inbox,
      naoLidos,
    });
  } catch {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.json({ erro: 'Nao autenticado' }, { status: 401 });
    }

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
    if (!cidade) {
      return NextResponse.json({ erro: 'Cidade nao encontrada' }, { status: 404 });
    }

    const body = await req.json();
    const { ids } = body as { ids?: string[] };

    if (ids) {
      // Mark specific reports as read
      await prisma.relatorioCombate.updateMany({
        where: {
          cidadeId: cidade.id,
          id: { in: ids },
        },
        data: { lido: true },
      });
    } else {
      // Mark ALL as read
      await prisma.relatorioCombate.updateMany({
        where: {
          cidadeId: cidade.id,
          lido: false,
        },
        data: { lido: true },
      });
    }

    return NextResponse.json({ sucesso: true });
  } catch {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
