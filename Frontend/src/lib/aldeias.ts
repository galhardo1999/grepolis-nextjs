import { IdUnidade } from './unidades';

export interface AldeiaBarbara {
  id: string;
  nome: string;
  nivel: number;
  imagem: string;
  defesa: Partial<Record<IdUnidade, number>>;
  saque: { madeira: number; pedra: number; prata: number };
  tempoRecargaMinutos: number;
}

export const ALDEIAS_BARBARAS: AldeiaBarbara[] = [
  {
    id: 'aldeia-1',
    nome: 'Aldeia Isolada',
    nivel: 1,
    imagem: '/aldeias/aldeia-1.png',
    defesa: { 'espadachim': 3 },
    saque: { madeira: 150, pedra: 100, prata: 50 },
    tempoRecargaMinutos: 5,
  },
  {
    id: 'aldeia-2',
    nome: 'Acampamento Ribeirinho',
    nivel: 2,
    imagem: '/aldeias/aldeia-2.png',
    defesa: { 'espadachim': 8, 'fundeiro': 3 },
    saque: { madeira: 350, pedra: 250, prata: 150 },
    tempoRecargaMinutos: 15,
  },
  {
    id: 'aldeia-3',
    nome: 'Comunidade Florestal',
    nivel: 3,
    imagem: '/aldeias/aldeia-3.png',
    defesa: { 'espadachim': 15, 'fundeiro': 10, 'arqueiro': 5 },
    saque: { madeira: 600, pedra: 500, prata: 400 },
    tempoRecargaMinutos: 30,
  },
  {
    id: 'aldeia-4',
    nome: 'Povoado Fortificado',
    nivel: 4,
    imagem: '/aldeias/aldeia-4.png',
    defesa: { 'espadachim': 25, 'hoplita': 15, 'arqueiro': 15 },
    saque: { madeira: 1100, pedra: 1000, prata: 800 },
    tempoRecargaMinutos: 60,
  },
  {
    id: 'aldeia-5',
    nome: 'Vila dos Mercenários',
    nivel: 5,
    imagem: '/aldeias/aldeia-5.png',
    defesa: { 'hoplita': 40, 'cavaleiro': 10, 'arqueiro': 30 },
    saque: { madeira: 2000, pedra: 1800, prata: 1500 },
    tempoRecargaMinutos: 180,
  },
  {
    id: 'aldeia-6',
    nome: 'Capital Bárbara',
    nivel: 6,
    imagem: '/aldeias/aldeia-6.png',
    defesa: { 'hoplita': 60, 'cavaleiro': 25, 'carruagem': 10, 'arqueiro': 50 },
    saque: { madeira: 3500, pedra: 3500, prata: 3500 },
    tempoRecargaMinutos: 480,
  }
];
