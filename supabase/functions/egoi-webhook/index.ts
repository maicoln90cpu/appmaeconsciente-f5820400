import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EgoiWebhookEvent {
  event: string; // delivered, bounce, open, click, spam, unsubscribe
  email: string;
  campaign_hash?: string;
  list_id?: number;
  timestamp?: string;
  reason?: string; // para bounces
  link?: string; // para clicks
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse o evento do E-goi
    const event: EgoiWebhookEvent = await req.json();
    console.log("📥 Evento recebido do E-goi:", event);

    // Conectar ao Supabase para armazenar o evento
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Armazenar evento na tabela email_events
    const { error: insertError } = await supabase
      .from("email_events")
      .insert({
        event_type: event.event,
        email: event.email,
        campaign_hash: event.campaign_hash,
        list_id: event.list_id,
        timestamp: event.timestamp || new Date().toISOString(),
        reason: event.reason,
        link: event.link,
        raw_data: event,
      });

    if (insertError) {
      console.error("❌ Erro ao salvar evento:", insertError);
      // Não retornar erro para o E-goi, apenas logar
    } else {
      console.log("✅ Evento salvo com sucesso");
    }

    // Retornar sucesso para o E-goi
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("💥 Erro ao processar webhook:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
