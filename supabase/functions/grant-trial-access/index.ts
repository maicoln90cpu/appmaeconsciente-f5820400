import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

interface GrantTrialRequest {
  user_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));

  try {
    const { user_id }: GrantTrialRequest = await req.json();
    console.log("🎁 Concedendo trial para usuário:", user_id);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar produtos com trial habilitado
    const { data: trialProducts, error: productsError } = await supabase
      .from("products")
      .select("id, title, trial_days")
      .eq("trial_enabled", true)
      .eq("is_active", true);

    if (productsError) throw productsError;

    if (!trialProducts || trialProducts.length === 0) {
      console.log("ℹ️ Nenhum produto com trial configurado");
      return new Response(
        JSON.stringify({ message: "Nenhum trial disponível" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📦 ${trialProducts.length} produto(s) com trial encontrado(s)`);

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
        console.error(`❌ Erro ao conceder trial do produto ${product.id}:`, accessError);
      } else {
        console.log(`✅ Trial concedido: ${product.title} por ${product.trial_days} dias`);
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
      // Enviar email de boas-vindas com informações do trial
      try {
        const { error: emailError } = await supabase.functions.invoke("send-resend-email", {
          body: {
            to: profile.email,
            template: "trial",
            data: {
              userName: profile.email.split("@")[0],
              trialProducts: accessGrants,
            },
          },
        });

        if (emailError) {
          console.error("⚠️ Erro ao enviar email de trial:", emailError);
        } else {
          console.log("📧 Email de trial enviado com sucesso");
        }
      } catch (emailErr) {
        console.error("⚠️ Exceção ao enviar email:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        trials_granted: accessGrants.length,
        products: accessGrants,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("💥 Erro ao conceder trial:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
