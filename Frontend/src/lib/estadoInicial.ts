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
    'senado': 10,
    'serraria': 10,
    'pedreira': 10,
    'mina-de-prata': 10,
    'fazenda': 10,
    'armazem': 10,
    'quartel': 10,
    'templo': 10,
    'mercado': 10,
    'porto': 10,
    'academia': 10,
    'muralha': 10,
    'gruta': 10
  },
  unidades: {
    'espadachim': 0,
    'fundeiro': 0,
    'arqueiro': 0,
    'hoplita': 0,
    'cavaleiro': 0,
    'carruagem': 0,
    'catapulta': 0,
    'birreme': 0,
    'navio-de-transporte': 0,
    'trirreme': 0
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
