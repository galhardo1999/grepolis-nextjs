// ============================================================
// SHARED CONSTANTS - Game constants used across Backend and Frontend
// ============================================================

// Resource Configuration
export const RECURSOS_CONFIG = {
  MADEIRA_INICIAL: 500,
  PEDRA_INICIAL: 500,
  PRATA_INICIAL: 200,
  POPULACAO_INICIAL: 10,
  FAVOR_INICIAL: 100,
} as const;

// Queue Limits
export const TAMANHO_MAXIMO_FILA_OBRAS = 2;
export const TAMANHO_MAXIMO_FILA_RECRUTAMENTO = 5;

// Production Rates (per second)
export const TAXAS_PRODUCAO = {
  MADEIRA_BASE: 10,
  PEDRA_BASE: 8,
  PRATA_BASE: 5,
} as const;

// Market Exchange Rates
export const TAXAS_MERCADO = {
  VENDA: 0.9, // 10% tax on selling
  COMPRA: 1.1, // 10% tax on buying
} as const;

// Storage Capacities
export const CAPACIDADE_ARMAZEM = {
  NIVEL_1: 1000,
  NIVEL_10: 10000,
  NIVEL_20: 50000,
  NIVEL_30: 100000,
} as const;

// Population Limits
export const LIMITE_POPULACAO = {
  BASE: 10,
  POR_CASA: 5,
} as const;

// Construction Times (in seconds)
export const TEMPO_CONSTRUCAO = {
  EDIFICIOS: {
    fazenda: { base: 30, multiplo: 1.5 },
    madeireira: { base: 45, multiplo: 1.6 },
    pedreira: { base: 50, multiplo: 1.6 },
    mina_prata: { base: 60, multiplo: 1.7 },
    armazem: { base: 40, multiplo: 1.5 },
    mercado: { base: 90, multiplo: 1.8 },
    quartel: { base: 120, multiplo: 2.0 },
    senado: { base: 180, multiplo: 2.2 },
    templo: { base: 150, multiplo: 2.0 },
    porto: { base: 100, multiplo: 1.9 },
  } as const,
  UNIDADES: {
    espadachim: 60,
    arqueiro: 75,
    hoplita: 90,
    biga: 120,
    cavaleiro: 150,
    fundibulario: 70,
    catapulta: 180,
    trireme: 200,
    bireme: 160,
    barco_transporte: 140,
  } as const,
} as const;

// Divine Gods
export const DEUSES = [
  'zeus',
  'hera',
  'poseidon',
  'hades',
  'atena',
] as const;

// Building Types
export const EDIFICIOS_LIST = [
  'fazenda',
  'madeireira',
  'pedreira',
  'mina_prata',
  'armazem',
  'mercado',
  'quartel',
  'senado',
  'templo',
  'porto',
] as const;

// Unit Types
export const UNIDADES_LIST = [
  'espadachim',
  'arqueiro',
  'hoplita',
  'biga',
  'cavaleiro',
  'fundibulario',
  'catapulta',
  'trireme',
  'bireme',
  'barco_transporte',
] as const;

// Research Types
export const PESQUISAS_LIST = [
  'estrategia',
  'metalurgia',
  'navegacao',
  'espionagem',
  'forja',
  'arado',
  'ceramica',
  'escudo',
] as const;

// Map Configuration
export const MAPA_CONFIG = {
  TAMANHO: 100,
  ALDEIAS_BARBARAS: 20,
  MIN_DISTANCIA: 3,
} as const;

// Alliance Configuration
export const ALIANCA_CONFIG = {
  MAXIMO_MEMBROS: 50,
  MINIMO_MEMBROS: 3,
  CARGOS: ['lider', 'oficial', 'membro'] as const,
} as const;

// Login Streak Rewards
export const LOGIN_STREAK = {
  DIA_1: { favor: 10, prata: 50 },
  DIA_3: { favor: 25, prata: 150 },
  DIA_7: { favor: 50, prata: 500 },
  DIA_30: { favor: 200, prata: 2000 },
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  LOGIN_MAX_TENTATIVAS: 5,
  LOGIN_JANELA_MS: 600000, // 10 minutes
  API_MAX_REQUESTS: 100,
  API_JANELA_MS: 60000, // 1 minute
} as const;

// Session Configuration
export const SESSION_CONFIG = {
  MAX_CONCURRENT: 5,
  IDLE_TIMEOUT_MS: 3600000, // 1 hour
  MAX_AGE_MS: 86400000, // 24 hours
} as const;
