// ============================================================
// LOGIN STREAK — Recompensas de login consecutivo
// ============================================================

export interface RecompensaStreak {
  dia: number;
  madeira: number;
  pedra: number;
  prata: number;
  favor: number;
  bonusEspecial?: string;
}

export const RECOMPENSAS_STREAK: RecompensaStreak[] = [
  { dia: 1, madeira: 500, pedra: 500, prata: 500, favor: 0 },
  { dia: 2, madeira: 800, pedra: 800, prata: 800, favor: 20 },
  { dia: 3, madeira: 1200, pedra: 1200, prata: 1200, favor: 40 },
  { dia: 4, madeira: 1500, pedra: 1500, prata: 1500, favor: 60 },
  { dia: 5, madeira: 2000, pedra: 2000, prata: 2000, favor: 80 },
  { dia: 6, madeira: 2500, pedra: 2500, prata: 2500, favor: 100 },
  { dia: 7, madeira: 5000, pedra: 5000, prata: 5000, favor: 200, bonusEspecial: 'Poder Divino Extra' },
];

export function calcularProximoStreak(ultimoLogin: Date | null, streakAtual: number): { streak: number; recompensa: RecompensaStreak | null } {
  const agora = new Date();
  
  if (!ultimoLogin) {
    return { streak: 1, recompensa: RECOMPENSAS_STREAK[0] };
  }

  // Verificar se é o mesmo dia do calendário
  const isMesmoDia = 
    agora.getFullYear() === ultimoLogin.getFullYear() &&
    agora.getMonth() === ultimoLogin.getMonth() &&
    agora.getDate() === ultimoLogin.getDate();

  if (isMesmoDia) {
    // Já logou hoje, não dá recompensa e mantém o streak
    return { streak: streakAtual, recompensa: null };
  }

  const horasDesdeUltimo = (agora.getTime() - ultimoLogin.getTime()) / (1000 * 60 * 60);

  // Se passou menos de 48h, conta como dia consecutivo
  if (horasDesdeUltimo <= 48) {
    // Proxima recompensa (loop apos 7 dias)
    const proximo = streakAtual % 7;
    return { streak: streakAtual + 1, recompensa: RECOMPENSAS_STREAK[proximo] };
  }

  // Quebrou o streak — reseta
  return { streak: 1, recompensa: RECOMPENSAS_STREAK[0] };
}
