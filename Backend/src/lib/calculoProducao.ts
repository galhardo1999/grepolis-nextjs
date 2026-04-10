// ============================================================
// CALCULO DE PRODUCAO DE RECURSOS — fonte unica da verdade
// Usado no servidor (auth.ts, sync) e no cliente (gameStore)
// ============================================================

import { PROD_DE_RECURSOS, PRODUCAO_BASE_FAVOR } from './config';

const FATOR_CRESCIMENTO = 1.15;

// Producao horaria bruta (sem multiplicador de recursos/hora global)
export function producaoPorHora(nivel: number, multiplicador: number): number {
  const base = multiplicador * 10;
  if (nivel === 0) return (base * Math.pow(FATOR_CRESCIMENTO, 1)) / 2;
  return base * Math.pow(FATOR_CRESCIMENTO, nivel);
}

// Producao horaria ja com multiplicador PROD_DE_RECURSOS
export function calcularProducaoRecurso(nivel: number, multiplicador: number): number {
  return producaoPorHora(nivel, multiplicador) * PROD_DE_RECURSOS;
}

// Producao horaria de favor dos deuses
export function calcularProducaoFavor(deusAtual: string | null, nivelTemplo: number): number {
  if (!deusAtual) return 0;
  const bonusTemplo = 1 + nivelTemplo * 0.1;
  return PRODUCAO_BASE_FAVOR * PROD_DE_RECURSOS * bonusTemplo;
}
