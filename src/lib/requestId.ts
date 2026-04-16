/**
 * Gerador de Request ID para rastreamento (tracing)
 *
 * Cada chamada de rede recebe um ID único que é propagado como header
 * x-request-id, permitindo correlacionar frontend → edge function → banco.
 */

let counter = 0;

/**
 * Gera um requestId curto e único por sessão.
 * Formato: timestamp_base36 + counter_base36 + random (ex: "m1abc_3_x7k")
 */
export const generateRequestId = (): string => {
  const ts = Date.now().toString(36);
  const c = (counter++).toString(36);
  const rand = Math.random().toString(36).slice(2, 5);
  return `${ts}_${c}_${rand}`;
};

/**
 * Retorna o requestId da chamada atual (armazenado por request no contexto).
 * Usado pelo monitoringService para incluir nos logs.
 */
let _currentRequestId: string | null = null;

export const setCurrentRequestId = (id: string | null): void => {
  _currentRequestId = id;
};

export const getCurrentRequestId = (): string | null => {
  return _currentRequestId;
};
