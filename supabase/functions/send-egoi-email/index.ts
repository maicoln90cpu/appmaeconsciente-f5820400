import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
}

serve(async (req) => {
  // 🔹 CORS pré-verificação
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 📥 Recebe os dados do frontend / Supabase
    const { to, subject, html }: EmailRequest = await req.json();
    console.log("📤 Enviando email via E-goi para:", to);

    // 🔐 Variáveis de ambiente
    const egoiApiKey = Deno.env.get("EGOI_API_KEY");
    const senderEmail = Deno.env.get("EGOI_SENDER_EMAIL") || "noreply@example.com";
    const senderName = Deno.env.get("EGOI_SENDER_NAME") || "Sistema";

    if (!egoiApiKey) {
      console.error("❌ Variável EGOI_API_KEY não configurada");
      return new Response(
        JSON.stringify({ error: "EGOI_API_KEY não configurada no Supabase" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 📨 Payload E-goi
    const payload = {
      subject,
      html_body: html,
      to: [to],
      from: {
        email: senderEmail,
        name: senderName,
      },
    };

    // 🌐 Chamada à API E-goi
    let response: Response;
    try {
      response = await fetch("https://api.egoiapp.com/v3/email/transactional/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Apikey: egoiApiKey,
        },
        body: JSON.stringify(payload),
      });
    } catch (fetchErr) {
      console.error("🌐 Erro de conexão com E-goi:", fetchErr);
      return new Response(
        JSON.stringify({
          error: "Falha ao conectar com a E-goi",
          details: String(fetchErr),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 🧾 Lê corpo bruto da resposta
    const raw = await response.text();

    // 🚨 Se a resposta não for OK
    if (!response.ok) {
      console.error(`❌ Erro HTTP da E-goi: ${response.status}`);
      console.error("📩 Corpo retornado:", raw.slice(0, 500));
      return new Response(
        JSON.stringify({
          error: `E-goi retornou erro HTTP ${response.status}`,
          raw: raw,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 🧠 Tenta parsear o JSON de retorno
    let result: any;
    try {
      result = JSON.parse(raw);
    } catch (parseErr) {
      console.error("❌ Erro ao parsear resposta:", parseErr);
      return new Response(
        JSON.stringify({
          error: "Resposta da E-goi não é JSON válido",
          raw: raw.slice(0, 500),
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ✅ Sucesso
    console.log("✅ Email enviado com sucesso:", result);
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("💥 Erro geral:", error);
    return new Response(
      JSON.stringify({
        error: "Erro interno no envio de email",
        details: String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
