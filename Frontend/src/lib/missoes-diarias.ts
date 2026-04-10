// ============================================================
// MISSÕES DIÁRIAS — Pool de missões que rotacionam a cada 24h
// ============================================================

import { EstadoJogo as EstadoJogoT } from '@/store/gameStore';

// Alias for server-side usage with relaxed types
type EstadoJogo = EstadoJogoT & Partial<{ recursos: Partial<EstadoJogoT['recursos']> }>;

export interface MissaoDiaria {
  id: string;
  titulo: string;
  descricao: string;
  verificarProgresso: (estado: EstadoJogo) => { atual: number; necessario: number };
  recompensa: Record<string, number>;
  dificuldade: 'facil' | 'medio' | 'dificil';
}

// Todas as missões candidatas ao pool diário
export const POOL_MISSOES_DIARIAS: MissaoDiaria[] = [
  // — Recursos —
  {
    id: 'diaria-produzir-500',
    titulo: 'Colheita Abundante',
    descricao: 'Produza 500 recursos no total (madeira + pedra + prata).',
    verificarProgresso: (estado) => ({
      atual: Math.floor(estado.recursos.madeira || 0) + Math.floor(estado.recursos.pedra || 0) + Math.floor(estado.recursos.prata || 0),
      necessario: 500
    }),
    recompensa: { madeira: 100, pedra: 100, prata: 100 },
    dificuldade: 'facil'
  },
  {
    id: 'diaria-recursos-mil',
    titulo: 'Armazém Cheio',
    descricao: 'Acumule mais de 1000 de cada recurso.',
    verificarProgresso: (estado) => ({
      atual: Math.min(
        Math.floor(estado.recursos.madeira || 0),
        Math.floor(estado.recursos.pedra || 0),
        Math.floor(estado.recursos.prata || 0)
      ),
      necessario: 1000
    }),
    recompensa: { madeira: 200, pedra: 200, prata: 200, favor: 10 },
    dificuldade: 'medio'
  },

  // — Construção —
  {
    id: 'diaria-construir',
    titulo: 'Mãos à Obra',
    descricao: 'Inicie pelo menos 1 construção.',
    verificarProgresso: (estado) => ({
      atual: estado.fila?.length || 0,
      necessario: 1
    }),
    recompensa: { madeira: 150, pedra: 150 },
    dificuldade: 'facil'
  },
  {
    id: 'diaria-upgrade3',
    titulo: 'Construtor Dedicado',
    descricao: 'Complete 3 melhorias de edifícios (verifique o nível atual vs base).',
    verificarProgresso: (estado) => {
      const total = Object.values(estado.edificios || {}).reduce((a, b) => a + b, 0);
      return { atual: total, necessario: 3 };
    },
    recompensa: { madeira: 300, pedra: 300, prata: 200 },
    dificuldade: 'medio'
  },

  // — Recrutamento —
  {
    id: 'diaria-recrutar-10',
    titulo: 'Aldeia Crescendo',
    descricao: 'Recrute 10 unidades no total.',
    verificarProgresso: (estado) => {
      const total = Object.values(estado.unidades || {}).reduce((a, b) => a + b, 0);
      return { atual: total, necessario: 10 };
    },
    recompensa: { prata: 200, madeira: 150 },
    dificuldade: 'facil'
  },
  {
    id: 'diaria-recrutar-50',
    titulo: 'Exército Formidável',
    descricao: 'Tenha pelo menos 50 unidades no total.',
    verificarProgresso: (estado) => {
      const total = Object.values(estado.unidades || {}).reduce((a, b) => a + b, 0);
      return { atual: total, necessario: 50 };
    },
    recompensa: { prata: 500, madeira: 300, pedra: 300 },
    dificuldade: 'dificil'
  },

  // — Combate —
  {
    id: 'diaria-atacar',
    titulo: 'Espada Afiada',
    descricao: 'Realize 1 ataque a uma aldeia bárbara.',
    verificarProgresso: (estado) => {
      const ataquesRealizados = Object.values(estado.cooldownsAldeias || {}).filter(
        cooldown => cooldown > 0 && cooldown < Date.now()
      ).length;
      return { atual: Math.min(ataquesRealizados, 1), necessario: 1 };
    },
    recompensa: { prata: 300, favor: 20 },
    dificuldade: 'medio'
  },

  // — Divino —
  {
    id: 'diaria-templo',
    titulo: 'Fé Renovada',
    descricao: 'Tenha pelo menos 100 Favor Divino acumulado.',
    verificarProgresso: (estado) => ({
      atual: Math.floor(estado.recursos.favor || 0),
      necessario: 100
    }),
    recompensa: { favor: 50 },
    dificuldade: 'facil'
  },
  {
    id: 'diaria-deus',
    titulo: 'Devoção Total',
    descricao: 'Tenha um Deus selecionado e pelo menos 200 Favor.',
    verificarProgresso: (estado) => ({
      atual: estado.deusAtual ? Math.floor(estado.recursos.favor || 0) : 0,
      necessario: 200
    }),
    recompensa: { favor: 80, prata: 200 },
    dificuldade: 'medio'
  },

  // — Pesquisa —
  {
    id: 'diaria-academia',
    titulo: 'Sede de Conhecimento',
    descricao: 'Conclua pelo menos 1 pesquisa na Academia.',
    verificarProgresso: (estado) => ({
      atual: (estado.pesquisasConcluidas || []).length,
      necessario: 1
    }),
    recompensa: { prata: 400, favor: 30 },
    dificuldade: 'medio'
  },

  // — Comércio —
  {
    id: 'diaria-mercado-nivel',
    titulo: 'Negociador Nato',
    descricao: 'Alcance Mercado Nível 5.',
    verificarProgresso: (estado) => ({
      atual: estado.edificios?.mercado || 0,
      necessario: 5
    }),
    recompensa: { prata: 300, madeira: 300, pedra: 300 },
    dificuldade: 'dificil'
  },
];

/**
 * Seleciona 3 missões do pool baseado num seed (data).
 * Garante 1 fácil, 1 médio, 1 difícil por dia.
 */
export function getMissoesDoDia(data: Date): MissaoDiaria[] {
  const seed = data.getFullYear() * 10000 + (data.getMonth() + 1) * 100 + data.getDate();

  function seededRandom(index: number): number {
    const x = Math.sin(seed * 9301 + index * 49297) * 233280;
    return x - Math.floor(x);
  }

  const faceis = POOL_MISSOES_DIARIAS.filter(m => m.dificuldade === 'facil');
  const medios = POOL_MISSOES_DIARIAS.filter(m => m.dificuldade === 'medio');
  const dificeis = POOL_MISSOES_DIARIAS.filter(m => m.dificuldade === 'dificil');

  const escolhidas: MissaoDiaria[] = [];
  if (faceis.length > 0) escolhidas.push(faceis[Math.floor(seededRandom(0) * faceis.length)]);
  if (medios.length > 0) escolhidas.push(medios[Math.floor(seededRandom(1) * medios.length)]);
  if (dificeis.length > 0) escolhidas.push(dificeis[Math.floor(seededRandom(2) * dificeis.length)]);

  return escolhidas;
}

/**
 * Formata a data usada como chave de rotacao (YYYY-MM-DD).
 */
export function dataChave(data: Date): string {
  return data.toISOString().split('T')[0];
}
