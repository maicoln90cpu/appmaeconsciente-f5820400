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

export const logger = {
  debug: (message: string, options?: LoggerOptions): void => {
    if (isDevelopment) {
      console.log(formatMessage('debug', message, options), options?.data ?? '');
    }
  },

  info: (message: string, options?: LoggerOptions): void => {
    if (isDevelopment) {
      console.info(formatMessage('info', message, options), options?.data ?? '');
    }
    // Add breadcrumb for important info logs
    if (options?.context) {
      addBreadcrumb(message, options.context, options?.data as Record<string, unknown>);
    }
  },

  warn: (message: string, options?: LoggerOptions): void => {
    if (isDevelopment) {
      console.warn(formatMessage('warn', message, options), options?.data ?? '');
    }
    // Add breadcrumb for warnings
    addBreadcrumb(message, options?.context || 'warning', options?.data as Record<string, unknown>);
  },

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

  // For tracking specific user actions (only in dev, but adds breadcrumb)
  track: (action: string, data?: Record<string, unknown>): void => {
    if (isDevelopment) {
      console.log(`[TRACK] ${action}`, data ?? '');
    }
    // Add breadcrumb for user actions
    addBreadcrumb(action, 'user-action', data);
  },
};

export default logger;
