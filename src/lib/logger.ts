/**
 * Logger utility that only logs in development mode
 * Use this instead of console.log/error/warn throughout the app
 * Integrates with Sentry for production error tracking
 * 
 * NOTE: This file imports from sentry and performance.
 * To avoid circular dependencies:
 * - performance.ts must NOT import from logger.ts
 * - sentry.ts must NOT import from logger.ts
 */

import { captureError, addBreadcrumb } from "./sentry";
import { trackError } from "./performance";

const isDevelopment = import.meta.env.DEV;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  context?: string;
  data?: unknown;
}

const formatMessage = (level: LogLevel, message: string, options?: LoggerOptions): string => {
  const timestamp = new Date().toISOString();
  const context = options?.context ? `[${options.context}]` : '';
  return `${timestamp} ${level.toUpperCase()} ${context} ${message}`;
};

/**
 * Standardized logger with consistent API across the app.
 * 
 * Usage patterns:
 * - logger.debug('message', { context: 'ComponentName' })
 * - logger.info('message', { context: 'HookName', data: { ... } })
 * - logger.warn('message', { context: 'Service' })
 * - logger.error('message', error, { context: 'Handler' })
 * - logger.track('action_name', { key: 'value' })
 */
export const logger = {
  /**
   * Debug logs - only shown in development
   * Use for verbose debugging information
   */
  debug: (message: string, options?: LoggerOptions): void => {
    if (isDevelopment) {
      console.log(formatMessage('debug', message, options), options?.data ?? '');
    }
  },

  /**
   * Info logs - development only but adds breadcrumbs
   * Use for important state changes and flow tracking
   */
  info: (message: string, options?: LoggerOptions): void => {
    if (isDevelopment) {
      console.info(formatMessage('info', message, options), options?.data ?? '');
    }
    // Add breadcrumb for important info logs
    if (options?.context) {
      addBreadcrumb(message, options.context, options?.data as Record<string, unknown>);
    }
  },

  /**
   * Warning logs - always adds breadcrumbs
   * Use for recoverable issues and deprecation notices
   */
  warn: (message: string, options?: LoggerOptions): void => {
    if (isDevelopment) {
      console.warn(formatMessage('warn', message, options), options?.data ?? '');
    }
    // Add breadcrumb for warnings
    addBreadcrumb(message, options?.context || 'warning', options?.data as Record<string, unknown>);
  },

  /**
   * Error logs - always tracked in Sentry
   * Use for unrecoverable errors and exceptions
   * 
   * @param message - Human-readable error description
   * @param error - The error object (optional)
   * @param options - Context and additional data
   */
  error: (message: string, error?: unknown, options?: LoggerOptions): void => {
    // Always log errors to console in dev
    if (isDevelopment) {
      console.error(formatMessage('error', message, options), error ?? '', options?.data ?? '');
    } else {
      // In production, log minimal info to console
      console.error(`[ERROR] ${message}`);
    }
    
    // Track for local dashboard
    trackError(message);
    
    // Send to Sentry in production
    captureError(error || new Error(message), {
      component: options?.context,
      extra: options?.data as Record<string, unknown>,
    });
  },

  /**
   * Track user actions - adds breadcrumbs for debugging
   * Use for analytics-worthy events
   */
  track: (action: string, data?: Record<string, unknown>): void => {
    if (isDevelopment) {
      console.log(`[TRACK] ${action}`, data ?? '');
    }
    // Add breadcrumb for user actions
    addBreadcrumb(action, 'user-action', data);
  },

  /**
   * Create a scoped logger for a specific context
   * Use to avoid repeating context in every call
   * 
   * @example
   * const log = logger.scoped('MyComponent');
   * log.info('Mounted');
   * log.error('Failed to load', error);
   */
  scoped: (context: string) => ({
    debug: (message: string, data?: unknown) => logger.debug(message, { context, data }),
    info: (message: string, data?: unknown) => logger.info(message, { context, data }),
    warn: (message: string, data?: unknown) => logger.warn(message, { context, data }),
    error: (message: string, error?: unknown, data?: unknown) => 
      logger.error(message, error, { context, data }),
    track: (action: string, data?: Record<string, unknown>) => logger.track(action, data),
  }),
};

export default logger;
