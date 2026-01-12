/**
 * Smart route prefetching hook
 * Prefetches routes based on user behavior and connection quality
 */

import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { setupSmartPrefetch, trackRouteVisit, prefetchRoute } from '@/lib/bundle-analyzer';

// Define lazy imports for prefetching
const ROUTE_LOADERS: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('@/pages/Dashboard'),
  '/dashboard-bebe': () => import('@/pages/DashboardBebe'),
  '/diario-sono': () => import('@/pages/DiarioSono'),
  '/rastreador-amamentacao': () => import('@/pages/RastreadorAmamentacao'),
  '/cartao-vacinacao': () => import('@/pages/CartaoVacinacao'),
  '/monitor-desenvolvimento': () => import('@/pages/MonitorDesenvolvimento'),
  '/guia-alimentacao': () => import('@/pages/GuiaAlimentacao'),
  '/ferramentas-gestacao': () => import('@/pages/FerramentasGestacao'),
  '/mala-maternidade': () => import('@/pages/MalaDaMaternidade'),
  '/calculadora-fraldas': () => import('@/pages/CalculadoraFraldas'),
  '/minhas-conquistas': () => import('@/pages/MinhasConquistas'),
  '/comunidade': () => import('@/pages/Comunidade'),
  '/recuperacao-pos-parto': () => import('@/pages/RecuperacaoPosPartoPage'),
  '/perfil': () => import('@/pages/ProfileSettings'),
};

// Navigation patterns - which routes users typically visit next
const NAVIGATION_PATTERNS: Record<string, string[]> = {
  '/dashboard': ['/dashboard-bebe', '/diario-sono', '/rastreador-amamentacao'],
  '/dashboard-bebe': ['/diario-sono', '/rastreador-amamentacao', '/cartao-vacinacao'],
  '/diario-sono': ['/dashboard-bebe', '/rastreador-amamentacao'],
  '/rastreador-amamentacao': ['/dashboard-bebe', '/diario-sono', '/guia-alimentacao'],
  '/ferramentas-gestacao': ['/mala-maternidade', '/guia-alimentacao'],
  '/cartao-vacinacao': ['/monitor-desenvolvimento', '/dashboard-bebe'],
};

// High priority routes (prefetched immediately after login)
const HIGH_PRIORITY_ROUTES = ['/dashboard', '/dashboard-bebe'];

// Track if initial prefetch has been done
let initialPrefetchDone = false;

/**
 * Hook to manage intelligent route prefetching
 */
export function useRoutePrefetch() {
  const location = useLocation();
  
  // Track current route visit
  useEffect(() => {
    trackRouteVisit(location.pathname);
  }, [location.pathname]);
  
  // Prefetch likely next routes based on current location
  useEffect(() => {
    const currentPath = location.pathname;
    const likelyNextRoutes = NAVIGATION_PATTERNS[currentPath] || [];
    
    // Prefetch routes that user is likely to visit next
    likelyNextRoutes.forEach((path, index) => {
      const loader = ROUTE_LOADERS[path];
      if (loader) {
        prefetchRoute({
          path,
          priority: index === 0 ? 'high' : 'low',
          loader,
        });
      }
    });
  }, [location.pathname]);
  
  // Initial prefetch of high priority routes
  useEffect(() => {
    if (initialPrefetchDone) return;
    initialPrefetchDone = true;
    
    const routes = HIGH_PRIORITY_ROUTES.map(path => ({
      path,
      priority: 'high' as const,
      loader: ROUTE_LOADERS[path],
    })).filter(r => r.loader);
    
    setupSmartPrefetch(routes);
  }, []);
  
  // Manual prefetch function for link hover
  const prefetchOnHover = useCallback((path: string) => {
    const loader = ROUTE_LOADERS[path];
    if (loader) {
      prefetchRoute({
        path,
        priority: 'high',
        loader,
      });
    }
  }, []);
  
  return { prefetchOnHover };
}

/**
 * Prefetch common routes during idle time
 * Call this after initial page load
 */
export function prefetchCommonRoutes() {
  if (typeof window === 'undefined') return;
  
  const prefetch = () => {
    const routes = Object.entries(ROUTE_LOADERS).map(([path, loader]) => ({
      path,
      priority: HIGH_PRIORITY_ROUTES.includes(path) ? 'high' as const : 'low' as const,
      loader,
    }));
    
    setupSmartPrefetch(routes);
  };
  
  // Wait for idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => prefetch(), { timeout: 10000 });
  } else {
    setTimeout(prefetch, 5000);
  }
}
