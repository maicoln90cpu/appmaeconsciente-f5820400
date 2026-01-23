/**
 * Centralized error handling for Edge Functions
 * Provides consistent error responses and logging
 */

import { getCorsHeaders } from './cors.ts';

export interface ErrorDetails {
  code: string;
  message: string;
  details?: string;
  statusCode: number;
}

export const ErrorCodes = {
  // Authentication errors (401)
  UNAUTHORIZED: { code: 'UNAUTHORIZED', message: 'Não autorizado', statusCode: 401 },
  INVALID_TOKEN: { code: 'INVALID_TOKEN', message: 'Token inválido ou expirado', statusCode: 401 },
  
  // Authorization errors (403)
  FORBIDDEN: { code: 'FORBIDDEN', message: 'Acesso negado', statusCode: 403 },
  ADMIN_REQUIRED: { code: 'ADMIN_REQUIRED', message: 'Acesso restrito a administradores', statusCode: 403 },
  
  // Validation errors (400)
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', message: 'Dados inválidos', statusCode: 400 },
  MISSING_FIELD: { code: 'MISSING_FIELD', message: 'Campo obrigatório ausente', statusCode: 400 },
  INVALID_FORMAT: { code: 'INVALID_FORMAT', message: 'Formato inválido', statusCode: 400 },
  
  // Rate limiting (429)
  RATE_LIMITED: { code: 'RATE_LIMITED', message: 'Limite de requisições atingido', statusCode: 429 },
  
  // Not found (404)
  NOT_FOUND: { code: 'NOT_FOUND', message: 'Recurso não encontrado', statusCode: 404 },
  USER_NOT_FOUND: { code: 'USER_NOT_FOUND', message: 'Usuário não encontrado', statusCode: 404 },
  
  // Server errors (500)
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor', statusCode: 500 },
  DATABASE_ERROR: { code: 'DATABASE_ERROR', message: 'Erro ao acessar banco de dados', statusCode: 500 },
  EXTERNAL_API_ERROR: { code: 'EXTERNAL_API_ERROR', message: 'Erro ao acessar serviço externo', statusCode: 500 },
  AI_ERROR: { code: 'AI_ERROR', message: 'Erro ao processar requisição de IA', statusCode: 500 },
  
  // Configuration errors (503)
  CONFIG_ERROR: { code: 'CONFIG_ERROR', message: 'Configuração ausente ou inválida', statusCode: 503 },
  SERVICE_UNAVAILABLE: { code: 'SERVICE_UNAVAILABLE', message: 'Serviço temporariamente indisponível', statusCode: 503 },
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  errorCode: ErrorCode,
  req: Request,
  details?: string
): Response {
  const error = ErrorCodes[errorCode];
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
  
  const body = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
  };
  
  console.error(`[${error.code}] ${error.message}${details ? `: ${details}` : ''}`);
  
  return new Response(JSON.stringify(body), {
    status: error.statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  req: Request,
  statusCode = 200
): Response {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
  
  const body = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Wraps an edge function handler with error handling
 */
export function withErrorHandling(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (error) {
      console.error('Unhandled error in edge function:', error);
      
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return createErrorResponse('INTERNAL_ERROR', req, message);
    }
  };
}

/**
 * Validates required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): { valid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(
    field => body[field] === undefined || body[field] === null || body[field] === ''
  );
  
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Safely parses JSON request body
 */
export async function parseRequestBody<T = Record<string, unknown>>(
  req: Request
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await req.json() as T;
    return { data, error: null };
  } catch {
    return { data: null, error: 'Corpo da requisição inválido' };
  }
}

/**
 * Logs structured event for debugging
 */
export function logEvent(
  level: 'info' | 'warn' | 'error',
  event: string,
  data?: Record<string, unknown>
): void {
  const logEntry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...(data && { data }),
  };
  
  switch (level) {
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    default:
      console.log(JSON.stringify(logEntry));
  }
}
