import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplyPromotionRequest {
  promotion_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { promotion_id }: ApplyPromotionRequest = await req.json();
    console.log("🎉 Aplicando promoção:", promotion_id);

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

    if (promoError) throw promoError;
    if (!promotion) {
      return new Response(
        JSON.stringify({ error: "Promoção não encontrada ou inativa" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📦 Promoção: ${promotion.name} - Produto: ${promotion.products?.title}`);

    // Buscar TODOS os usuários cadastrados
    const { data: allUsers, error: usersError } = await supabase
      .from("profiles")
      .select("id, email");

    if (usersError) throw usersError;

    if (!allUsers || allUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum usuário cadastrado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`👥 ${allUsers.length} usuários encontrados`);

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
      console.error("❌ Erro ao conceder acessos:", accessError);
      throw accessError;
    }

    console.log(`✅ Acesso concedido para ${allUsers.length} usuários`);

    // Enviar email para todos os usuários
    const emailPromises = allUsers.map(async (user) => {
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
        console.error(`⚠️ Erro ao enviar email para ${user.email}:`, err);
      }
    });

    // Enviar todos os emails em paralelo (sem aguardar para não travar)
    Promise.all(emailPromises).then(() => {
      console.log("📧 Emails de promoção enviados");
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        users_affected: allUsers.length,
        promotion_name: promotion.name,
        product_title: promotion.products?.title,
        expires_at: expirationDate,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("💥 Erro ao aplicar promoção:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
