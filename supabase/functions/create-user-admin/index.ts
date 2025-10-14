import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to?: string;
  subject?: string;
  html?: string;
  mode?: "send" | "check"; // 👈 Novo campo opcional para modo de teste
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, mode }: EmailRequest = await req.json();

    const egoiApiKey = Deno.env.get("EGOI_API_KEY");
    const senderEmail = Deno.env.get("EGOI_SENDER_EMAIL") || "noreply@example.com";
    const senderName = Deno.env.get("EGOI_SENDER_NAME") || "Sistema";

    if (!egoiApiKey) {
      console.error("❌ Variável EGOI_API_KEY não configurada");
      return new Response(JSON.stringify({ error: "EGOI_API_KEY não configurada no Supabase" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 🧪 Se for apenas um teste de chave, faz uma chamada simples GET ou HEAD (sem enviar e-mail)
    if (mode === "check") {
      console.log("🔑 Testando chave de API E-goi...");
      const checkRes = await fetch("https://api.egoiapp.com/v3/ping", {
        method: "GET",
        headers: { Apikey: egoiApiKey },
      });

      const checkRaw = await checkRes.text();
      console.log("📩 Resposta da E-goi (ping):", checkRaw);

      if (!checkRes.ok) {
        return new Response(JSON.stringify({ success: false, status: checkRes.status, response: checkRaw }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, status: checkRes.status, response: checkRaw }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 📤 Envio de e-mail real
    console.log("📤 Enviando email via E-goi para:", to);

    const payload = {
      subject,
      html_body: html,
      to: [to],
      from: {
        email: senderEmail,
        name: senderName,
      },
    };

    console.log("📦 Payload enviado:", JSON.stringify(payload, null, 2));

    let response: Response;
    try {
      response = await fetch("https://api.egoiapp.com/v3/email/transactional", {
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
      return new Response(JSON.stringify({ error: "Falha ao conectar com a E-goi", details: String(fetchErr) }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await response.text();

    if (!response.ok) {
      console.error("❌ Erro HTTP da E-goi:", response.status);
      console.error("📩 Corpo retornado:", raw);
      return new Response(
        JSON.stringify({
          error: `E-goi retornou erro HTTP ${response.status}`,
          response: raw,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let result: any;
    try {
      result = JSON.parse(raw);
    } catch (e) {
      console.error("⚠️ Resposta E-goi não é JSON válido:", raw.slice(0, 300));
      return new Response(JSON.stringify({ error: "A resposta da E-goi não é um JSON válido", raw }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Email enviado com sucesso via E-goi para:", to);
    console.log("📬 Resposta E-goi:", result);

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("🔥 Erro não tratado na função:", error);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
