// ============================================================
// API: Alianças — CRUD + Chat de Aliança
// GET: Minha aliança / Alianças
// POST: Criar / Entrar / Sair / Enviar mensagem
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { validarNomeAlianca, validarTagAlianca } from '@/lib/aliancas';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const acao = searchParams.get('acao');

  // Todas as alianças (para lista)
  if (acao === 'listar') {
    const aliancas = await prisma.alianca.findMany({
      select: {
        id: true,
        nome: true,
        tag: true,
        descricao: true,
        criadoEm: true,
        membros: {
          select: {
            id: true,
            nomeCidade: true,
            pontos: true,
            user: { select: { username: true } },
          },
          orderBy: { pontos: 'desc' },
        },
      },
      orderBy: { criadoEm: 'desc' },
      take: 100,
    });

    const resultado = aliancas.map(a => ({
      id: a.id,
      nome: a.nome,
      tag: a.tag,
      descricao: a.descricao,
      membrosCount: a.membros.length,
    }));

    return NextResponse.json({ aliancas: resultado });
  }

  // Minha aliança
  const cidade = await prisma.cidade.findFirst({
    where: { userId: session.userId },
    include: {
      aliaca: {
        include: {
          membros: {
            include: { user: { select: { username: true } } },
            orderBy: { pontos: 'desc' },
          },
        },
      },
    },
  });

  if (!cidade) return NextResponse.json({ erro: 'Cidade não encontrada' }, { status: 404 });
  if (!cidade.aliaca) return NextResponse.json({ minhaAlianca: null });

  // Mensagens recentes
  const mensagens = await prisma.mensagemAlianca.findMany({
    where: { aliacaId: cidade.aliacaId! },
    include: { cidade: { select: { nomeCidade: true, user: { select: { username: true } } } } },
    orderBy: { criadoEm: 'desc' },
    take: 50,
  });

  return NextResponse.json({
    minhaAlianca: {
      id: cidade.aliaca.id,
      nome: cidade.aliaca.nome,
      tag: cidade.aliaca.tag,
      descricao: cidade.aliaca.descricao,
      membros: cidade.aliaca.membros.map((m: { id: string; nomeCidade: string; pontos: number; user: { username: string } }) => ({
        id: m.id,
        nomeCidade: m.nomeCidade,
        username: m.user.username,
        pontos: m.pontos,
      })),
    },
    mensagens: mensagens.reverse().map((m: { id: string; texto: string; criadoEm: Date; cidade: { nomeCidade: string; user: { username: string } } }) => ({
      id: m.id,
      texto: m.texto,
      username: m.cidade.user.username,
      nomeCidade: m.cidade.nomeCidade,
      criadoEm: m.criadoEm.getTime(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const cidade = await prisma.cidade.findFirst({ where: { userId: session.userId } });
  if (!cidade) return NextResponse.json({ erro: 'Cidade não encontrada' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Body inválido' }, { status: 400 });
  }

  const { acao } = body;

  // ─── CRIAR ALIANÇA ──────────────────────────────────────
  if (acao === 'criar') {
    if (cidade.aliacaId) return NextResponse.json({ erro: 'Você já está em uma aliança' }, { status: 400 });

    const nome = (body.nome as string || '').trim();
    const tag = (body.tag as string || '').trim().toUpperCase();
    const descricao = (body.descricao as string || '').trim();

    const errNome = validarNomeAlianca(nome);
    if (errNome) return NextResponse.json({ erro: errNome }, { status: 400 });
    const errTag = validarTagAlianca(tag);
    if (errTag) return NextResponse.json({ erro: errTag }, { status: 400 });

    const tagExistente = await prisma.alianca.findUnique({ where: { tag } });
    if (tagExistente) return NextResponse.json({ erro: 'Tag já utilizada' }, { status: 400 });

    const aliaca = await prisma.alianca.create({
      data: {
        nome,
        tag,
        descricao,
        membros: { connect: { id: cidade.id } },
      },
    });

    await prisma.cidade.update({
      where: { id: cidade.id },
      data: { aliacaId: aliaca.id },
    });

    return NextResponse.json({ sucesso: true, aliaca: { id: aliaca.id, nome: aliaca.nome, tag: aliaca.tag } });
  }

  // ─── ENTRAR EM ALIANÇA ──────────────────────────────────
  if (acao === 'entrar') {
    if (cidade.aliacaId) return NextResponse.json({ erro: 'Você já está em uma aliança' }, { status: 400 });

    const aliacaId = body.aliacaId as string;
    const aliaca = await prisma.alianca.findUnique({ where: { id: aliacaId } });
    if (!aliaca) return NextResponse.json({ erro: 'Aliança não encontrada' }, { status: 404 });

    await prisma.cidade.update({
      where: { id: cidade.id },
      data: { aliacaId: aliacaId },
    });

    return NextResponse.json({ sucesso: true, aliaca: { id: aliaca.id, nome: aliaca.nome, tag: aliaca.tag } });
  }

  // ─── SAIR DA ALIANÇA ───────────────────────────────────
  if (acao === 'sair') {
    if (!cidade.aliacaId) return NextResponse.json({ erro: 'Você não está em nenhuma aliança' }, { status: 400 });

    // Verificar se é o último membro
    const membrosCount = await prisma.cidade.count({ where: { aliacaId: cidade.aliacaId } });

    await prisma.cidade.update({
      where: { id: cidade.id },
      data: { aliacaId: null },
    });

    // Se último membro, deletar aliança
    if (membrosCount <= 1) {
      await prisma.alianca.delete({ where: { id: cidade.aliacaId } });
    }

    return NextResponse.json({ sucesso: true });
  }

  // ─── ENVIAR MENSAGEM NO CHAT ───────────────────────────
  if (acao === 'mensagem') {
    if (!cidade.aliacaId) return NextResponse.json({ erro: 'Você não está em nenhuma aliança' }, { status: 400 });

    const texto = (body.texto as string || '').replace(/<[^>]*>/g, '').trim();
    if (!texto) return NextResponse.json({ erro: 'Mensagem vazia' }, { status: 400 });
    if (texto.length > 500) return NextResponse.json({ erro: 'Mensagem muito longa (máximo 500 caracteres)' }, { status: 400 });

    const mensagem = await prisma.mensagemAlianca.create({
      data: {
        aliacaId: cidade.aliacaId,
        cidadeId: cidade.id,
        texto,
      },
    });

    return NextResponse.json({ sucesso: true, mensagem: { id: mensagem.id, texto: mensagem.texto, criadoEm: mensagem.criadoEm.getTime() } });
  }

  return NextResponse.json({ erro: 'Ação inválida' }, { status: 400 });
}
