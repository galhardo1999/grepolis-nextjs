// ============================================================
// PROTEÇÃO OFFLINE / ESCUDO — protege novos jogadores e após derrotas
// ============================================================

import { prisma } from './db';

const PROTECAO_NOVO_PLAYER = 24 * 60 * 60 * 1000; // 24h

export interface CheckProtecaoResult {
  protegido: boolean;
  tempoRestanteMinutos: number;
  motivo: string;
}

export async function verificarProtecao(cidadeId: string): Promise<CheckProtecaoResult> {
  const cidade = await prisma.cidade.findUnique({
    where: { id: cidadeId },
    select: { protecaoOfflineAte: true, ultimoLogin: true, nivelMaravilha: true, pontos: true },
  });
  if (!cidade) return { protegido: false, tempoRestanteMinutos: 0, motivo: '' };

  // Proteção explícita definida
  if (cidade.protecaoOfflineAte) {
    const agora = new Date();
    if (agora < cidade.protecaoOfflineAte) {
      const restantes = (cidade.protecaoOfflineAte.getTime() - agora.getTime()) / 60000;
      return {
        protegido: true,
        tempoRestanteMinutos: restantes,
        motivo: 'Escudo de proteção ativo',
      };
    }
  }

  return { protegido: false, tempoRestanteMinutos: 0, motivo: '' };
}

export async function ativarProtecao(cidadeId: string, duracaoMs: number): Promise<Date> {
  const ate = new Date(Date.now() + duracaoMs);
  await prisma.cidade.update({
    where: { id: cidadeId },
    data: { protecaoOfflineAte: ate },
  });
  return ate;
}

export async function removerProtecao(cidadeId: string): Promise<void> {
  await prisma.cidade.update({
    where: { id: cidadeId },
    data: { protecaoOfflineAte: null },
  });
}

// Verificar se deve conceder proteção por ausência longa no próximo login
export async function verificarProtecaoAusencia(cidadeId: string, ultimoLogin: Date | null): Promise<boolean> {
  if (!ultimoLogin) return false;

  const agora = new Date();
  const horasAusente = (agora.getTime() - ultimoLogin.getTime()) / (1000 * 60 * 60);
  if (horasAusente >= 24) {
    // Se ficou mais de 24h sem logar, dar 4h de escudo
    await ativarProtecao(cidadeId, 4 * 60 * 60 * 1000);
    return true;
  }
  return false;
}

export { PROTECAO_NOVO_PLAYER };
