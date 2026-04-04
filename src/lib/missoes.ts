import { EstadoJogo } from '@/store/gameStore';

export interface Recompensa {
  madeira?: number;
  pedra?: number;
  prata?: number;
  favor?: number;
  unidades?: Record<string, number>;
}

export interface Missao {
  id: string;
  titulo: string;
  descricao: string;
  verificarConclusao: (estado: EstadoJogo) => boolean;
  recompensa: Recompensa;
}

export const MISSOES: Missao[] = [
  {
    id: 'intro_senate',
    titulo: 'O Início de um Império',
    descricao: 'Eleve o Senado para o Nível 2 para acelerar a construção da cidade.',
    recompensa: { madeira: 150, pedra: 150 },
    verificarConclusao: (estado) => (estado.edificios['senate'] || 0) >= 2
  },
  {
    id: 'basic_resources',
    titulo: 'Economia Básica',
    descricao: 'Construa o Bosque, a Pedreira e a Mina de Prata (todos Nível 1).',
    recompensa: { madeira: 100, pedra: 100, prata: 100 },
    verificarConclusao: (estado) => 
      (estado.edificios['timber-camp'] || 0) >= 1 &&
      (estado.edificios['quarry'] || 0) >= 1 &&
      (estado.edificios['silver-mine'] || 0) >= 1
  },
  {
    id: 'agriculture',
    titulo: 'Alimentando o Povo',
    descricao: 'Melhore a Quinta para o Nível 4 para sustentar novas tropas e obras.',
    recompensa: { madeira: 200, prata: 150 },
    verificarConclusao: (estado) => (estado.edificios['farm'] || 0) >= 4
  },
  {
    id: 'military_training',
    titulo: 'Nasce um Exército',
    descricao: 'Construa o Quartel e recrute pelo menos 5 Espadachins.',
    recompensa: { prata: 300, favor: 20 },
    verificarConclusao: (estado) => 
      (estado.edificios['barracks'] || 0) >= 1 && 
      (estado.unidades['swordsman'] || 0) >= 5
  },
  {
    id: 'divine_worship',
    titulo: 'Adoração e Poder',
    descricao: 'Construa o Templo Nível 1 para liberar a seleção de Deuses.',
    recompensa: { favor: 50 },
    verificarConclusao: (estado) => (estado.edificios['temple'] || 0) >= 1
  },
  {
    id: 'trade_hub',
    titulo: 'Comércio Próspero',
    descricao: 'Alcance Mercado Nível 5 para iniciar trocas com aldeias bárbaras.',
    recompensa: { madeira: 500, pedra: 500, prata: 500 },
    verificarConclusao: (estado) => (estado.edificios['market'] || 0) >= 5
  },
  {
    id: 'naval_power',
    titulo: 'Acesso ao Mar',
    descricao: 'Construa o Porto Nível 1.',
    recompensa: { madeira: 800, pedra: 200 },
    verificarConclusao: (estado) => (estado.edificios['harbor'] || 0) >= 1
  }
];
