import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.warn("[Sentry] DSN not configured. Error tracking disabled.");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
    
    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Session replay for debugging (optional, low sample rate)
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 0.1,
    
    // Filter out known non-critical errors
    ignoreErrors: [
      // Network errors that are expected
      "Failed to fetch",
      "NetworkError",
      "Load failed",
      // User-cancelled actions
      "AbortError",
      // Browser extensions
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
    ],
    
    // Add extra context
    beforeSend(event, hint) {
      // Don't send events in development
      if (import.meta.env.DEV) {
        console.log("[Sentry] Event captured (dev mode, not sent):", event);
        return null;
      }
      
      // Add user context if available
      const userId = localStorage.getItem("sb-user-id");
      if (userId) {
        event.user = { ...event.user, id: userId };
      }
      
      return event;
    },
    
    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy console logs
      if (breadcrumb.category === "console" && breadcrumb.level === "log") {
        return null;
      }
      return breadcrumb;
    },
  });
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
    console.error("[Sentry] Would capture:", error, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.component) {
      scope.setTag("component", context.component);
    }
    if (context?.action) {
      scope.setTag("action", context.action);
    }
    if (context?.extra) {
      scope.setExtras(context.extra);
    }
    
    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error), "error");
    }
  });
};

// Add breadcrumb for user actions
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, unknown>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level: "info",
    data,
  });
};

// Set user context (call after login)
export const setUserContext = (userId: string, email?: string) => {
  Sentry.setUser({ id: userId, email });
  localStorage.setItem("sb-user-id", userId);
};

// Clear user context (call after logout)
export const clearUserContext = () => {
  Sentry.setUser(null);
  localStorage.removeItem("sb-user-id");
};

export { Sentry };
