import { NextRequest, NextResponse } from 'next/server';
import { getSession, recalcularEstadoServidor, getCidadeByUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema minimo — rejeita payloads malformados ou abusivos
const syncSchema = z.object({
  ultimaAtualizacao: z.number().optional(),
}).strict();

// GET: retorna o estado atual (recalculado) da cidade do usuário
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const cidadeRaw = await getCidadeByUserId(session.userId);
  if (!cidadeRaw) return NextResponse.json({ erro: 'Cidade não encontrada' }, { status: 404 });

  const cidade = recalcularEstadoServidor({
    madeira: cidadeRaw.madeira,
    pedra: cidadeRaw.pedra,
    prata: cidadeRaw.prata,
    populacao: cidadeRaw.populacao,
    populacaoMaxima: cidadeRaw.populacaoMaxima,
    recursosMaximos: cidadeRaw.recursosMaximos,
    favor: cidadeRaw.favor,
    favorMaximo: cidadeRaw.favorMaximo,
    prataNaGruta: cidadeRaw.prataNaGruta,
    deusAtual: cidadeRaw.deusAtual,
    edificios: (cidadeRaw.edificios ?? {}) as Record<string, number>,
    unidades: (cidadeRaw.unidades ?? {}) as Record<string, number>,
    pesquisasConcluidas: (cidadeRaw.pesquisasConcluidas ?? []) as string[],
    missoesColetadas: (cidadeRaw.missoesColetadas ?? []) as string[],
    fila: (cidadeRaw.fila ?? []) as unknown[],
    filaRecrutamento: (cidadeRaw.filaRecrutamento ?? []) as unknown[],
    cooldownsAldeias: (cidadeRaw.cooldownsAldeias ?? {}) as Record<string, number>,
    nomeCidade: cidadeRaw.nomeCidade,
    ultimaAtualizacao: cidadeRaw.ultimaAtualizacao,
  });

  return NextResponse.json({
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
    ultimaAtualizacao: cidade.ultimaAtualizacao.getTime(),
    nomeCidade: cidade.nomeCidade,
    deusAtual: cidade.deusAtual,
  });
}

// POST: salva o estado — MAS recalcula tudo no servidor, ignora valores do cliente
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const cidadeRaw = await getCidadeByUserId(session.userId);
  if (!cidadeRaw) return NextResponse.json({ erro: 'Cidade não encontrada' }, { status: 404 });

  try {
    const body = await req.json();
    // Validar payload — rejeita estruturas desconhecidas ou malformadas
    const parsed = syncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ erro: 'Payload invalido' }, { status: 400 });
    }

    // O servidor RECALCULA o estado baseado no tempo decorrido — NUNCA confia no payload do cliente
    const dados = recalcularEstadoServidor({
      madeira: cidadeRaw.madeira,
      pedra: cidadeRaw.pedra,
      prata: cidadeRaw.prata,
      populacao: cidadeRaw.populacao,
      populacaoMaxima: cidadeRaw.populacaoMaxima,
      recursosMaximos: cidadeRaw.recursosMaximos,
      favor: cidadeRaw.favor,
      favorMaximo: cidadeRaw.favorMaximo,
      prataNaGruta: cidadeRaw.prataNaGruta,
      deusAtual: cidadeRaw.deusAtual,
      edificios: (cidadeRaw.edificios ?? {}) as Record<string, number>,
      unidades: (cidadeRaw.unidades ?? {}) as Record<string, number>,
      pesquisasConcluidas: (cidadeRaw.pesquisasConcluidas ?? []) as string[],
      missoesColetadas: (cidadeRaw.missoesColetadas ?? []) as string[],
      fila: (cidadeRaw.fila ?? []) as unknown[],
      filaRecrutamento: (cidadeRaw.filaRecrutamento ?? []) as unknown[],
      cooldownsAldeias: (cidadeRaw.cooldownsAldeias ?? {}) as Record<string, number>,
      nomeCidade: cidadeRaw.nomeCidade,
      ultimaAtualizacao: cidadeRaw.ultimaAtualizacao,
    });

    await prisma.cidade.update({
      where: { userId: session.userId },
      data: {
        madeira: dados.madeira,
        pedra: dados.pedra,
        prata: dados.prata,
        populacao: dados.populacao,
        populacaoMaxima: dados.populacaoMaxima,
        recursosMaximos: dados.recursosMaximos,
        favor: dados.favor,
        favorMaximo: dados.favorMaximo,
        prataNaGruta: dados.prataNaGruta,
        deusAtual: dados.deusAtual,
        edificios: dados.edificios,
        unidades: dados.unidades,
        pesquisasConcluidas: dados.pesquisasConcluidas,
        missoesColetadas: dados.missoesColetadas,
        fila: dados.fila as object,
        filaRecrutamento: dados.filaRecrutamento as object,
        cooldownsAldeias: dados.cooldownsAldeias,
        nomeCidade: dados.nomeCidade,
        ultimaAtualizacao: new Date(),
      },
    });

    return NextResponse.json({ sucesso: true });
  } catch {
    return NextResponse.json({ erro: 'Erro ao salvar' }, { status: 500 });
  }
}
