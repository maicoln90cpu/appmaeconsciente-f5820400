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
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = {}
): RateLimitResult {
  const { 
    maxAttempts = DEFAULT_CONFIG.maxAttempts,
    windowMs = DEFAULT_CONFIG.windowMs,
    lockoutMs = DEFAULT_CONFIG.lockoutMs 
  } = config;
  
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  // Se está bloqueado, verificar se o bloqueio expirou
  if (entry?.lockedUntil) {
    if (now < entry.lockedUntil) {
      const unlockTime = new Date(entry.lockedUntil);
      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: unlockTime,
        message: `Muitas tentativas. Tente novamente em ${Math.ceil((entry.lockedUntil - now) / 1000)} segundos.`
      };
    }
    // Bloqueio expirou, resetar
    rateLimitStore.delete(key);
  }
  
  // Se não existe entrada ou janela expirou, criar nova
  if (!entry || (now - entry.firstAttempt) > windowMs) {
    rateLimitStore.set(key, {
      count: 1,
      firstAttempt: now,
    });
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
    };
  }
  
  // Incrementar contador
  entry.count++;
  
  // Verificar se excedeu o limite
  if (entry.count > maxAttempts) {
    entry.lockedUntil = now + lockoutMs;
    rateLimitStore.set(key, entry);
    
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: new Date(entry.lockedUntil),
      message: `Muitas tentativas. Conta bloqueada por ${lockoutMs / 1000} segundos.`
    };
  }
  
  rateLimitStore.set(key, entry);
  return {
    allowed: true,
    remainingAttempts: maxAttempts - entry.count,
  };
}

/**
 * Reseta o rate limit para uma chave (após login bem sucedido, por exemplo)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Obtém o status atual do rate limit sem incrementar
 */
export function getRateLimitStatus(
  key: string,
  config: RateLimitConfig = {}
): RateLimitResult {
  const { 
    maxAttempts = DEFAULT_CONFIG.maxAttempts,
    windowMs = DEFAULT_CONFIG.windowMs,
  } = config;
  
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
  
  if ((now - entry.firstAttempt) > windowMs) {
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

// Limpar entradas antigas a cada 5 minutos
if (typeof window !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
