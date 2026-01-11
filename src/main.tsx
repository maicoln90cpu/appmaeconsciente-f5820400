import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initSentry } from "@/lib/sentry";
import { 
  initPerformanceObserver, 
  instrumentFetch, 
  preconnectCriticalOrigins,
  trackWebVital 
} from "@/lib/performance";
import { observeLongTasks } from "@/lib/bundle-analyzer";
import { prefetchCommonRoutes } from "@/lib/lazy-utils";

// =============== DEBUG LOGS - VERSÃO 2025-01-11-v2 ===============
console.log('[DEBUG] main.tsx carregando - versão: 2025-01-11-v2');
console.log('[DEBUG] Timestamp:', new Date().toISOString());

// =============== EMERGÊNCIA: LIMPAR SERVICE WORKERS E CACHES ANTIGOS ===============
if ('serviceWorker' in navigator) {
  console.log('[DEBUG] Iniciando limpeza de Service Workers...');
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('[DEBUG] Service Workers encontrados:', registrations.length);
    registrations.forEach(registration => {
      console.log('[DEBUG] Desregistrando SW:', registration.scope);
      registration.unregister().then(success => {
        console.log('[DEBUG] SW desregistrado:', success);
      });
    });
  }).catch(err => {
    console.error('[DEBUG] Erro ao limpar SWs:', err);
  });
  
  // Limpar todos os caches do Workbox
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      console.log('[DEBUG] Caches encontrados:', cacheNames);
      cacheNames.forEach(cacheName => {
        console.log('[DEBUG] Deletando cache:', cacheName);
        caches.delete(cacheName).then(deleted => {
          console.log('[DEBUG] Cache deletado:', cacheName, deleted);
        });
      });
    }).catch(err => {
      console.error('[DEBUG] Erro ao limpar caches:', err);
    });
  }
}

// Preconnect to critical origins ASAP
console.log('[DEBUG] Preconnecting to critical origins...');
preconnectCriticalOrigins();

// Initialize Sentry before rendering
console.log('[DEBUG] Initializing Sentry...');
initSentry();

// Initialize performance monitoring
console.log('[DEBUG] Initializing performance observer...');
initPerformanceObserver();
instrumentFetch();

// Track long tasks that block main thread
observeLongTasks((task) => {
  if (task.duration > 50) {
    trackWebVital('LongTask', task.duration);
  }
});

// Handler global para erros de chunk/módulo dinâmico
window.addEventListener('error', (event) => {
  console.error('[DEBUG] Erro global capturado:', event.message);
  if (event.message && (
    event.message.includes('Loading chunk') ||
    event.message.includes('Failed to fetch dynamically imported module')
  )) {
    console.log('[DEBUG] Erro de chunk detectado, tentando reload...');
    const lastReload = sessionStorage.getItem('chunk-error-reload');
    const now = Date.now();
    
    if (!lastReload || now - parseInt(lastReload) > 30000) {
      sessionStorage.setItem('chunk-error-reload', now.toString());
      // Atualizar Service Worker se existir
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.update());
        });
      }
      window.location.reload();
    }
  }
});

// Handler para promessas não tratadas (lazy loading)
window.addEventListener('unhandledrejection', (event) => {
  console.error('[DEBUG] Promise rejeitada:', event.reason?.message);
  if (event.reason?.message && (
    event.reason.message.includes('Loading chunk') ||
    event.reason.message.includes('Failed to fetch dynamically imported module')
  )) {
    const lastReload = sessionStorage.getItem('chunk-error-reload');
    const now = Date.now();
    
    if (!lastReload || now - parseInt(lastReload) > 30000) {
      sessionStorage.setItem('chunk-error-reload', now.toString());
      window.location.reload();
    }
  }
});

// Prefetch common routes during idle time
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    console.log('[DEBUG] Window load event - prefetching routes...');
    // Wait for initial render to complete
    requestIdleCallback(() => prefetchCommonRoutes(), { timeout: 3000 });
  });
}

// =============== RENDERIZAÇÃO ===============
console.log('[DEBUG] Iniciando renderização do App...');

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('[DEBUG] ERRO CRÍTICO: Elemento #root não encontrado!');
} else {
  console.log('[DEBUG] Elemento #root encontrado, criando root...');
  try {
    const root = createRoot(rootElement);
    console.log('[DEBUG] createRoot executado com sucesso');
    
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
    console.log('[DEBUG] render() chamado com sucesso');
  } catch (err) {
    console.error('[DEBUG] Erro ao renderizar:', err);
  }
}
