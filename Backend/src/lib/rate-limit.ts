// ============================================================
// RATE LIMITING — Proteção contra força bruta em login/registro
// Armazenado no BANCO DE DADOS para funcionar em produção distribuída
// ============================================================

import { prisma } from './db';

export const RATE_LIMIT_CONFIG = {
  // Por username
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutos
  // Por IP
  maxIpAttempts: 10,
  ipWindowMs: 15 * 60 * 1000, // 15 minutos
  // Lockout
  lockoutMs: 30 * 60 * 1000, // 30 minutos
};

export async function checkRateLimit(
  identifier: string,
  ip?: string,
): Promise<{ allowed: boolean; remaining: number; resetTime?: number; error?: string }> {
  const now = Date.now();

  // Check username-based limit
  try {
    const usernameEntry = await prisma.rateLimit.findUnique({
      where: { identifier_tipo: { identifier: identifier.toLowerCase(), tipo: 'username' } },
    });

    if (usernameEntry) {
      const resetTimeMs = usernameEntry.resetTime.getTime();
      const lockUntilMs = usernameEntry.lockUntil?.getTime() ?? 0;

      if (usernameEntry.locked && now < lockUntilMs) {
        // Está em lockout
        const waitMinutes = Math.ceil((lockUntilMs - now) / 60000);
        return {
          allowed: false,
          remaining: 0,
          resetTime: lockUntilMs,
          error: `Muitas tentativas. Tente novamente em ${waitMinutes} minuto(s).`,
        };
      }

      if (now >= resetTimeMs) {
        // Window expired — limpar registro
        await prisma.rateLimit.delete({
          where: { identifier_tipo: { identifier: identifier.toLowerCase(), tipo: 'username' } },
        });
      } else if (usernameEntry.count >= RATE_LIMIT_CONFIG.maxAttempts) {
        const waitMinutes = Math.ceil((resetTimeMs - now) / 60000);
        return {
          allowed: false,
          remaining: 0,
          resetTime: resetTimeMs,
          error: `Muitas tentativas. Tente novamente em ${waitMinutes} minuto(s).`,
        };
      }
    }
  } catch (error) {
    // Se falhar, não bloquear o login (fail-open para não travar usuários legítimos)
    console.error('[RateLimit] Erro ao verificar username limit:', error);
  }

  // Check IP-based limit
  if (ip) {
    try {
      const ipEntry = await prisma.rateLimit.findUnique({
        where: { identifier_tipo: { identifier: ip, tipo: 'ip' } },
      });

      if (ipEntry) {
        const resetTimeMs = ipEntry.resetTime.getTime();
        const lockUntilMs = ipEntry.lockUntil?.getTime() ?? 0;

        if (ipEntry.locked && now < lockUntilMs) {
          const waitMinutes = Math.ceil((lockUntilMs - now) / 60000);
          return {
            allowed: false,
            remaining: 0,
            resetTime: lockUntilMs,
            error: `Muitas tentativas deste IP. Tente novamente em ${waitMinutes} minuto(s).`,
          };
        }

        if (now >= resetTimeMs) {
          await prisma.rateLimit.delete({
            where: { identifier_tipo: { identifier: ip, tipo: 'ip' } },
          });
        } else if (ipEntry.count >= RATE_LIMIT_CONFIG.maxIpAttempts) {
          const waitMinutes = Math.ceil((resetTimeMs - now) / 60000);
          return {
            allowed: false,
            remaining: 0,
            resetTime: resetTimeMs,
            error: `Muitas tentativas deste IP. Tente novamente em ${waitMinutes} minuto(s).`,
          };
        }
      }
    } catch (error) {
      console.error('[RateLimit] Erro ao verificar IP limit:', error);
    }
  }

  return { allowed: true, remaining: RATE_LIMIT_CONFIG.maxAttempts - (await getCount(identifier)) };
}

async function getCount(identifier: string): Promise<number> {
  try {
    const entry = await prisma.rateLimit.findUnique({
      where: { identifier_tipo: { identifier: identifier.toLowerCase(), tipo: 'username' } },
    });
    return entry?.count ?? 0;
  } catch {
    return 0;
  }
}

export async function recordFailedAttempt(identifier: string, ip?: string) {
  const now = Date.now();

  // Username-based
  try {
    await prisma.rateLimit.upsert({
      where: { identifier_tipo: { identifier: identifier.toLowerCase(), tipo: 'username' } },
      update: {
        count: { increment: 1 },
        // Se atingiu o limite, marcar como locked
        locked: { set: false },
        lockUntil: { set: null },
      },
      create: {
        identifier: identifier.toLowerCase(),
        tipo: 'username',
        count: 1,
        resetTime: new Date(now + RATE_LIMIT_CONFIG.windowMs),
      },
    });
  } catch (error) {
    console.error('[RateLimit] Erro ao registrar falha (username):', error);
  }

  // IP-based
  if (ip) {
    try {
      await prisma.rateLimit.upsert({
        where: { identifier_tipo: { identifier: ip, tipo: 'ip' } },
        update: {
          count: { increment: 1 },
        },
        create: {
          identifier: ip,
          tipo: 'ip',
          count: 1,
          resetTime: new Date(now + RATE_LIMIT_CONFIG.ipWindowMs),
        },
      });
    } catch (error) {
      console.error('[RateLimit] Erro ao registrar falha (IP):', error);
    }
  }
}

export async function recordSuccessfulAttempt(identifier: string, ip?: string) {
  // Reset counters on success
  try {
    await prisma.rateLimit.deleteMany({
      where: {
        OR: [
          { identifier: identifier.toLowerCase(), tipo: 'username' },
          ...(ip ? [{ identifier: ip, tipo: 'ip' }] : []),
        ],
      },
    });
  } catch (error) {
    console.error('[RateLimit] Erro ao limpar tentativas após sucesso:', error);
  }
}

// Cleanup de entradas expiradas — pode ser chamado via cron job
export async function cleanupRateLimitStore() {
  const now = new Date();

  try {
    // Deletar entradas expiradas sem lock
    await prisma.rateLimit.deleteMany({
      where: {
        resetTime: { lt: now },
        locked: false,
      },
    });

    // Deletar entradas com lock expirado
    await prisma.rateLimit.deleteMany({
      where: {
        lockUntil: { lt: now },
        locked: true,
      },
    });
  } catch (error) {
    console.error('[RateLimit] Erro na limpeza do store:', error);
  }
}
