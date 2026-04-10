// ============================================================
// UTILITÁRIOS COMPARTILHADOS
// Centraliza funções usadas em múltiplos componentes
// ============================================================

/**
 * Formata segundos em string legível. Ex: 3661 → "1h 01m 01s"
 */
export function formatarTempo(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${sec.toString().padStart(2, '0')}s`;
  return `${sec}s`;
}

/**
 * Formata segundos no estilo relógio. Ex: 3661 → "01:01:01"
 */
export function formatarTempoRelogio(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Sanitiza texto de entrada do usuário contra XSS e tamanho
 */
export function sanitizarTexto(texto: string, maxLen = 15): string {
  return texto
    .replace(/[<>'"&]/g, '')
    .slice(0, maxLen)
    .trim();
}

/**
 * Calcula percentagem entre 0 e 100 com clamp
 */
export function calcularPorcentagem(atual: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, (atual / max) * 100));
}

/**
 * Formata o estado da cidade para o cliente, serializando datas e estrutura
 */
export function formatarEstadoParaCliente(cidade: {
  madeira: number;
  pedra: number;
  prata: number;
  populacao: number;
  populacaoMaxima: number;
  recursosMaximos: number;
  favor: number;
  favorMaximo: number;
  prataNaGruta: number;
  deusAtual: string | null;
  edificios: Record<string, number>;
  unidades: Record<string, number>;
  pesquisasConcluidas: string[];
  missoesColetadas: string[];
  fila: unknown[];
  filaRecrutamento: unknown[];
  cooldownsAldeias: Record<string, number>;
  nomeCidade: string;
  ultimaAtualizacao: Date | number;
}) {
  return {
    recursos: {
      madeira: cidade.madeira,
      pedra: cidade.pedra,
      prata: cidade.prata,
      populacao: cidade.populacao,
      populacaoMaxima: cidade.populacaoMaxima,
      recursosMaximos: cidade.recursosMaximos,
      favor: cidade.favor,
      favorMaximo: cidade.favorMaximo,
      prataNaGruta: cidade.prataNaGruta,
    },
    edificios: cidade.edificios,
    unidades: cidade.unidades,
    pesquisasConcluidas: cidade.pesquisasConcluidas,
    missoesColetadas: cidade.missoesColetadas,
    fila: cidade.fila,
    filaRecrutamento: cidade.filaRecrutamento,
    cooldownsAldeias: cidade.cooldownsAldeias,
    nomeCidade: cidade.nomeCidade,
    deusAtual: cidade.deusAtual,
    ultimaAtualizacao: (cidade.ultimaAtualizacao instanceof Date)
      ? cidade.ultimaAtualizacao.getTime()
      : cidade.ultimaAtualizacao,
  };
}
