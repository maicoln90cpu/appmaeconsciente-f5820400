/**
 * Rate limiter simples baseado em memória para Edge Functions
 * Limita chamadas de IA por usuário para evitar abuso
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpar entradas antigas a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;  // Máximo de requisições
  windowMs: number;     // Janela de tempo em ms (7 dias = 7 * 24 * 60 * 60 * 1000)
}

export function checkRateLimit(
  userId: string,
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfter?: number } {
  const key = `${userId}:${identifier}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Nova janela de tempo
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return { allowed: true };
  }

  if (entry.count >= config.maxRequests) {
    // Limite atingido
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Incrementar contador
  entry.count++;
  rateLimitStore.set(key, entry);
  return { allowed: true };
}

export function getRateLimitHeaders(retryAfter?: number): Record<string, string> {
  if (retryAfter) {
    return {
      'X-RateLimit-Retry-After': retryAfter.toString(),
      'Retry-After': retryAfter.toString(),
    };
  }
  return {};
}
