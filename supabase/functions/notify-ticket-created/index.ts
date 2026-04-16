import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { handleCorsOptions } from "../_shared/cors.ts";
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  parseRequestBody,
  logEvent,
} from "../_shared/error-handler.ts";

interface TicketNotificationRequest {
  ticketId: string;
}

serve(withErrorHandling(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  const { data: body, error: parseError } = await parseRequestBody<TicketNotificationRequest>(req);
  
  if (parseError || !body) {
    return createErrorResponse('VALIDATION_ERROR', req, parseError || 'Invalid request body');
  }

  const { ticketId } = body;

  if (!ticketId) {
    return createErrorResponse('MISSING_FIELD', req, 'ticketId is required');
  }

  logEvent('info', 'ticket-created-notification', { ticketId });
  
  // TODO: Integrate with Resend to send email notification
  // You'll need to:
  // 1. Sign up at https://resend.com
  // 2. Validate your domain at https://resend.com/domains  
  // 3. Create an API key at https://resend.com/api-keys
  // 4. Add RESEND_API_KEY as a secret
  
  // Example Resend integration (uncomment when ready):
  /*
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const resend = new Resend(RESEND_API_KEY);
  
  await resend.emails.send({
    from: 'Mãe Consciente <suporte@seudominio.com>',
    to: ['seu-email@exemplo.com'],
    subject: 'Novo Ticket de Suporte Criado',
    html: `
      <h2>Novo Ticket de Suporte</h2>
      <p>Um novo ticket foi criado no sistema.</p>
      <p>ID do Ticket: ${ticketId}</p>
    `
  });
  */
  
  return createSuccessResponse({ 
    success: true, 
    message: 'Ticket notification processed',
    ticketId 
  }, req);
}));
