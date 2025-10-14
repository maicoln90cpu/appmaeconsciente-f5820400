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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Lê e valida o JSON recebido na requisição
    const { to, subject, html }: EmailRequest = await req.json();
    console.log("Enviando email via E-goi para:", to);

    const egoiApiKey = Deno.env.get("EGOI_API_KEY");
    const senderEmail = Deno.env.get("EGOI_SENDER_EMAIL") || "noreply@example.com";
    const senderName = Deno.env.get("EGOI_SENDER_NAME") || "Sistema";

    if (!egoiApiKey) {
      throw new Error("EGOI_API_KEY não configurada");
    }

    // Monta o payload conforme documentação da E-goi
    const payload = {
      subject,
      html_body: html,
      to: [to],
      from: {
        email: senderEmail,
        name: senderName,
      },
    };

    // Faz a requisição para a E-goi
    const response = await fetch("https://api.egoiapp.com/emails/transactional", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Apikey: egoiApiKey,
      },
      body: JSON.stringify(payload),
    });

    // Lê o corpo cru da resposta
    const raw = await response.text();

    // Caso a API retorne erro HTTP, mostra o corpo bruto para debug
    if (!response.ok) {
      console.error("❌ Erro HTTP da E-goi:", response.status);
      console.error("📩 Corpo retornado:", raw.slice(0, 300));
      return new Response(
        JSON.stringify({
          error: `E-goi retornou erro HTTP ${response.status}`,
          raw: raw,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Tenta converter para JSON manualmente
    let result: any;
    try {
      result = JSON.parse(raw);
    } catch (e) {
      console.error("⚠️ Resposta E-goi não é JSON válido:", raw.slice(0, 300));
      return new Response(
        JSON.stringify({
          error: "A resposta da E-goi não é um JSON válido",
          raw: raw,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("✅ Email enviado com sucesso via E-goi para:", to);
    console.log("📬 Resposta:", result);

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("🔥 Erro ao enviar email via E-goi:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
