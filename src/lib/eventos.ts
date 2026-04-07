// ============================================================
// EVENTOS MUNDAIS — Eventos temporizados no servidor
// ============================================================

import { prisma } from './db';

export type EventoTipo =
  | 'invasao-barbara'
  | 'bencao-zeus'
  | 'bencao-poseidon'
  | 'comercio-vantajoso'
  | 'praga-atena'
  | 'chuva-recursos'
  | 'festival-olimpico';

export interface EventoDefinicao {
  tipo: EventoTipo;
  nome: string;
  descricao: string;
  bonus: Record<string, unknown>;
  duracaoMinutos: number;
}

export const DEFINICOES_EVENTOS: Record<EventoTipo, EventoDefinicao> = {
  'invasao-barbara': {
    tipo: 'invasao-barbara',
    nome: '⚔️ Invasão Bárbara',
    descricao: 'Bárbaros estão atacando! Todas as defesas de muralha +50% por 30 min.',
    bonus: { bonusMuralha: 1.5 },
    duracaoMinutos: 30,
  },
  'bencao-zeus': {
    tipo: 'bencao-zeus',
    nome: '⚡ Bênção de Zeus',
    descricao: 'Zeus abençoa todos os jogadores: produção de prata +50% por 20 min.',
    bonus: { bonusPrata: 1.5 },
    duracaoMinutos: 20,
  },
  'bencao-poseidon': {
    tipo: 'bencao-poseidon',
    nome: '🌊 Bênção de Poseidon',
    descricao: 'Poseidon acalma os mares: tempo de construção naval -30% por 20 min.',
    bonus: { reducaoNaval: 0.7 },
    duracaoMinutos: 20,
  },
  'comercio-vantajoso': {
    tipo: 'comercio-vantajoso',
    nome: '🏛️ Comércio Vantajoso',
    descricao: 'Rotas comerciais florecentes: câmbio do mercado +30% por 1 hora.',
    bonus: { bonusMercado: 1.3 },
    duracaoMinutos: 60,
  },
  'praga-atena': {
    tipo: 'praga-atena',
    nome: '🦉 Praga de Atena',
    descricao: 'Atena pune os pecadores: produção de recursos -30% por 15 min. Construa oferenda no Templo!',
    bonus: { reducaoProducao: 0.7 },
    duracaoMinutos: 15,
  },
  'chuva-recursos': {
    tipo: 'chuva-recursos',
    nome: '🌧️ Chuva de Recursos',
    descricao: 'Os deuses derradem riqueza: +200 de cada recurso para todos os jogadores.',
    bonus: { madeiraBonus: 200, pedraBonus: 200, prataBonus: 200 },
    duracaoMinutos: 1,
  },
  'festival-olimpico': {
    tipo: 'festival-olimpico',
    nome: '🏛️ Festival Olímpico',
    descricao: 'Celebração pan-helênica: todos os tempos de recrutamento -50% por 30 min.',
    bonus: { reducaoRecrutamento: 0.5 },
    duracaoMinutos: 30,
  },
};

export async function verificarEventosAtivos(agora?: number): Promise<Map<EventoTipo, Record<string, unknown>>> {
  const now = agora || Date.now();
  const eventos = await prisma.eventoMundial.findMany({
    where: { ativo: true, tempoInicio: { lte: new Date(now) }, tempoFim: { gte: new Date(now) } },
  });

  const bonusAgg = new Map<EventoTipo, Record<string, unknown>>();
  for (const evento of eventos) {
    const def = DEFINICOES_EVENTOS[evento.tipo as EventoTipo];
    if (def) {
      bonusAgg.set(evento.tipo as EventoTipo, { ...def.bonus, ...((evento.bonus as Record<string, unknown>) || {}) });
    }
  }
  return bonusAgg;
}

export async function criarEvento(tipo: EventoTipo, duracaoMinutos?: number): Promise<void> {
  const def = DEFINICOES_EVENTOS[tipo];
  const duracao = duracaoMinutos || def.duracaoMinutos;
  const agora = new Date();

  await prisma.eventoMundial.create({
    data: {
      tipo,
      bonus: def.bonus as object,
      tempoInicio: agora,
      tempoFim: new Date(agora.getTime() + duracao * 60 * 1000),
      ativo: true,
    },
  });

  // Se for chuva de recursos, aplica imediatamente em todas as cidades
  if (tipo === 'chuva-recursos') {
    const b = def.bonus as Record<string, number>;
    await prisma.cidade.updateMany({
      data: {
        madeira: { increment: b.madeiraBonus || 0 },
        pedra: { increment: b.pedraBonus || 0 },
        prata: { increment: b.prataBonus || 0 },
      },
    });
  }
}

// Scheduler simples: cria eventos aleatorios a cada X minutos
const INTERVALO_EVENTOS = 10 * 60 * 1000; // 10 min
const EVENTOS_ALEATORIOS: EventoTipo[] = [
  'comercio-vantajoso',
  'bencao-zeus',
  'bencao-poseidon',
  'festival-olimpico',
  'chuva-recursos',
  'invasao-barbara',
];

let schedulerIniciado = false;

export function iniciarSchedulerEventos() {
  if (schedulerIniciado) return;
  schedulerIniciado = true;

  setInterval(async () => {
    const agora = Date.now();
    // Verificar se algum evento ativo impede novo evento
    const ativos = await prisma.eventoMundial.count({
      where: { ativo: true, tempoFim: { gte: new Date(agora) } },
    });
    if (ativos >= 2) return; // Max 2 simultaneos

    // 40% de chance de criar evento
    if (Math.random() < 0.4) {
      const tipo = EVENTOS_ALEATORIOS[Math.floor(Math.random() * EVENTOS_ALEATORIOS.length)];
      await criarEvento(tipo);
    }
  }, INTERVALO_EVENTOS);
}
