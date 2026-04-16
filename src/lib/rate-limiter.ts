/**
 * Rate Limiter para Frontend
 * Previne spam e ataques de força bruta
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Configurações padrão
const DEFAULT_CONFIG = {
  maxAttempts: 5,
  windowMs: 60 * 1000, // 1 minuto
  lockoutMs: 5 * 60 * 1000, // 5 minutos de bloqueio
};

export interface RateLimitConfig {
  maxAttempts?: number;
  windowMs?: number;
  lockoutMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil?: Date;
  message?: string;
}

/**
 * Verifica e atualiza o rate limit para uma chave
 */
export function checkRateLimit(key: string, config: RateLimitConfig = {}): RateLimitResult {
  const {
    maxAttempts = DEFAULT_CONFIG.maxAttempts,
    windowMs = DEFAULT_CONFIG.windowMs,
    lockoutMs = DEFAULT_CONFIG.lockoutMs,
  } = config;

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (entry?.lockedUntil) {
    if (now < entry.lockedUntil) {
      const unlockTime = new Date(entry.lockedUntil);
      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: unlockTime,
        message: `Muitas tentativas. Tente novamente em ${Math.ceil((entry.lockedUntil - now) / 1000)} segundos.`,
      };
    }
    rateLimitStore.delete(key);
  }

  if (!entry || now - entry.firstAttempt > windowMs) {
    rateLimitStore.set(key, {
      count: 1,
      firstAttempt: now,
    });
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
    };
  }

  entry.count++;

  if (entry.count > maxAttempts) {
    entry.lockedUntil = now + lockoutMs;
    rateLimitStore.set(key, entry);

    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: new Date(entry.lockedUntil),
      message: `Muitas tentativas. Conta bloqueada por ${lockoutMs / 1000} segundos.`,
    };
  }

  rateLimitStore.set(key, entry);
  return {
    allowed: true,
    remainingAttempts: maxAttempts - entry.count,
  };
}

/**
 * Reseta o rate limit para uma chave
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Obtém o status atual do rate limit sem incrementar
 */
export function getRateLimitStatus(key: string, config: RateLimitConfig = {}): RateLimitResult {
  const { maxAttempts = DEFAULT_CONFIG.maxAttempts, windowMs = DEFAULT_CONFIG.windowMs } = config;

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return {
      allowed: true,
      remainingAttempts: maxAttempts,
    };
  }

  if (entry.lockedUntil && now < entry.lockedUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: new Date(entry.lockedUntil),
    };
  }

  if (now - entry.firstAttempt > windowMs) {
    return {
      allowed: true,
      remainingAttempts: maxAttempts,
    };
  }

  return {
    allowed: entry.count < maxAttempts,
    remainingAttempts: Math.max(0, maxAttempts - entry.count),
  };
}

/**
 * Limpa entradas antigas do rate limit store
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutos

  for (const [key, entry] of rateLimitStore.entries()) {
    const age = now - entry.firstAttempt;
    const isUnlocked = !entry.lockedUntil || now > entry.lockedUntil;

    if (age > maxAge && isUnlocked) {
      rateLimitStore.delete(key);
    }
  }
}

// Singleton do interval com proteção HMR
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

export function startRateLimitCleanup(): void {
  stopRateLimitCleanup();
  cleanupIntervalId = setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

export function stopRateLimitCleanup(): void {
  if (cleanupIntervalId !== null) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
}

// Iniciar automaticamente no browser
if (typeof window !== 'undefined') {
  startRateLimitCleanup();
}
