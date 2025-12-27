/**
 * Logger utility that only logs in development mode
 * Use this instead of console.log/error/warn throughout the app
 */

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
  },

  warn: (message: string, options?: LoggerOptions): void => {
    if (isDevelopment) {
      console.warn(formatMessage('warn', message, options), options?.data ?? '');
    }
  },

  error: (message: string, error?: unknown, options?: LoggerOptions): void => {
    // Errors are logged in both dev and prod for debugging
    // But in prod, we might want to send to an error tracking service
    if (isDevelopment) {
      console.error(formatMessage('error', message, options), error ?? '', options?.data ?? '');
    } else {
      // In production, log minimal info to avoid exposing sensitive data
      console.error(`[ERROR] ${message}`);
    }
  },

  // For tracking specific user actions (only in dev)
  track: (action: string, data?: Record<string, unknown>): void => {
    if (isDevelopment) {
      console.log(`[TRACK] ${action}`, data ?? '');
    }
  },
};

export default logger;
