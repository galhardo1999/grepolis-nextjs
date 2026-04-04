"use client";

// ============================================================
// ARCH-02 + ARCH-03: useMotorJogo — Thin Orchestrator
// Backed by Zustand store. Maintains backward-compatible API.
// This hook manages the game loop timer + events — the store
// handles all state and actions.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore, EventoConclusao } from '@/store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { IdEdificio } from '@/lib/edificios';
import { IdUnidade } from '@/lib/unidades';
import { IdPesquisa } from '@/lib/pesquisas';
import { IdDeus } from '@/lib/deuses';
import { ResultadoBatalha } from '@/lib/combate';

// Re-export types
export type { EventoConclusao } from '@/store/gameStore';

type TipoRecurso = 'madeira' | 'pedra' | 'prata';

export function useMotorJogo() {
  const [agora, setAgora] = useState<number>(Date.now());
  const [eventosConclusao, setEventosConclusao] = useState<EventoConclusao[]>([]);
  const [carregado, setCarregado] = useState(false);

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
    nomeCidade: s.nomeCidade
  })));

  // ─── Store actions (don't cause re-renders) ───────────
  const melhorarEdificio = useGameStore((s) => s.melhorarEdificio);
  const cancelarMelhoria = useGameStore((s) => s.cancelarMelhoria);
  const calcularCustos = useGameStore((s) => s.calcularCustos);
  const calcularRenda = useGameStore((s) => s.calcularRenda);
  const calcularTempoConstrucao = useGameStore((s) => s.calcularTempoConstrucao);
  const possuiRecursos = useGameStore((s) => s.possuiRecursos);
  const selecionarDeus = useGameStore((s) => s.selecionarDeus);
  const recrutar = useGameStore((s) => s.recrutar);
  const calcularTempoRecrutamento = useGameStore((s) => s.calcularTempoRecrutamento);
  const cancelarRecrutamento = useGameStore((s) => s.cancelarRecrutamento);
  const definirNomeCidade = useGameStore((s) => s.definirNomeCidade);
  const lancarPoder = useGameStore((s) => s.lancarPoder);
  const pesquisar = useGameStore((s) => s.pesquisar);
  const temPesquisa = useGameStore((s) => s.temPesquisa);
  const atacarAldeiaBarbar = useGameStore((s) => s.atacarAldeiaBarbar);
  const trocarRecurso = useGameStore((s) => s.trocarRecurso);
  const resetarJogoStore = useGameStore((s) => s.resetarJogo);
  const tick = useGameStore((s) => s.tick);

  // ─── Hydration detection ──────────────────────────────
  useEffect(() => {
    // Zustand persist re-hydrates automatically from localStorage.
    // We just need a small delay to let it happen.
    const timer = setTimeout(() => setCarregado(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // ─── Events cleanup ───────────────────────────────────
  const limparEventos = useCallback(() => setEventosConclusao([]), []);

  // ─── Game loop (1 second tick) ────────────────────────
  useEffect(() => {
    if (!carregado) return;

    const intervalo = setInterval(() => {
      const agoraMs = Date.now();
      setAgora(agoraMs);

      const eventos = tick(agoraMs);
      if (eventos.length > 0) {
        setEventosConclusao(prev => [...prev, ...eventos]);
      }
    }, 1000);

    return () => clearInterval(intervalo);
  }, [carregado, tick]);

  // ─── Wrappers for backward compatibility ──────────────
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
    trocarRecurso
  };
}
