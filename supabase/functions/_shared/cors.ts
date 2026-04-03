/**
 * Configuração CORS centralizada para Edge Functions
 * Domínios permitidos em produção
 */

const ALLOWED_ORIGINS = [
  'https://dashboard-enxovalcompleto.lovable.app',
  'https://appmaeconsciente.lovable.app',
  'https://lovable.dev',
];

// Em desenvolvimento, permitir localhost
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
];

/**
 * Retorna os headers CORS apropriados baseados na origem da requisição
 */
export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigin = getAllowedOrigin(origin);
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Verifica se a origem é permitida
 */
export function getAllowedOrigin(origin?: string | null): string {
  if (!origin) {
    return ALLOWED_ORIGINS[0];
  }
  
  // Allow all *.lovable.app origins (preview + published)
  if (origin.endsWith('.lovable.app')) {
    return origin;
  }
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  
  if (DEV_ORIGINS.includes(origin)) {
    return origin;
  }
  
  return ALLOWED_ORIGINS[0];
}

/**
 * Handler para requisições OPTIONS (preflight)
 */
export function handleCorsOptions(req: Request): Response {
  const origin = req.headers.get('Origin');
  return new Response(null, { 
    status: 204,
    headers: getCorsHeaders(origin) 
  });
}

/**
 * Verifica se a origem é válida (para validação adicional)
 */
export function isOriginAllowed(origin?: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin) || DEV_ORIGINS.includes(origin);
}

/**
 * Extrai informações de request para logging
 */
export function getRequestInfo(req: Request): { ipAddress: string; userAgent: string } {
  return {
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown'
  };
}

/**
 * Loga evento de segurança no banco
 */
export async function logSecurityEvent(
  supabase: any,
  eventType: string,
  description: string,
  userId?: string,
  req?: Request,
  severity: 'info' | 'warning' | 'critical' = 'info',
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const requestInfo = req ? getRequestInfo(req) : { ipAddress: 'system', userAgent: 'system' };
    
    await supabase.from('security_audit_logs').insert({
      user_id: userId || null,
      event_type: eventType,
      event_description: description,
      ip_address: requestInfo.ipAddress,
      user_agent: requestInfo.userAgent,
      metadata,
      severity
    });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}
