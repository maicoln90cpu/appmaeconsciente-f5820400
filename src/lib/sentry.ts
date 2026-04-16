/**
 * Sentry integration for error tracking
 *
 * NOTE: This file must NOT import from logger.ts to avoid circular dependencies
 * Use console.log/warn/error directly for debugging within this file
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const initSentry = () => {
  if (!SENTRY_DSN) {
    if (import.meta.env.DEV) {
      console.warn('[Sentry] DSN not configured. Error tracking disabled.');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,

    // Performance monitoring - increased for better visibility
    tracesSampleRate: 0.2, // 20% of transactions
    profilesSampleRate: 0.1, // 10% of transactions for profiling

    // Session replay for debugging
    replaysSessionSampleRate: 0.02, // 2% of sessions
    replaysOnErrorSampleRate: 0.2, // 20% of error sessions

    // Habilitar integrations
    integrations: [
      Sentry.browserTracingIntegration({
        // Rastrear navigation performance
        enableLongTask: true,
        enableInp: true,
      }),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Filter out known non-critical errors
    ignoreErrors: [
      // Network errors that are expected
      'Failed to fetch',
      'NetworkError',
      'Load failed',
      'net::ERR_',
      'TypeError: Failed to fetch',
      // User-cancelled actions
      'AbortError',
      'The operation was aborted',
      // Browser extensions
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
      // React hydration
      'Minified React error',
      'Hydration failed',
      // Service worker
      'ServiceWorker',
      // ResizeObserver
      'ResizeObserver loop',
    ],

    // Deny URLs from noisy sources
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
      /googletagmanager\.com/i,
      /google-analytics\.com/i,
    ],

    // Adicionar extra context
    beforeSend(event, hint) {
      // Don't send events in development
      if (import.meta.env.DEV) {
        console.info('[Sentry] Event captured (dev mode, not sent):', event);
        return null;
      }

      // Adicionar user context if available
      const userId = localStorage.getItem('sb-user-id');
      if (userId) {
        event.user = { ...event.user, id: userId };
      }

      // Adicionar app version
      event.tags = {
        ...event.tags,
        app_version: import.meta.env.VITE_APP_VERSION || 'unknown',
      };

      return event;
    },

    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy console logs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null;
      }

      // Limit breadcrumb data size
      if (breadcrumb.data && typeof breadcrumb.data === 'object') {
        const data = breadcrumb.data as Record<string, unknown>;
        Object.keys(data).forEach(key => {
          if (typeof data[key] === 'string' && data[key].length > 500) {
            data[key] = (data[key] as string).substring(0, 500) + '...';
          }
        });
      }

      return breadcrumb;
    },
  });

  // Definir initial tags
  Sentry.setTag('platform', 'web');
  Sentry.setTag('pwa', 'serviceWorker' in navigator ? 'true' : 'false');
};

// Helper to capture exceptions with extra context
export const captureError = (
  error: unknown,
  context?: {
    component?: string;
    action?: string;
    extra?: Record<string, unknown>;
  }
) => {
  if (!SENTRY_DSN || import.meta.env.DEV) {
    console.error('[Sentry] Would capture:', error, context);
    return;
  }

  Sentry.withScope(scope => {
    if (context?.component) {
      scope.setTag('component', context.component);
    }
    if (context?.action) {
      scope.setTag('action', context.action);
    }
    if (context?.extra) {
      scope.setExtras(context.extra);
    }

    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error), 'error');
    }
  });
};

// Adicionar breadcrumb for user actions
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, unknown>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
};

// Definir user context (call after login)
export const setUserContext = (userId: string, email?: string) => {
  Sentry.setUser({ id: userId, email });
  localStorage.setItem('sb-user-id', userId);
};

// Limpar user context (call after logout)
export const clearUserContext = () => {
  Sentry.setUser(null);
  localStorage.removeItem('sb-user-id');
};

export { Sentry };
