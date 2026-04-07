import { redirect } from 'next/navigation';
import { getSession, getCidadeByUserId, recalcularEstadoServidor } from '@/lib/auth';
import { GameClient } from './GameClient';
import { calcularCapacidadeArmazem } from '@/lib/config';

export default async function GamePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const cidade = await getCidadeByUserId(session.userId);

  if (!cidade) {
    redirect('/registro');
  }

  // Recalcula capacidade do armazém com base no nível atual
  const edificios = cidade.edificios as Record<string, number>;
  const pesquisas = cidade.pesquisasConcluidas as string[];
  const temCeramica = pesquisas.includes('ceramica');
  const recursosMaximosReais = calcularCapacidadeArmazem(edificios['warehouse'] || 0, temCeramica);

  // Clapa recursos acima da capacidade
  const cidadeAjustada = {
    ...cidade,
    madeira: Math.min(recursosMaximosReais, cidade.madeira),
    pedra: Math.min(recursosMaximosReais, cidade.pedra),
    prata: Math.min(recursosMaximosReais, cidade.prata),
    recursosMaximos: recursosMaximosReais,
    edificios,
  };

  // Recalcula producao offline — servidor como fonte da verdade
  const offline = recalcularEstadoServidor(cidadeAjustada as import('@/lib/auth').DadosCidade);

  const estadoInicial: import('./types').EstadoJogo = {
    recursos: {
      madeira: offline.madeira,
      pedra: offline.pedra,
      prata: offline.prata,
      populacao: offline.populacao,
      populacaoMaxima: cidade.populacaoMaxima,
      recursosMaximos: recursosMaximosReais,
      favor: offline.favor,
      favorMaximo: cidade.favorMaximo,
      prataNaGruta: cidade.prataNaGruta,
    },
    deusAtual: cidade.deusAtual as import('./types').EstadoJogo['deusAtual'],
    edificios: cidade.edificios as Record<string, number>,
    unidades: cidade.unidades as Record<string, number>,
    pesquisasConcluidas: cidade.pesquisasConcluidas as import('@/store/gameStore').EstadoJogo['pesquisasConcluidas'],
    missoesColetadas: cidade.missoesColetadas,
    fila: cidade.fila as any[],
    filaRecrutamento: cidade.filaRecrutamento as any[],
    cooldownsAldeias: cidade.cooldownsAldeias as Record<string, number>,
    ultimaAtualizacao: offline.ultimaAtualizacao.getTime(),
    nomeCidade: cidade.nomeCidade,
    poderesUsadosHoje: (cidade.poderesUsadosHoje as Record<string, number>) ?? {},
  };

  return <GameClient estadoInicial={estadoInicial} usuario={session} />;
}
