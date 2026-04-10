// ============================================================
// SHARED TYPES - Common types used across Backend and Frontend
// ============================================================

// Authentication
export interface AuthSession {
  userId: string;
  username: string;
}

// Game Resources
export interface Recursos {
  madeira: number;
  pedra: number;
  prata: number;
  populacao: number;
  populacaoMaxima: number;
  recursosMaximos: number;
  favor: number;
  favorMaximo: number;
  prataNaGruta: number;
}

// Queue Items
export interface ItemFila {
  edificio: string;
  inicioTempo: number;
  fimTempo: number;
  nivel: number;
}

export interface ItemFilaRecrutamento {
  unidade: string;
  quantidade: number;
  inicioTempo: number;
  fimTempo: number;
}

// Event Queue
export interface EventoConclusao {
  tipo: 'edificio' | 'unidade';
  id: string;
  nome: string;
  nivel?: number;
  quantidade?: number;
}

// Game State
export interface EstadoJogo {
  recursos: Recursos;
  deusAtual: string | null;
  edificios: Record<string, number>;
  unidades: Record<string, number>;
  pesquisasConcluidas: string[];
  missoesColetadas: string[];
  fila: ItemFila[];
  filaRecrutamento: ItemFilaRecrutamento[];
  cooldownsAldeias: Record<string, number>;
  ultimaAtualizacao: number;
  nomeCidade: string;
  poderesUsadosHoje: Record<string, number>;
}

// API Request/Response Types
export interface ApiResponse<T = unknown> {
  sucesso?: boolean;
  erro?: string;
  dados?: T;
}

export interface LoginRequest {
  username: string;
  senha: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  senha: string;
}

export interface AuthResponse {
  sucesso: boolean;
  erro?: string;
  usuario?: {
    id: string;
    username: string;
    email: string;
  };
}

// Game Actions
export interface ConstrucaoRequest {
  aldeiaId: string;
  edificio: string;
}

export interface RecrutamentoRequest {
  aldeiaId: string;
  unidade: string;
  quantidade: number;
}

export interface PesquisaRequest {
  aldeiaId: string;
  pesquisa: string;
}

export interface AtaqueRequest {
  origemId: string;
  destinoId: string;
  unidades: Record<string, number>;
}

// Map & Villages
export interface Aldeia {
  id: string;
  nome: string;
  x: number;
  y: number;
  donoId?: string;
  donoNome?: string;
  tipo: 'jogador' | 'barbaro';
  recursos: Recursos;
  edificios: Record<string, number>;
  unidades: Record<string, number>;
}

export interface MapaTile {
  x: number;
  y: number;
  aldeia: Aldeia | null;
}

// Alliance
export interface Alianca {
  id: string;
  nome: string;
  tag: string;
  descricao: string;
  liderId: string;
  liderNome: string;
  membros: MembroAlianca[];
  dataCriacao: number;
}

export interface MembroAlianca {
  userId: string;
  username: string;
  cargo: 'lider' | 'oficial' | 'membro';
  dataEntrada: number;
}

// Messages
export interface Mensagem {
  id: string;
  remetenteId: string;
  remetenteNome: string;
  destinatarioId: string;
  titulo: string;
  conteudo: string;
  timestamp: number;
  lida: boolean;
}

// Rankings
export interface RankingEntry {
  posicao: number;
  userId: string;
  username: string;
  pontos: number;
  aldeias: number;
}

// Missions
export interface Missao {
  id: string;
  titulo: string;
  descricao: string;
  objetivo: string;
  progresso: number;
  meta: number;
  recompensa: Record<string, number>;
  concluida: boolean;
  coletada: boolean;
}

// Events
export interface EventoJogo {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'bonus' | 'especial' | 'temporario';
  inicio: number;
  fim: number;
  ativo: boolean;
}

// Divine Powers
export interface PoderDivino {
  id: string;
  nome: string;
  descricao: string;
  custoFavor: number;
  cooldown: number;
  duracao?: number;
}

// Combat
export interface ResultadoBatalha {
  vencedor: 'atacante' | 'defensor';
  perdasAtacante: Record<string, number>;
  perdasDefensor: Record<string, number>;
  saque: Record<string, number>;
  duracao: number;
}
