/**
 * Valida URLs para prevenir ataques de XSS
 * Bloqueia protocolos perigosos como javascript:, data:, vbscript:, etc.
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  const trimmedUrl = url.trim().toLowerCase();

  // Lista de protocolos perigosos
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];

  // Verifica se a URL começa com um protocolo perigoso
  for (const protocol of dangerousProtocols) {
    if (trimmedUrl.startsWith(protocol)) {
      return false;
    }
  }

  // Aceita URLs relativas, http e https
  return (
    trimmedUrl.startsWith('http://') ||
    trimmedUrl.startsWith('https://') ||
    trimmedUrl.startsWith('/') ||
    trimmedUrl.startsWith('./') ||
    trimmedUrl.startsWith('../')
  );
}

/**
 * Sanitiza uma URL removendo espaços e validando
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();

  if (!isSafeUrl(trimmed)) {
    console.warn('Blocked unsafe URL:', trimmed);
    return null;
  }

  return trimmed;
}
