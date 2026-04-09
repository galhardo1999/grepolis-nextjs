"use client";

// ============================================================
// ARCH-02 + ARCH-03: useMotorJogo — Thin Orchestrator
// Backed by Zustand store. Maintains backward-compatible API.
// This hook manages the game loop timer + events — the store
// handles all state and actions.
//
// GREPOLIS-STYLE: melhorarEdificio, recrutar e cancelar agora
// são server-first — chamam APIs que validam e persistem no
// banco de dados ANTES de atualizar a UI.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore, EventoConclusao, GanhoProducao } from '@/store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { IdEdificio } from '@/lib/edificios';
import { IdUnidade } from '@/lib/unidades';
import { IdPesquisa } from '@/lib/pesquisas';
import { IdDeus } from '@/lib/deuses';
import { ResultadoBatalha } from '@/lib/combate';

// Re-export types
export type { EventoConclusao } from '@/store/gameStore';

type TipoRecurso = 'madeira' | 'pedra' | 'prata';

// Tipo do estado retornado pelas APIs server-first
interface EstadoServidor {
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
  edificios: Record<string, number>;
  unidades: Record<string, number>;
  fila: unknown[];
  filaRecrutamento: unknown[];
  pesquisasConcluidas: string[];
  missoesColetadas: string[];
  cooldownsAldeias: Record<string, number>;
  nomeCidade: string;
  deusAtual: string | null;
  ultimaAtualizacao: number;
}

export function useMotorJogo() {
  const [agora, setAgora] = useState<number>(Date.now());
  const [eventosConclusao, setEventosConclusao] = useState<EventoConclusao[]>([]);
  const [carregado, setCarregado] = useState(false);
  // Estado de carregamento de ação server-first (construir/recrutar/cancelar)
  const [carregandoAcao, setCarregandoAcao] = useState(false);

  // ─── Zustand selectors (ARCH-03) ──────────────────────
  // useShallow prevents infinite re-renders from new object references
  const estado = useGameStore(useShallow((s) => ({
    recursos: s.recursos,
    deusAtual: s.deusAtual,
    edificios: s.edificios,
    unidades: s.unidades,
    pesquisasConcluidas: s.pesquisasConcluidas,
    missoesColetadas: s.missoesColetadas,
    fila: s.fila,
    filaRecrutamento: s.filaRecrutamento,
    ultimaAtualizacao: s.ultimaAtualizacao,
    nomeCidade: s.nomeCidade,
    cooldownsAldeias: s.cooldownsAldeias
  })));

  // ─── Store actions (don't cause re-renders) ───────────
  const calcularCustos = useGameStore((s) => s.calcularCustos);
  const calcularRenda = useGameStore((s) => s.calcularRenda);
  const calcularTempoConstrucao = useGameStore((s) => s.calcularTempoConstrucao);
  const possuiRecursos = useGameStore((s) => s.possuiRecursos);
  const selecionarDeus = useGameStore((s) => s.selecionarDeus);
  const calcularTempoRecrutamento = useGameStore((s) => s.calcularTempoRecrutamento);
  const definirNomeCidade = useGameStore((s) => s.definirNomeCidade);
  const lancarPoder = useGameStore((s) => s.lancarPoder);
  const pesquisar = useGameStore((s) => s.pesquisar);
  const temPesquisa = useGameStore((s) => s.temPesquisa);
  const atacarAldeiaBarbar = useGameStore((s) => s.atacarAldeiaBarbar);
  const trocarRecurso = useGameStore((s) => s.trocarRecurso);
  const resetarJogoStore = useGameStore((s) => s.resetarJogo);
  const tick = useGameStore((s) => s.tick);
  const sincronizarEstado = useGameStore((s) => s.sincronizarEstado);

  // Ações otimistas
  const melhorarEdificioStore = useGameStore((s) => s.melhorarEdificio);
  const cancelarMelhoriaStore = useGameStore((s) => s.cancelarMelhoria);
  const recrutarStore = useGameStore((s) => s.recrutar);
  const cancelarRecrutamentoStore = useGameStore((s) => s.cancelarRecrutamento);

  // ─── Hydration detection ──────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setCarregado(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // ─── Events cleanup ───────────────────────────────────
  const limparEventos = useCallback(() => setEventosConclusao([]), []);

  // ─── Game loop (1 second tick) ────────────────────────
  // O tick continua rodando para a simulação visual client-side
  const contadorTick = useRef(0);

  useEffect(() => {
    if (!carregado) return;

    const intervalo = setInterval(() => {
      const agoraMs = Date.now();
      setAgora(agoraMs);

      contadorTick.current++;
      const deveAtualizarRecursos = contadorTick.current % 5 === 0;

      const { eventos, ganhos } = tick(agoraMs, deveAtualizarRecursos);
      if (eventos.length > 0) {
        setEventosConclusao(prev => [...prev, ...eventos]);
      }
      
      if (deveAtualizarRecursos) {
        dispatchGanhos(ganhos);
      }
    }, 1000);

    return () => clearInterval(intervalo);
  }, [carregado, tick]);

  // Dispara evento de produção na BarraSuperior para animações flutuantes
  const dispatchGanhos = (ganhos: GanhoProducao) => {
    const temGanho = ganhos.madeira > 0 || ganhos.pedra > 0 || ganhos.prata > 0 || ganhos.favor > 0 || ganhos.populacao > 0;
    if (!temGanho) return;
    window.dispatchEvent(new CustomEvent('recurso-ganho', { detail: ganhos }));
  };

  // ─── Helper: sincronizar estado do servidor no Zustand ─
  const aplicarEstadoServidor = useCallback((estado: EstadoServidor) => {
    sincronizarEstado({
      recursos: estado.recursos,
      edificios: estado.edificios,
      unidades: estado.unidades,
      fila: estado.fila as Parameters<typeof sincronizarEstado>[0]['fila'],
      filaRecrutamento: estado.filaRecrutamento as Parameters<typeof sincronizarEstado>[0]['filaRecrutamento'],
      pesquisasConcluidas: estado.pesquisasConcluidas as Parameters<typeof sincronizarEstado>[0]['pesquisasConcluidas'],
      missoesColetadas: estado.missoesColetadas,
      cooldownsAldeias: estado.cooldownsAldeias,
      nomeCidade: estado.nomeCidade,
      deusAtual: estado.deusAtual as Parameters<typeof sincronizarEstado>[0]['deusAtual'],
      ultimaAtualizacao: estado.ultimaAtualizacao,
    });
  }, [sincronizarEstado]);

  // ─── OPTIMISTIC UI: Melhorar Edifício ──────────────────
  const melhorarEdificio = useCallback(async (
    idEdificio: IdEdificio
  ): Promise<{ sucesso: boolean; motivo?: string }> => {
    // 1. Atualização Otimista (Instantânea)
    const resultado = melhorarEdificioStore(idEdificio);
    if (!resultado.sucesso) return resultado;

    // 2. Validação Background
    fetch('/api/game/construir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edificio: idEdificio }),
    })
      .then(res => res.json())
      .then(dados => {
        if (dados.sucesso && dados.estado) aplicarEstadoServidor(dados.estado);
      }).catch(() => {});

    return { sucesso: true };
  }, [aplicarEstadoServidor, melhorarEdificioStore]);

  // ─── OPTIMISTIC UI: Cancelar Melhoria ──────────────────
  const cancelarMelhoria = useCallback(async (indice: number): Promise<void> => {
    cancelarMelhoriaStore(indice);

    fetch('/api/game/cancelar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'edificio', indice }),
    })
      .then(res => res.json())
      .then(dados => {
        if (dados.sucesso && dados.estado) aplicarEstadoServidor(dados.estado);
      }).catch(() => {});
  }, [aplicarEstadoServidor, cancelarMelhoriaStore]);

  // ─── OPTIMISTIC UI: Recrutar ───────────────────────────
  const recrutar = useCallback(async (
    idUnidade: IdUnidade,
    quantidade: number
  ): Promise<{ sucesso: boolean; motivo?: string }> => {
    const resultado = recrutarStore(idUnidade, quantidade);
    if (!resultado.sucesso) return resultado;

    fetch('/api/game/recrutar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unidade: idUnidade, quantidade }),
    })
      .then(res => res.json())
      .then(dados => {
        if (dados.sucesso && dados.estado) aplicarEstadoServidor(dados.estado);
      }).catch(() => {});

    return { sucesso: true };
  }, [aplicarEstadoServidor, recrutarStore]);

  // ─── OPTIMISTIC UI: Cancelar Recrutamento ─────────────
  const cancelarRecrutamento = useCallback(async (indice: number): Promise<void> => {
    cancelarRecrutamentoStore(indice);

    fetch('/api/game/cancelar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'recrutamento', indice }),
    })
      .then(res => res.json())
      .then(dados => {
        if (dados.sucesso && dados.estado) aplicarEstadoServidor(dados.estado);
      }).catch(() => {});
  }, [aplicarEstadoServidor, cancelarRecrutamentoStore]);

  // ─── Wrappers para compatibilidade retroativa ─────────
  const resetarJogo = useCallback(() => {
    resetarJogoStore();
  }, [resetarJogoStore]);

  // calcularRenda wrapper: components pass edificios but store already has them
  const calcularRendaWrapper = useCallback((_edificios?: Record<string, number>) => {
    return calcularRenda();
  }, [calcularRenda]);

  return {
    estado,
    agora,
    carregado,
    carregandoAcao,
    eventosConclusao,
    limparEventos,
    melhorarEdificio,
    cancelarMelhoria,
    calcularCustos,
    calcularRenda: calcularRendaWrapper,
    calcularTempoConstrucao,
    possuiRecursos,
    resetarJogo,
    selecionarDeus,
    recrutar,
    calcularTempoRecrutamento,
    cancelarRecrutamento,
    definirNomeCidade,
    lancarPoder,
    pesquisar,
    temPesquisa,
    atacarAldeiaBarbar,
    trocarRecurso,
    resetarJogoStore
  };
}
