import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { handleCorsOptions } from "../_shared/cors.ts";
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  parseRequestBody,
  logEvent,
} from "../_shared/error-handler.ts";

interface ApplyPromotionRequest {
  promotion_id: string;
}

serve(withErrorHandling(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  const { data: body, error: parseError } = await parseRequestBody<ApplyPromotionRequest>(req);
  
  if (parseError || !body) {
    return createErrorResponse('VALIDATION_ERROR', req, parseError || 'Invalid request body');
  }

  const { promotion_id } = body;

  if (!promotion_id) {
    return createErrorResponse('MISSING_FIELD', req, 'promotion_id is required');
  }

  logEvent('info', 'apply-promotion-start', { promotion_id });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Buscar dados da promoção
  const { data: promotion, error: promoError } = await supabase
    .from("promotions")
    .select(`
      *,
      products:product_id (
        id,
        title
      )
    `)
    .eq("id", promotion_id)
    .eq("is_active", true)
    .single();

  if (promoError) {
    logEvent('error', 'promotion-fetch-failed', { error: promoError.message });
    return createErrorResponse('DATABASE_ERROR', req, promoError.message);
  }

  if (!promotion) {
    return createErrorResponse('NOT_FOUND', req, 'Promoção não encontrada ou inativa');
  }

  logEvent('info', 'promotion-found', { 
    name: promotion.name, 
    product: promotion.products?.title 
  });

  // Buscar TODOS os usuários cadastrados
  const { data: allUsers, error: usersError } = await supabase
    .from("profiles")
    .select("id, email");

  if (usersError) {
    logEvent('error', 'users-fetch-failed', { error: usersError.message });
    return createErrorResponse('DATABASE_ERROR', req, usersError.message);
  }

  if (!allUsers || allUsers.length === 0) {
    return createSuccessResponse({ 
      message: "Nenhum usuário cadastrado",
      users_affected: 0 
    }, req);
  }

  logEvent('info', 'users-found', { count: allUsers.length });

  // Calcular data de expiração
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + promotion.duration_days);
  
  // Conceder acesso para todos os usuários
  const accessRecords = allUsers.map(user => ({
    user_id: user.id,
    product_id: promotion.product_id,
    expires_at: expirationDate.toISOString(),
  }));

  const { error: accessError } = await supabase
    .from("user_product_access")
    .upsert(accessRecords, {
      onConflict: 'user_id,product_id'
    });

  if (accessError) {
    logEvent('error', 'access-grant-failed', { error: accessError.message });
    return createErrorResponse('DATABASE_ERROR', req, accessError.message);
  }

  logEvent('info', 'access-granted', { users_count: allUsers.length });

  // Enviar email para todos os usuários (fire and forget)
  Promise.all(allUsers.map(async (user) => {
    try {
      await supabase.functions.invoke("send-resend-email", {
        body: {
          to: user.email,
          template: "promotion",
          data: {
            userName: user.email.split("@")[0],
            promotionName: promotion.name,
            productTitle: promotion.products?.title,
            durationDays: promotion.duration_days,
            expiresAt: expirationDate,
          },
        },
      });
    } catch (err) {
      logEvent('warn', 'email-send-failed', { email: user.email, error: String(err) });
    }
  })).then(() => {
    logEvent('info', 'emails-sent', { count: allUsers.length });
  });

  return createSuccessResponse({ 
    success: true, 
    users_affected: allUsers.length,
    promotion_name: promotion.name,
    product_title: promotion.products?.title,
    expires_at: expirationDate,
  }, req);
}));
