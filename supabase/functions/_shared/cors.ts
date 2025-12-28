/**
 * Configuração CORS centralizada para Edge Functions
 * Domínios permitidos em produção
 */

const ALLOWED_ORIGINS = [
  'https://dashboard-enxovalcompleto.lovable.app',
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
    // Se não houver origem, retorna o primeiro domínio permitido
    return ALLOWED_ORIGINS[0];
  }
  
  // Verificar origens de produção
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  
  // Verificar origens de desenvolvimento
  if (DEV_ORIGINS.includes(origin)) {
    return origin;
  }
  
  // Origin não permitida, retorna domínio de produção principal
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
