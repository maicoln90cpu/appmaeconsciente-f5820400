/**
 * @fileoverview Utilitários para lazy loading otimizado
 * @module lib/lazy-utils
 *
 * Provê funções para criar componentes lazy-loaded com preload
 * e retry automático em caso de falha de rede.
 */

import { lazy, ComponentType } from 'react';

import { trackChunkLoad } from './bundle-analyzer';

/**
 * Opções para lazy loading com retry
 */
interface LazyWithRetryOptions {
  /** Número máximo de tentativas (default: 3) */
  maxRetries?: number;
  /** Delay entre tentativas em ms (default: 1000) */
  retryDelay?: number;
}

/**
 * Cria um componente lazy-loaded com retry automático
 *
 * Útil para lidar com falhas de rede temporárias ao carregar chunks.
 *
 * @param importFn - Função de import dinâmico
 * @param options - Configurações de retry
 * @returns Componente lazy com retry
 *
 * @example
 * ```tsx
 * const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
 * ```
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyWithRetryOptions = {}
) {
  const { maxRetries = 3, retryDelay = 1000 } = options;

  return lazy(async () => {
    let lastError: Error | undefined;
    const startTime = performance.now();

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const module = await importFn();

        // Rastrear successful chunk load
        const chunkName = importFn.toString().match(/import\("(.+)"\)/)?.[1] || 'unknown';
        trackChunkLoad(chunkName, startTime);

        return module;
      } catch (error) {
        lastError = error as Error;

        // Se não é erro de rede/chunk, não faz retry
        if (!isChunkLoadError(error)) {
          throw error;
        }

        // Espera antes de tentar novamente
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // Todas as tentativas falharam - pode ser cache desatualizado
    const isChunkError = lastError && isChunkLoadError(lastError);
    if (isChunkError) {
      // Verificar se já tentamos reload recentemente (evitar loop)
      const lastReload = sessionStorage.getItem('chunk-reload-timestamp');
      const now = Date.now();

      if (!lastReload || now - parseInt(lastReload) > 30000) {
        // 30 segundos
        sessionStorage.setItem('chunk-reload-timestamp', now.toString());
        window.location.reload();
        // Retornar uma Promise que nunca resolve para evitar render
        return new Promise(() => {});
      }
    }

    throw lastError;
  });
}

/**
 * Verifica se o erro é relacionado ao carregamento de chunks
 */
function isChunkLoadError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('loading chunk') ||
      message.includes('failed to fetch') ||
      message.includes('network error') ||
      message.includes('load failed') ||
      message.includes('dynamically imported module')
    );
  }
  return false;
}

/**
 * Preload de componente para navegação antecipada
 *
 * Chama a função de import sem aguardar, iniciando o download
 * do chunk em background.
 *
 * @param importFn - Função de import dinâmico
 *
 * @example
 * ```tsx
 * // Em um link ou botão
 * onMouseEnter={() => preloadComponent(() => import('./pages/Dashboard'))}
 * ```
 */
export function preloadComponent(importFn: () => Promise<{ default: ComponentType<any> }>): void {
  // Inicia o download sem aguardar
  importFn().catch(() => {
    // Ignora erros de preload - o lazy load lidará com isso
  });
}

/**
 * Mapa de funções de import para preload por rota
 */
export const routeImports = {
  dashboard: () => import('@/pages/Dashboard'),
  dashboardBebe: () => import('@/pages/DashboardBebe'),
  materiais: () => import('@/pages/Materiais'),
  comunidade: () => import('@/pages/Comunidade'),
  suporte: () => import('@/pages/Suporte'),
  profile: () => import('@/pages/ProfileSettings'),
  admin: () => import('@/pages/AdminDashboard'),
  conquistas: () => import('@/pages/MinhasConquistas'),
  controleEnxoval: () => import('@/pages/Index'),
  calculadoraFraldas: () => import('@/pages/CalculadoraFraldas'),
  malaMaternidade: () => import('@/pages/MalaDaMaternidade'),
  guiaAlimentacao: () => import('@/pages/GuiaAlimentacao'),
  diarioSono: () => import('@/pages/DiarioSono'),
  rastreadorAmamentacao: () => import('@/pages/RastreadorAmamentacao'),
  cartaoVacinacao: () => import('@/pages/CartaoVacinacao'),
  ferramentasGestacao: () => import('@/pages/FerramentasGestacao'),
  recuperacaoPosParto: () => import('@/pages/RecuperacaoPosPartoPage'),
  monitorDesenvolvimento: () => import('@/pages/MonitorDesenvolvimento'),
} as const;

/**
 * Preload de rotas comuns usando requestIdleCallback
 *
 * Carrega chunks em momentos de ociosidade do browser
 */
export function prefetchCommonRoutes(): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => {
        // Rotas mais acessadas primeiro
        preloadComponent(routeImports.dashboard);
        preloadComponent(routeImports.materiais);
      },
      { timeout: 2000 }
    );

    // Segunda prioridade após 3 segundos
    requestIdleCallback(
      () => {
        preloadComponent(routeImports.comunidade);
        preloadComponent(routeImports.suporte);
      },
      { timeout: 5000 }
    );
  }
}

/**
 * Hook de preload baseado em viewport intersection
 *
 * Pode ser usado com IntersectionObserver para preload
 * quando um elemento entra no viewport.
 */
export function createPreloadObserver(
  importFn: () => Promise<{ default: ComponentType<any> }>
): IntersectionObserver {
  return new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          preloadComponent(importFn);
        }
      });
    },
    { rootMargin: '200px' }
  );
}
