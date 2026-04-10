// ============================================================
// RATE LIMITING — Proteção contra força bruta em login/registro
// ============================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store em memória (em produção, usar Redis ou similar)
const loginAttempts = new Map<string, RateLimitEntry>();
const ipAttempts = new Map<string, RateLimitEntry>();

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

export function checkRateLimit(
  identifier: string,
  ip?: string,
): { allowed: boolean; remaining: number; resetTime?: number; error?: string } {
  const now = Date.now();

  // Check username-based limit
  const entry = loginAttempts.get(identifier);
  if (entry) {
    if (now > entry.resetTime) {
      // Window expired — reset
      loginAttempts.delete(identifier);
    } else if (entry.count >= RATE_LIMIT_CONFIG.maxAttempts) {
      const waitMinutes = Math.ceil((entry.resetTime - now) / 60000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        error: `Muitas tentativas. Tente novamente em ${waitMinutes} minuto(s).`,
      };
    }
  }

  // Check IP-based limit
  if (ip) {
    const ipEntry = ipAttempts.get(ip);
    if (ipEntry) {
      if (now > ipEntry.resetTime) {
        ipAttempts.delete(ip);
      } else if (ipEntry.count >= RATE_LIMIT_CONFIG.maxIpAttempts) {
        const waitMinutes = Math.ceil((ipEntry.resetTime - now) / 60000);
        return {
          allowed: false,
          remaining: 0,
          resetTime: ipEntry.resetTime,
          error: `Muitas tentativas deste IP. Tente novamente em ${waitMinutes} minuto(s).`,
        };
      }
    }
  }

  return { allowed: true, remaining: RATE_LIMIT_CONFIG.maxAttempts - (entry?.count ?? 0) };
}

export function recordFailedAttempt(identifier: string, ip?: string) {
  const now = Date.now();

  // Username-based
  const entry = loginAttempts.get(identifier);
  if (entry) {
    entry.count += 1;
  } else {
    loginAttempts.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    });
  }

  // IP-based
  if (ip) {
    const ipEntry = ipAttempts.get(ip);
    if (ipEntry) {
      ipEntry.count += 1;
    } else {
      ipAttempts.set(ip, {
        count: 1,
        resetTime: now + RATE_LIMIT_CONFIG.ipWindowMs,
      });
    }
  }
}

export function recordSuccessfulAttempt(identifier: string, ip?: string) {
  // Reset counters on success
  loginAttempts.delete(identifier);
  if (ip) {
    ipAttempts.delete(ip);
  }
}

// Cleanup expired entries (call periodically)
export function cleanupRateLimitStore() {
  const now = Date.now();

  for (const [key, entry] of loginAttempts.entries()) {
    if (now > entry.resetTime + RATE_LIMIT_CONFIG.lockoutMs) {
      loginAttempts.delete(key);
    }
  }

  for (const [key, entry] of ipAttempts.entries()) {
    if (now > entry.resetTime + RATE_LIMIT_CONFIG.lockoutMs) {
      ipAttempts.delete(key);
    }
  }
}
