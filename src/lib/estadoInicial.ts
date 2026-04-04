import { IdEdificio } from './edificios';
import { IdUnidade } from './unidades';
import { IdPesquisa } from './pesquisas';

// Legacy: Este arquivo é mantido para compatibilidade de tipos
// com componentes que importam EstadoJogo.
// O novo estado canônico está em src/store/gameStore.ts

export const ESTADO_INICIAL = {
  recursos: {
    madeira: 250,
    pedra: 250,
    prata: 250,
    populacao: 100,
    populacaoMaxima: 100,
    recursosMaximos: 300,
    favor: 0,
    favorMaximo: 500,
    prataNaGruta: 0
  },
  edificios: {
    'senate': 1,
    'timber-camp': 0,
    'quarry': 0,
    'silver-mine': 0,
    'farm': 0,
    'warehouse': 0,
    'barracks': 0,
    'temple': 0,
    'market': 0,
    'harbor': 0,
    'academy': 0,
    'walls': 0,
    'cave': 0
  },
  unidades: {
    'swordsman': 0,
    'slinger': 0,
    'archer': 0,
    'hoplite': 0,
    'horseman': 0,
    'chariot': 0,
    'catapult': 0,
    'bireme': 0,
    'transport-ship': 0,
    'trireme': 0
  },
  pesquisasConcluidas: [] as IdPesquisa[],
  fila: [] as {
    edificio: IdEdificio;
    inicioTempo: number;
    fimTempo: number;
    nivel: number;
  }[],
  filaRecrutamento: [] as {
    unidade: IdUnidade;
    quantidade: number;
    inicioTempo: number;
    fimTempo: number;
  }[],
  ultimaAtualizacao: Date.now(),
  nomeCidade: 'Granpolis'
};

export type EstadoJogo = typeof ESTADO_INICIAL;
