// ============================================================
// HOOK: useFilaProgresso
// Unifica lógica de cálculo de progresso das filas
// Elimina repetição de setInterval em múltiplos componentes
// ============================================================

import { useState, useEffect, useCallback } from 'react';

interface FilaProgressoResult {
  progresso: number; // 0 a 100
  tempoRestanteSegundos: number;
  concluida: boolean;
}

/**
 * Calcula o progresso de uma fila baseado no tempo.
 * Retorna percentual (0-100), tempo restante e status de conclusão.
 * Usa um único timer global otimizado.
 */
export function useFilaProgresso(
  inicioTempo: number | undefined,
  fimTempo: number | undefined,
  intervaloMs = 500
): FilaProgressoResult {
  const [progresso, setProgresso] = useState(0);
  const [tempoRestanteSegundos, setTempoRestanteSegundos] = useState(0);

  const calcularProgresso = useCallback(() => {
    if (!inicioTempo || !fimTempo) {
      return { progresso: 0, tempoRestanteSegundos: 0, concluida: true };
    }

    const now = Date.now();
    const elapsed = now - inicioTempo;
    const total = fimTempo - inicioTempo;

    if (total <= 0) {
      return { progresso: 100, tempoRestanteSegundos: 0, concluida: true };
    }

    const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
    const restante = Math.max(0, (fimTempo - now) / 1000);

    return {
      progresso: pct,
      tempoRestanteSegundos: restante,
      concluida: pct >= 100,
    };
  }, [inicioTempo, fimTempo]);

  useEffect(() => {
    // Calcular imediatamente
    const resultado = calcularProgresso();
    setProgresso(resultado.progresso);
    setTempoRestanteSegundos(resultado.tempoRestanteSegundos);

    // Se já concluiu, não precisa de timer
    if (resultado.concluida) return;

    // Timer para atualizar progresso
    const interval = setInterval(() => {
      const updated = calcularProgresso();
      setProgresso(updated.progresso);
      setTempoRestanteSegundos(updated.tempoRestanteSegundos);

      if (updated.concluida) {
        clearInterval(interval);
      }
    }, intervaloMs);

    return () => clearInterval(interval);
  }, [inicioTempo, fimTempo, intervaloMs, calcularProgresso]);

  return {
    progresso,
    tempoRestanteSegundos,
    concluida: progresso >= 100,
  };
}

/**
 * Hook para múltiplas filas simultâneas.
 * Usa um único timer para todas as filas (otimização de performance).
 */
export function useMultiplasFilas(
  filas: Array<{ inicioTempo: number; fimTempo: number }> | undefined[],
  intervaloMs = 500
): FilaProgressoResult[] {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, intervaloMs);
    return () => clearInterval(interval);
  }, [intervaloMs]);

  return filas.map(fila => {
    if (!fila || !fila.inicioTempo || !fila.fimTempo) {
      return { progresso: 0, tempoRestanteSegundos: 0, concluida: true };
    }

    const now = Date.now();
    const elapsed = now - fila.inicioTempo;
    const total = fila.fimTempo - fila.inicioTempo;

    if (total <= 0) {
      return { progresso: 100, tempoRestanteSegundos: 0, concluida: true };
    }

    const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
    const restante = Math.max(0, (fila.fimTempo - now) / 1000);

    return {
      progresso: pct,
      tempoRestanteSegundos: restante,
      concluida: pct >= 100,
    };
  });
}
