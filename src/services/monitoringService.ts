/**
 * Serviço de Monitoramento — Escrita de logs no banco de dados
 *
 * Responsável por persistir erros, métricas de performance e uso de features
 * nas tabelas: client_error_logs, performance_logs, feature_usage_logs.
 *
 * IMPORTANTE: Este arquivo NÃO deve importar de logger.ts para evitar dependências circulares.
 * Usa console.error internamente apenas como fallback silencioso.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { getCurrentRequestId } from '@/lib/requestId';

// ─── Controle de taxa (debounce/throttle por tipo) ────────────────────────────
const THROTTLE_MS = 2000; // mínimo 2s entre writes do mesmo tipo
const lastWrite: Record<string, number> = {};

const shouldThrottle = (key: string): boolean => {
  const now = Date.now();
  if (lastWrite[key] && now - lastWrite[key] < THROTTLE_MS) {
    return true;
  }
  lastWrite[key] = now;
  return false;
};

// ─── Fila de escrita assíncrona (fire-and-forget, sem bloquear UI) ────────────
const writeQueue: Array<() => Promise<void>> = [];
let isProcessing = false;

const enqueue = (fn: () => Promise<void>) => {
  writeQueue.push(fn);
  if (!isProcessing) {
    processQueue();
  }
};

const processQueue = async () => {
  isProcessing = true;
  while (writeQueue.length > 0) {
    const task = writeQueue.shift();
    if (task) {
      try {
        await task();
      } catch {
        // Falha silenciosa — monitoramento não deve quebrar a aplicação
      }
    }
  }
  isProcessing = false;
};

// ─── Obter user_id atual (pode ser null se não autenticado) ───────────────────
const getCurrentUserId = (): string | null => {
  try {
    const stored = localStorage.getItem('sb-user-id');
    return stored || null;
  } catch {
    return null;
  }
};

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * Registra um erro de cliente no banco de dados (tabela: client_error_logs)
 */
export const logClientError = (
  errorMessage: string,
  options?: {
    componentName?: string;
    stackTrace?: string;
    url?: string;
    metadata?: Record<string, unknown>;
  }
): void => {
  // Só persiste em produção
  if (import.meta.env.DEV) return;

  const key = `error:${errorMessage.slice(0, 50)}`;
  if (shouldThrottle(key)) return;

  enqueue(async () => {
    const userId = getCurrentUserId();
    const requestId = getCurrentRequestId();
    await supabase.from('client_error_logs').insert([{
      error_message: errorMessage.slice(0, 1000),
      component_name: options?.componentName ?? null,
      stack_trace: options?.stackTrace?.slice(0, 5000) ?? null,
      url: options?.url ?? (typeof window !== 'undefined' ? window.location.pathname : null),
      user_id: userId ?? undefined,
      metadata: { ...(options?.metadata ?? {}), requestId: requestId || undefined } as unknown as Json,
    }]);
  });
};

/**
 * Registra uma métrica de performance no banco (tabela: performance_logs)
 * Usado para chamadas API lentas (> 2000ms) e Web Vitals pobres
 */
export const logPerformance = (
  operationName: string,
  durationMs: number,
  options?: {
    operationType?: string;
    metadata?: Record<string, unknown>;
  }
): void => {
  if (import.meta.env.DEV) return;

  const key = `perf:${operationName}`;
  if (shouldThrottle(key)) return;

  enqueue(async () => {
    const userId = getCurrentUserId();
    const requestId = getCurrentRequestId();
    await supabase.from('performance_logs').insert([{
      operation_name: operationName.slice(0, 200),
      operation_type: options?.operationType || 'query',
      duration_ms: Math.round(durationMs),
      is_slow: durationMs > 2000,
      user_id: userId ?? undefined,
      metadata: { ...(options?.metadata ?? {}), requestId: requestId || undefined } as unknown as Json,
    }]);
  });
};

/**
 * Registra uso de feature no banco (tabela: feature_usage_logs)
 * Eventos-chave: page_view, product_access, post_created, etc.
 */
export const logFeatureUsage = (
  featureName: string,
  metadata?: Record<string, unknown>
): void => {
  if (import.meta.env.DEV) return;

  const key = `feature:${featureName}`;
  if (shouldThrottle(key)) return;

  enqueue(async () => {
    const userId = getCurrentUserId();
    await supabase.from('feature_usage_logs').insert([{
      feature_name: featureName.slice(0, 200),
      user_id: userId ?? undefined,
      metadata: (metadata ?? {}) as unknown as Json,
    }]);
  });
};
