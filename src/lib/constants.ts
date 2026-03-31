export const GAME_SPEED = 111;
export const MAX_QUEUE_SIZE = 10;
export const FAVOR_PRODUCTION_BASE = 21110; // Favor per hour

export const GODS = {
  'zeus': {
    id: 'zeus' as const,
    name: 'Zeus',
    portrait: '/god_zeus.png',
    color: '#FFD700',
    description: 'Rei dos Deuses, senhor do céu e do trovão.'
  },
  'poseidon': {
    id: 'poseidon' as const,
    name: 'Poseidón',
    portrait: '/god_poseidon.png',
    color: '#0077BE',
    description: 'Senhor dos mares e dos terremotos.'
  },
  'hera': {
    id: 'hera' as const,
    name: 'Hera',
    portrait: '/god_hera.png',
    color: '#DA70D6',
    description: 'Rainha dos Deuses, protetora do matrimônio.'
  },
  'atena': {
    id: 'atena' as const,
    name: 'Atena',
    portrait: '/god_atena.png',
    color: '#D3D3D3',
    description: 'Deusa da sabedoria e da guerra de estratégia.'
  },
  'hades': {
    id: 'hades' as const,
    name: 'Hades',
    portrait: '/god_hades.png',
    color: '#4B0082',
    description: 'Senhor do submundo e das riquezas subterrâneas.'
  }
};

export type GodId = keyof typeof GODS;

export const BUILDINGS = {
  'senate': {
    id: 'senate',
    name: 'Senado',
    description: 'O centro político da sua cidade. Aumenta a velocidade de construção.',
    baseCost: { wood: 100, stone: 80, silver: 50 },
    costMultiplier: 1.2,
    timeMultiplier: 1.2,
    baseTime: 10,
    popCost: 2
  },
  'timber-camp': {
    id: 'timber-camp',
    name: 'Bosque',
    description: 'Produz madeira bruta para construções e tropas.',
    baseCost: { wood: 50, stone: 30, silver: 20 },
    costMultiplier: 1.1,
    timeMultiplier: 1.1,
    baseTime: 5,
    productionMultiplier: 10,
    popCost: 1
  },
  'quarry': {
    id: 'quarry',
    name: 'Pedreira',
    description: 'Fornece pedras para muralhas e edifícios.',
    baseCost: { wood: 30, stone: 50, silver: 20 },
    costMultiplier: 1.1,
    timeMultiplier: 1.1,
    baseTime: 5,
    productionMultiplier: 10,
    popCost: 1
  },
  'silver-mine': {
    id: 'silver-mine',
    name: 'Mina de Prata',
    description: 'Extrai minério de prata para comércio e divindades.',
    baseCost: { wood: 40, stone: 40, silver: 50 },
    costMultiplier: 1.1,
    timeMultiplier: 1.1,
    baseTime: 5,
    productionMultiplier: 10,
    popCost: 1
  },
  'farm': {
    id: 'farm',
    name: 'Quinta',
    description: 'Fornece alimento para seus cidadãos e exército. Aumenta a população máxima.',
    baseCost: { wood: 40, stone: 20, silver: 20 },
    costMultiplier: 1.1,
    timeMultiplier: 1.1,
    baseTime: 5,
    popCost: 0
  },
  'warehouse': {
    id: 'warehouse',
    name: 'Armazém',
    description: 'Local onde as matérias-primas são armazenadas. Aumenta a capacidade de recursos.',
    baseCost: { wood: 50, stone: 50, silver: 20 },
    costMultiplier: 1.1,
    timeMultiplier: 1.1,
    baseTime: 5,
    popCost: 1
  }
} as const;

export type BuildingId = keyof typeof BUILDINGS;

export const INITIAL_STATE = {
  resources: {
    wood: 500,
    stone: 500,
    silver: 500,
    population: 20, // Free population
    maxPopulation: 100,
    maxResources: 1500,
    favor: 0,
    maxFavor: 500
  },
  currentGod: 'zeus' as GodId,
  buildings: {
    'senate': 1,
    'timber-camp': 1,
    'quarry': 1,
    'silver-mine': 1,
    'farm': 1,
    'warehouse': 1
  },
  queue: [] as {
    building: BuildingId;
    startTime: number;
    finishTime: number;
    level: number;
  }[],
  lastUpdate: Date.now()
};

export type GameState = typeof INITIAL_STATE;
