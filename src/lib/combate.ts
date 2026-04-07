// ============================================================
// SISTEMA DE COMBATE
// Simulador de batalha estilo Grepolis (PvE e PvP)
// ============================================================

import { IdUnidade, UNIDADES } from './unidades';

export interface ResultadoBatalha {
  sucesso: boolean;  // atacante venceu?
  baixasAtacante: Record<string, number>;
  baixasDefensor: Record<string, number>;
  exercitoAtacanteInicial: Record<string, number>;
  exercitoDefensorInicial: Record<string, number>;
  recursosRoubados: { madeira: number; pedra: number; prata: number };
  relatorio: string[];
}

export interface ItemAtaque {
  atacanteCidadeId: string;
  atacanteUsername: string;
  atacanteAliancaId: string | null;
  defensorCidadeId: string | null;
  defensorTipo: 'cidade' | 'barbaro';
  defensorAldeiaId: string | null;
  defensorUsername: string | null;
  defensorAliancaId: string | null;
  exercito: Record<string, number>;
  tipo: 'saque' | 'ataque';
  tempoChegada: number;
  ataqueId?: string;
}

/**
 * Calcula o poder de ataque total de um exército
 */
export function calcularPoderAtaque(exercito: Record<string, number>, bonusAtaque = 1): number {
  return Object.entries(exercito).reduce((total, [id, qtd]) => {
    const unidade = UNIDADES[id as IdUnidade];
    if (!unidade || qtd <= 0) return total;
    return total + (unidade.ataque * qtd * bonusAtaque);
  }, 0);
}

/**
 * Calcula o poder de defesa total de um exército (vs tipo de ataque)
 */
export function calcularPoderDefesa(exercito: Record<string, number>, bonusDefesa = 1): number {
  return Object.entries(exercito).reduce((total, [id, qtd]) => {
    const unidade = UNIDADES[id as IdUnidade];
    if (!unidade || qtd <= 0) return total;
    return total + (unidade.defesa * qtd * bonusDefesa);
  }, 0);
}

/**
 * Calcula bônus de defesa da Muralha
 * Cada nível de Muralha adiciona 3% de bônus de defesa
 */
export function calcularBonusMuralha(nivelMuralha: number): number {
  return 1 + (nivelMuralha * 0.03);
}

/**
 * Calcula moral do atacante (0.3 a 1.0 baseado em diferença de pontos)
 * Simplificado para single-player: sempre 1.0
 */
export function calcularMoral(): number {
  return 1.0;
}

/**
 * Simula uma batalha entre dois exércitos
 * Baseado nas mecânicas clássicas do Grepolis
 */
export function simularBatalha(
  exercitoAtacante: Record<string, number>,
  exercitoDefensor: Record<string, number>,
  nivelMuralha: number,
  recursosDefensor: { madeira: number; pedra: number; prata: number },
  bonusAtaque = 1,
  bonusDefesa = 1
): ResultadoBatalha {
  const relatorio: string[] = [];

  const moral = calcularMoral();
  const bonusMuralha = calcularBonusMuralha(nivelMuralha);

  const poderAtaque = calcularPoderAtaque(exercitoAtacante, bonusAtaque * moral);
  const poderDefesa = calcularPoderDefesa(exercitoDefensor, bonusDefesa * bonusMuralha);

  relatorio.push(`⚔️ Poder de ataque: ${Math.round(poderAtaque)}`);
  relatorio.push(`🛡️ Poder de defesa: ${Math.round(poderDefesa)} (Muralha Nv.${nivelMuralha} +${Math.round((bonusMuralha - 1) * 100)}%)`);

  const totalPoder = poderAtaque + poderDefesa;
  const fracaoAtaque = totalPoder > 0 ? poderAtaque / totalPoder : 0;
  const fracaoDefesa = totalPoder > 0 ? poderDefesa / totalPoder : 1;

  const atacanteVenceu = poderAtaque > poderDefesa;

  // Calcular baixas proporcionais
  // Atacante perde % baseada na força proporcional do defensor
  const taxaBaixasAtacante = atacanteVenceu
    ? fracaoDefesa * 0.5   // vencedor perde menos
    : fracaoDefesa * 0.8;  // perdedor perde mais

  const taxaBaixasDefensor = atacanteVenceu
    ? fracaoAtaque * 0.8
    : fracaoAtaque * 0.4;

  const baixasAtacante: Record<string, number> = {};
  const baixasDefensor: Record<string, number> = {};

  for (const [id, qtd] of Object.entries(exercitoAtacante)) {
    if (qtd > 0) {
      baixasAtacante[id] = Math.ceil(qtd * taxaBaixasAtacante);
    }
  }

  for (const [id, qtd] of Object.entries(exercitoDefensor)) {
    if (qtd > 0) {
      baixasDefensor[id] = Math.ceil(qtd * taxaBaixasDefensor);
    }
  }

  // Calcular capacidade de transporte para saque
  const capacidadeTransporte = Object.entries(exercitoAtacante).reduce((cap, [id, qtd]) => {
    const unidade = UNIDADES[id as IdUnidade];
    return cap + ((unidade?.capacidadeTransporte ?? 0) * qtd);
  }, 0);

  // Saque proporcional à capacidade e vitória
  const recursosRoubados = { madeira: 0, pedra: 0, prata: 0 };
  if (atacanteVenceu && capacidadeTransporte > 0) {
    const totalRecursos = recursosDefensor.madeira + recursosDefensor.pedra + recursosDefensor.prata;
    const saquePossivel = Math.min(capacidadeTransporte, totalRecursos * 0.5);
    const fracao = totalRecursos > 0 ? saquePossivel / totalRecursos : 0;

    recursosRoubados.madeira = Math.floor(recursosDefensor.madeira * fracao);
    recursosRoubados.pedra = Math.floor(recursosDefensor.pedra * fracao);
    recursosRoubados.prata = Math.floor(recursosDefensor.prata * fracao);

    relatorio.push(`💰 Saque: ${recursosRoubados.madeira} Madeira, ${recursosRoubados.pedra} Pedra, ${recursosRoubados.prata} Prata`);
  }

  if (atacanteVenceu) {
    relatorio.push('✅ Atacante VENCEU a batalha!');
  } else {
    relatorio.push('❌ Atacante foi DERROTADO!');
  }

  return {
    sucesso: atacanteVenceu,
    baixasAtacante,
    baixasDefensor,
    exercitoAtacanteInicial: { ...exercitoAtacante },
    exercitoDefensorInicial: { ...exercitoDefensor },
    recursosRoubados,
    relatorio
  };
}

