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

interface GrantTrialRequest {
  user_id: string;
}

serve(withErrorHandling(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  const { data: body, error: parseError } = await parseRequestBody<GrantTrialRequest>(req);
  
  if (parseError || !body) {
    return createErrorResponse('VALIDATION_ERROR', req, parseError || 'Invalid request body');
  }

  const { user_id } = body;

  if (!user_id) {
    return createErrorResponse('MISSING_FIELD', req, 'user_id is required');
  }

  logEvent('info', 'grant-trial-start', { user_id });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Buscar produtos com trial habilitado
  const { data: trialProducts, error: productsError } = await supabase
    .from("products")
    .select("id, title, trial_days")
    .eq("trial_enabled", true)
    .eq("is_active", true);

  if (productsError) {
    logEvent('error', 'products-fetch-failed', { error: productsError.message });
    return createErrorResponse('DATABASE_ERROR', req, productsError.message);
  }

  if (!trialProducts || trialProducts.length === 0) {
    logEvent('info', 'no-trial-products');
    return createSuccessResponse({ 
      message: "Nenhum trial disponível",
      trials_granted: 0 
    }, req);
  }

  logEvent('info', 'trial-products-found', { count: trialProducts.length });

  // Conceder acesso para cada produto com trial
  const accessGrants = [];
  for (const product of trialProducts) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + (product.trial_days || 3));
    
    const { error: accessError } = await supabase
      .from("user_product_access")
      .upsert({
        user_id: user_id,
        product_id: product.id,
        expires_at: expirationDate.toISOString(),
      }, {
        onConflict: 'user_id,product_id'
      });

    if (accessError) {
      logEvent('warn', 'trial-access-failed', { 
        product_id: product.id, 
        error: accessError.message 
      });
    } else {
      logEvent('info', 'trial-granted', { 
        product: product.title, 
        days: product.trial_days 
      });
      accessGrants.push({
        product_title: product.title,
        trial_days: product.trial_days,
        expires_at: expirationDate,
      });
    }
  }

  // Buscar dados do usuário para enviar email
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user_id)
    .single();

  if (profile && accessGrants.length > 0) {
    // Enviar email de trial (fire and forget)
    supabase.functions.invoke("send-resend-email", {
      body: {
        to: profile.email,
        template: "trial",
        data: {
          userName: profile.email.split("@")[0],
          trialProducts: accessGrants,
        },
      },
    }).then(({ error }) => {
      if (error) {
        logEvent('warn', 'trial-email-failed', { error: error.message });
      } else {
        logEvent('info', 'trial-email-sent');
      }
    }).catch((err) => {
      logEvent('warn', 'trial-email-exception', { error: String(err) });
    });
  }

  return createSuccessResponse({ 
    success: true, 
    trials_granted: accessGrants.length,
    products: accessGrants,
  }, req);
}));
