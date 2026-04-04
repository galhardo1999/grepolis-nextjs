import { IdUnidade } from './unidades';

export interface AldeiaBarbara {
  id: string;
  nome: string;
  nivel: number;
  defesa: Partial<Record<IdUnidade, number>>;
  saque: { madeira: number; pedra: number; prata: number };
}

export const ALDEIAS_BARBARAS: AldeiaBarbara[] = [
  {
    id: 'aldeia-1',
    nome: 'Aldeia Isolada',
    nivel: 1,
    defesa: { 'swordsman': 3 },
    saque: { madeira: 150, pedra: 100, prata: 50 },
  },
  {
    id: 'aldeia-2',
    nome: 'Acampamento Ribeirinho',
    nivel: 2,
    defesa: { 'swordsman': 8, 'slinger': 3 },
    saque: { madeira: 350, pedra: 250, prata: 150 },
  },
  {
    id: 'aldeia-3',
    nome: 'Comunidade Florestal',
    nivel: 3,
    defesa: { 'swordsman': 15, 'slinger': 10, 'archer': 5 },
    saque: { madeira: 600, pedra: 500, prata: 400 },
  },
  {
    id: 'aldeia-4',
    nome: 'Povoado Fortificado',
    nivel: 4,
    defesa: { 'swordsman': 25, 'hoplite': 15, 'archer': 15 },
    saque: { madeira: 1100, pedra: 1000, prata: 800 },
  },
  {
    id: 'aldeia-5',
    nome: 'Vila dos Mercenários',
    nivel: 5,
    defesa: { 'hoplite': 40, 'horseman': 10, 'archer': 30 },
    saque: { madeira: 2000, pedra: 1800, prata: 1500 },
  },
  {
    id: 'aldeia-6',
    nome: 'Capital Bárbara',
    nivel: 6,
    defesa: { 'hoplite': 60, 'horseman': 25, 'chariot': 10, 'archer': 50 },
    saque: { madeira: 3500, pedra: 3500, prata: 3500 },
  }
];
