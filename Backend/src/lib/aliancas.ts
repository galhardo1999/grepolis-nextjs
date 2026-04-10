// ============================================================
// ALIANÇAS — Regras de negócio para alianças
// ============================================================

export const ALIANCA_REGRAS = {
  nomeMin: 3,
  nomeMax: 30,
  tagMin: 2,
  tagMax: 5,
  descricaoMax: 500,
};

export function validarTagAlianca(tag: string): string | null {
  const tagLimpa = tag.replace(/[^a-zA-Z0-9À-ú]/g, '').toUpperCase();
  if (tagLimpa.length < ALIANCA_REGRAS.tagMin) return 'Tag muito curta';
  if (tagLimpa.length > ALIANCA_REGRAS.tagMax) return `Tag muito longa (máximo ${ALIANCA_REGRAS.tagMax} caracteres)`;
  return null;
}

export function validarNomeAlianca(nome: string): string | null {
  const nomeLimpo = nome.replace(/<[^>]*>/g, '').trim();
  if (nomeLimpo.length < ALIANCA_REGRAS.nomeMin) return 'Nome muito curto';
  if (nomeLimpo.length > ALIANCA_REGRAS.nomeMax) return `Nome muito longo (máximo ${ALIANCA_REGRAS.nomeMax} caracteres)`;
  return null;
}
