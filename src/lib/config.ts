//PRODUCAO DE RECURSOS
export const PROD_DE_RECURSOS = 130; //Recursos por hora

//PRODUCAO DE FAVORES
export const PRODUCAO_BASE_FAVOR = 1; // Favor por hora

//TEMPO DE CONSTRUCAO DE EDIFICIOS E TREINAMENTO DE UNIDADES
export const TEMPO_CONSTRUCAO_EDIFICIOS = 111;
export const TEMPO_TREINAMENTO_UNIDADES = 111;

//TAMANHO MAXIMO DE FILA DE OBRAS E RECRUTAMENTO
export const TAMANHO_MAXIMO_FILA_OBRAS = 7;
export const TAMANHO_MAXIMO_FILA_RECRUTAMENTO = 3;

export type TipoRecurso = 'madeira' | 'pedra' | 'prata';
//Taxas de câmbio do mercado (base, sem bônus de nível)
export const TAXAS_MERCADO: Record<TipoRecurso, Record<TipoRecurso, number>> = {
  madeira: { madeira: 1, pedra: 0.90, prata: 0.60 },
  pedra: { madeira: 0.90, pedra: 1, prata: 0.60 },
  prata: { madeira: 1.30, pedra: 1.30, prata: 1 }
};

// Capacidade do armazém por nível (mesma tabela usada no store e no servidor)
export const CAPACIDADE_ARMAZEM_POR_NIVEL = [
  300, 300, 711, 1185, 1706, 2267, 2862, 3487, 4140, 4818, 5518, 6241, 6984, 7746,
  8526, 9324, 10138, 10969, 11815, 12675, 13550, 14439, 15341, 16257, 17185, 18125,
  19077, 20041, 21016, 22003, 23000, 24008, 25026, 26055, 27093, 28100
] as const;

export function calcularCapacidadeArmazem(nivelArmazem: number, temCeramica: boolean): number {
  const indice = Math.max(0, Math.min(nivelArmazem, CAPACIDADE_ARMAZEM_POR_NIVEL.length - 1));
  const base = CAPACIDADE_ARMAZEM_POR_NIVEL[indice];
  return temCeramica ? Math.floor(base * 1.10) : base;
}
