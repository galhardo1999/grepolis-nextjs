import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PROTECAO_NOVO_PLAYER } from '@/lib/protecao';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  try {
    // Apaga dependencias relativas ao combate daquela cidade specificamente, etc.
    const cidade = await prisma.cidade.findUnique({ where: { userId: session.userId } });
    if (!cidade) {
      return NextResponse.json({ erro: 'Cidade não encontrada' }, { status: 404 });
    }

    await prisma.relatorioCombate.deleteMany({ where: { cidadeId: cidade.id } });
    await prisma.missaoDiariaCompletada.deleteMany({ where: { cidadeId: cidade.id } });

    // Cancela todos os ataques envolvidos com a cidade.
    await prisma.ataque.deleteMany({ 
      where: { 
        OR: [
          { atacanteCidadeId: cidade.id },
          { defensorCidadeId: cidade.id }
        ]
      } 
    });

    await prisma.cidade.update({
      where: { userId: session.userId },
      data: {
        madeira: 250,
        pedra: 250,
        prata: 250,
        populacao: 100,
        populacaoMaxima: 100,
        recursosMaximos: 300,
        favor: 0,
        favorMaximo: 500,
        prataNaGruta: 0,
        deusAtual: null,
        edificios: {
          senado: 1, 'serraria': 0, pedreira: 0, 'mina-de-prata': 0,
          fazenda: 0, armazem: 0, quartel: 0, templo: 0,
          mercado: 0, porto: 0, academia: 0, muralha: 0, gruta: 0,
        },
        unidades: {
          espadachim: 0, fundeiro: 0, arqueiro: 0, hoplita: 0,
          cavaleiro: 0, carruagem: 0, catapulta: 0, birreme: 0,
          'navio-de-transporte': 0, trirreme: 0,
        },
        pesquisasConcluidas: [],
        missoesColetadas: [],
        fila: [],
        filaRecrutamento: [],
        cooldownsAldeias: {},
        ultimaAtualizacao: new Date(),
        pontos: 0,
        nivelMaravilha: 0,
        protecaoOfflineAte: new Date(Date.now() + PROTECAO_NOVO_PLAYER),
        poderesUsadosHoje: {},
      },
    });

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    console.error("Erro ao resetar: ", error);
    return NextResponse.json({ erro: 'Erro interno ao resetar.' }, { status: 500 });
  }
}
