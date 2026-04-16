import { createRoot } from 'react-dom/client';

import App from './App.tsx';

import './index.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import { observeLongTasks } from '@/lib/bundle-analyzer';
import { prefetchCommonRoutes } from '@/lib/lazy-utils';
import {
  initPerformanceObserver,
  instrumentFetch,
  preconnectCriticalOrigins,
  trackWebVital,
} from '@/lib/performance';
import { initSentry } from '@/lib/sentry';

// Preconnect to critical origins ASAP
preconnectCriticalOrigins();

// Initialize Sentry before rendering
initSentry();

// Initialize performance monitoring
initPerformanceObserver();
instrumentFetch();

// Track long tasks that block main thread
observeLongTasks(task => {
  if (task.duration > 50) {
    trackWebVital('LongTask', task.duration);
  }
});

// Cleanup old service workers and caches on startup
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    })
    .catch(() => {});

  if ('caches' in window) {
    caches
      .keys()
      .then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      })
      .catch(() => {});
  }
}

// Handler global para erros de chunk/módulo dinâmico
window.addEventListener('error', event => {
  if (
    event.message &&
    (event.message.includes('Loading chunk') ||
      event.message.includes('Failed to fetch dynamically imported module'))
  ) {
    const lastReload = sessionStorage.getItem('chunk-error-reload');
    const now = Date.now();

    if (!lastReload || now - parseInt(lastReload) > 30000) {
      sessionStorage.setItem('chunk-error-reload', now.toString());
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
window.addEventListener('unhandledrejection', event => {
  if (
    event.reason?.message &&
    (event.reason.message.includes('Loading chunk') ||
      event.reason.message.includes('Failed to fetch dynamically imported module'))
  ) {
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
    requestIdleCallback(() => prefetchCommonRoutes(), { timeout: 3000 });
  });
}

// Render application
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
