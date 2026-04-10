// ============================================================
// MAPA DO MUNDO — Sistema de ilhas e cidades
// ============================================================

export const MAPA_CONFIG = {
  totalIlhas: 37,
  cidadesPorIlha: 16,
  gridWidth: 500,
  gridHeight: 500,
  distanciaIlhas: 120,
};

export interface PosicaoMapa {
  x: number;
  y: number;
  ilha: number;
}

export interface CidadeNoMapa {
  cidadeId: string;
  nomeCidade: string;
  username: string;
  mapaX: number;
  mapaY: number;
  ilha: number;
  pontos: number;
  aliacaTag: string | null;
  aliacaNome: string | null;
  nivelMaravilha: number;
  eBarbaro: boolean;
}

export interface AldeiaBarbaraNoMapa {
  id: string;
  nome: string;
  mapaX: number;
  mapaY: number;
  ilha: number;
  nivel: number;
  eBarbaro: true;
}

export type EntidadeMapa = CidadeNoMapa | AldeiaBarbaraNoMapa;

// Gerar posição aleatoria para uma cidade nova
export function gerarPosicaoMapa(): PosicaoMapa {
  const ilha = Math.floor(Math.random() * MAPA_CONFIG.totalIlhas) + 1;
  const pos = posicaoNaIlha(ilha);
  return { ...pos, ilha };
}

// Posicao fixa para uma ilha + slot
export function posicaoNaIlha(ilha: number, slot = 0): { x: number; y: number } {
  // Disposicao espiral simples para ilhas
  const centroX = 0;
  const centroY = 0;
  const anel = Math.floor((ilha - 1) / 8) + (ilha === 0 ? 0 : 0);
  const posAnel = (ilha - 1) % 8;
  const angulo = (posAnel * Math.PI * 2) / 8;
  const raio = anel * MAPA_CONFIG.distanciaIlhas;

  return {
    x: Math.floor(centroX + Math.cos(angulo) * raio + (slot % 4) * 30),
    y: Math.floor(centroY + Math.sin(angulo) * raio + Math.floor(slot / 4) * 30),
  };
}
