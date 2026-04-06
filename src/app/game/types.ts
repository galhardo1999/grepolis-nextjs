import { IdPesquisa } from '@/lib/pesquisas';
import { IdDeus } from '@/lib/deuses';
import { ItemFila, ItemFilaRecrutamento } from '@/store/gameStore';

export interface AuthSession {
  userId: string;
  username: string;
}

export interface EstadoJogo {
  recursos: {
    madeira: number;
    pedra: number;
    prata: number;
    populacao: number;
    populacaoMaxima: number;
    recursosMaximos: number;
    favor: number;
    favorMaximo: number;
    prataNaGruta: number;
  };
  deusAtual: IdDeus | null;
  edificios: Record<string, number>;
  unidades: Record<string, number>;
  pesquisasConcluidas: IdPesquisa[];
  missoesColetadas: string[];
  fila: ItemFila[];
  filaRecrutamento: ItemFilaRecrutamento[];
  cooldownsAldeias: Record<string, number>;
  ultimaAtualizacao: number;
  nomeCidade: string;
}
