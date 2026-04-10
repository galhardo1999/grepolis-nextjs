// ============================================================
// API: Pesquisar — Valida e persiste pesquisa da Academia no DB
// POST { pesquisa: IdPesquisa }
// Retorna o estado atualizado da cidade ou erro
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-helpers';
import { AuthSession, getCidadeByUserId, recalcularEstadoServidor, DadosCidade } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PESQUISAS } from '@/lib/pesquisas';
import { calcularCapacidadeArmazem } from '@/lib/config';

export const POST = withAuth(async (req: NextRequest, session: AuthSession) => {

  let body: { pesquisa?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Body inválido' }, { status: 400 });
  }

  const { pesquisa: idPesquisa } = body;
  if (!idPesquisa || !(idPesquisa in PESQUISAS)) {
    return NextResponse.json({ erro: 'Pesquisa inválida' }, { status: 400 });
  }

  const cidadeRaw = await getCidadeByUserId(session.userId);
  if (!cidadeRaw) return NextResponse.json({ erro: 'Cidade não encontrada' }, { status: 404 });

  // 1. Recalcular estado atual antes de validar
  const cidade = recalcularEstadoServidor(cidadeRaw as unknown as DadosCidade);

  const pesquisasConcluidas = cidade.pesquisasConcluidas as string[];
  const pesquisa = PESQUISAS[idPesquisa as keyof typeof PESQUISAS];

  // 2. Validações
  if (pesquisasConcluidas.includes(idPesquisa)) {
    return NextResponse.json({ erro: 'Pesquisa já concluída' }, { status: 400 });
  }

  const nivelAcademia = (cidade.edificios as Record<string, number>)['academia'] || 0;
  if (nivelAcademia < pesquisa.requisitoAcademia) {
    return NextResponse.json({ erro: `Requer Academia Nv. ${pesquisa.requisitoAcademia}` }, { status: 400 });
  }

  if (cidade.prata < pesquisa.custo.prata) {
    return NextResponse.json({ erro: `Prata insuficiente (${pesquisa.custo.prata} necessário)` }, { status: 400 });
  }

  // 3. Aplicar pesquisa
  const novasPesquisas = [...pesquisasConcluidas, idPesquisa];
  const novaPrata = Math.floor(cidade.prata) - pesquisa.custo.prata;

  // Efeitos especiais
  let novoRecursosMaximos = cidade.recursosMaximos;
  let novoPopulacaoMaxima = cidade.populacaoMaxima;

  if (idPesquisa === 'ceramica') {
    novoRecursosMaximos = calcularCapacidadeArmazem(
      (cidade.edificios as Record<string, number>)['armazem'] || 0,
      true
    );
  } else if (idPesquisa === 'arado') {
    const nivelFazenda = (cidade.edificios as Record<string, number>)['fazenda'] || 0;
    const base = nivelFazenda > 0 ? 100 + (nivelFazenda - 1) * 20 : 100;
    novoPopulacaoMaxima = Math.floor(base * 1.10);
  }

  // 4. Salvar no banco
  await prisma.cidade.update({
    where: { id: cidadeRaw.id },
    data: {
      prata: novaPrata,
      pesquisasConcluidas: novasPesquisas,
      recursosMaximos: novoRecursosMaximos,
      populacaoMaxima: novoPopulacaoMaxima,
      madeira: Math.floor(cidade.madeira),
      pedra: Math.floor(cidade.pedra),
      populacao: Math.floor(cidade.populacao),
      favor: Math.floor(cidade.favor),
      edificios: cidade.edificios as object,
      unidades: cidade.unidades as object,
      missoesColetadas: cidade.missoesColetadas,
      fila: cidade.fila as object,
      filaRecrutamento: cidade.filaRecrutamento as object,
      cooldownsAldeias: cidade.cooldownsAldeias,
      ultimaAtualizacao: new Date(),
    },
  });

  // 5. Retornar estado atualizado para o cliente sincronizar
  return NextResponse.json({
    sucesso: true,
    estado: {
      recursos: {
        madeira: Math.floor(cidade.madeira),
        pedra: Math.floor(cidade.pedra),
        prata: novaPrata,
        populacao: Math.floor(cidade.populacao),
        populacaoMaxima: novoPopulacaoMaxima,
        recursosMaximos: novoRecursosMaximos,
        favor: Math.floor(cidade.favor),
        favorMaximo: cidade.favorMaximo,
        prataNaGruta: cidade.prataNaGruta,
      },
      edificios: cidade.edificios,
      unidades: cidade.unidades,
      pesquisasConcluidas: novasPesquisas,
      missoesColetadas: cidade.missoesColetadas,
      fila: cidade.fila,
      filaRecrutamento: cidade.filaRecrutamento,
      cooldownsAldeias: cidade.cooldownsAldeias,
      nomeCidade: cidade.nomeCidade,
      deusAtual: cidade.deusAtual,
      ultimaAtualizacao: Date.now(),
    },
  });
});
