import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { handleCorsOptions } from "../_shared/cors.ts";
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  parseRequestBody,
  logEvent,
} from "../_shared/error-handler.ts";

interface ResendCredentialsRequest {
  buyer_email: string;
  buyer_name: string;
  product_id: string;
  transaction_id?: string;
  force_new_password?: boolean;
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
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verificar autenticação
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return createErrorResponse('UNAUTHORIZED', req);
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return createErrorResponse('UNAUTHORIZED', req);
  }

  // Verificar se é admin
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (!roles) {
    return createErrorResponse('ADMIN_REQUIRED', req);
  }

  const { data: body, error: parseError } = await parseRequestBody<ResendCredentialsRequest>(req);
  
  if (parseError || !body) {
    return createErrorResponse('VALIDATION_ERROR', req, parseError || 'Invalid request body');
  }

  const { buyer_email, buyer_name, product_id, transaction_id, force_new_password } = body;

  if (!buyer_email || !product_id) {
    return createErrorResponse('MISSING_FIELD', req, 'buyer_email and product_id are required');
  }

  logEvent('info', 'resend-credentials-start', { 
    email: buyer_email, 
    product_id, 
    admin: user.email 
  });

  // Buscar produto
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, title, access_duration_days')
    .eq('id', product_id)
    .maybeSingle();

  if (productError || !product) {
    return createErrorResponse('NOT_FOUND', req, 'Produto não encontrado');
  }

  // Buscar ou criar usuário
  let userId: string;
  let userPassword = '';
  let isNewUser = false;

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', buyer_email.toLowerCase())
    .maybeSingle();

  if (existingProfile) {
    userId = existingProfile.id;
    logEvent('info', 'existing-user-found', { userId });

    if (force_new_password) {
      userPassword = generateSecurePassword(16);
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: userPassword }
      );

      if (updateError) {
        logEvent('error', 'password-update-failed', { error: updateError.message });
        return createErrorResponse('DATABASE_ERROR', req, 'Erro ao atualizar senha');
      }
      logEvent('info', 'password-updated');
    } else {
      userPassword = '(senha existente - não alterada)';
    }
  } else {
    logEvent('info', 'creating-new-user', { email: buyer_email });
    isNewUser = true;
    userPassword = generateSecurePassword(16);

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: buyer_email.toLowerCase(),
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        full_name: buyer_name,
        created_by: 'manual_admin_resend'
      }
    });

    if (createError) {
      logEvent('error', 'user-creation-failed', { error: createError.message });
      return createErrorResponse('DATABASE_ERROR', req, createError.message);
    }

    userId = newUser.user.id;
    logEvent('info', 'user-created', { userId });
  }

  // Calcular data de expiração
  let expiresAt = null;
  if (product.access_duration_days) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + product.access_duration_days);
    expiresAt = expirationDate.toISOString();
    logEvent('info', 'access-expiration', { days: product.access_duration_days, expiresAt });
  }

  // Conceder acesso ao produto
  const { error: accessError } = await supabase
    .from('user_product_access')
    .upsert({
      user_id: userId,
      product_id: product_id,
      expires_at: expiresAt
    }, {
      onConflict: 'user_id,product_id'
    });

  if (accessError) {
    logEvent('error', 'access-grant-failed', { error: accessError.message });
    return createErrorResponse('DATABASE_ERROR', req, 'Erro ao conceder acesso');
  }

  logEvent('info', 'access-granted');

  // Enviar email
  const { error: emailError } = await supabase.functions.invoke('send-resend-email', {
    body: {
      to: buyer_email,
      template: "purchase",
      data: {
        userName: buyer_name,
        email: buyer_email,
        password: userPassword,
        productTitle: product.title,
        expiresAt: expiresAt,
      },
    }
  });

  if (emailError) {
    logEvent('warn', 'email-send-failed', { error: emailError.message });
    return createSuccessResponse({ 
      success: true, 
      warning: 'Acesso concedido mas falha no envio do email',
      userId,
      emailError: emailError.message
    }, req);
  }

  logEvent('info', 'email-sent');

  // Registrar transação se fornecida
  if (transaction_id) {
    await supabase.from('hotmart_transactions').upsert({
      transaction_id: transaction_id,
      hotmart_product_id: 'MANUAL_RESEND',
      buyer_email: buyer_email,
      buyer_name: buyer_name,
      status: 'manually_processed',
      user_id: userId,
      product_id: product_id,
      event_type: 'MANUAL_ADMIN_RESEND',
    }, {
      onConflict: 'transaction_id',
      ignoreDuplicates: false
    });
  }

  return createSuccessResponse({
    success: true,
    message: 'Credenciais enviadas com sucesso',
    userId,
    isNewUser,
    passwordGenerated: isNewUser || force_new_password,
    expiresAt
  }, req);
}));
