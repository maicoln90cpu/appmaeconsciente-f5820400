import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { handleCorsOptions } from "../_shared/cors.ts";
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  parseRequestBody,
  logEvent,
} from "../_shared/error-handler.ts";

interface CreateUserRequest {
  email: string;
  full_name?: string;
}

/**
 * Generate a cryptographically secure random password
 */
function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  const charsetLength = charset.length;
  
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charsetLength];
  }
  
  return password;
}

serve(withErrorHandling(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  const { data: body, error: parseError } = await parseRequestBody<CreateUserRequest>(req);
  
  if (parseError || !body) {
    return createErrorResponse('VALIDATION_ERROR', req, parseError || 'Invalid request body');
  }

  const { email, full_name } = body;

  if (!email) {
    return createErrorResponse('MISSING_FIELD', req, 'email is required');
  }

  logEvent('info', 'create-user-start', { email });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Gerar senha aleatória segura
  const password = generateSecurePassword(16);

  // Criar usuário
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      full_name: full_name || email,
    },
  });

  if (authError) {
    logEvent('error', 'user-creation-failed', { error: authError.message });
    return createErrorResponse('DATABASE_ERROR', req, authError.message);
  }

  logEvent('info', 'user-created', { userId: authData.user.id });

  // Enviar email de boas-vindas (fire and forget)
  supabase.functions.invoke("send-resend-email", {
    body: {
      to: email,
      template: "welcome",
      data: {
        userName: full_name || email.split("@")[0],
        email: email,
        password: password,
      },
    },
  }).then(({ error }) => {
    if (error) {
      logEvent('warn', 'welcome-email-failed', { error: error.message });
    } else {
      logEvent('info', 'welcome-email-sent', { email });
    }
  }).catch((err) => {
    logEvent('warn', 'welcome-email-exception', { error: String(err) });
  });

  return createSuccessResponse({
    success: true,
    user: authData.user,
    message: "Usuário criado com sucesso",
  }, req);
}));
