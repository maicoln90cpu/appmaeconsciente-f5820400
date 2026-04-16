import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

interface EmailRequest {
  to: string;
  subject?: string;
  html?: string;
  template?: "welcome" | "trial" | "promotion" | "purchase";
  data?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));

  try {
    const { to, subject, html, template, data: emailData }: EmailRequest = await req.json();
    console.log("📤 Enviando email via Resend para:", to);
    if (template) console.log("📧 Template:", template);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("❌ RESEND_API_KEY não configurada");
      return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let emailHtml = html || "";
    let emailSubject = subject || "Mãe Consciente";

    // Generate HTML based on template if provided
    if (template && emailData) {
      switch (template) {
        case "welcome":
          emailSubject = "Bem-vindo(a) à Mãe Consciente!";
          emailHtml = `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;background:#f6f9fc;margin:0;padding:40px}.container{max-width:600px;margin:0 auto;background:#fff;padding:40px;border-radius:8px}h1{color:#333;text-align:center}.credentials{background:#f4f4f4;padding:24px;border-radius:8px;margin:24px 0;border-left:4px solid hsl(263,70%,50%)}.button{display:inline-block;padding:14px 20px;background:hsl(263,70%,50%);color:#fff;text-decoration:none;border-radius:6px;margin:24px 0;font-weight:600}</style></head><body><div class="container"><h1>🎉 Bem-vindo(a) à Mãe Consciente!</h1><p>Olá, <strong>${emailData.userName}</strong>!</p><p>Sua conta foi criada com sucesso! Use as credenciais abaixo:</p><div class="credentials"><p><strong>📧 Email:</strong> ${emailData.email}</p><p><strong>🔑 Senha:</strong> <code style="background:#fff;padding:12px;border-radius:4px;font-size:18px;font-weight:bold">${emailData.password}</code></p></div><p>⚠️ Recomendamos alterar sua senha após o primeiro acesso.</p><a href="https://dashboard-enxovalcompleto.lovable.app" class="button">Acessar Plataforma</a></div></body></html>`;
          break;

        case "trial":
          emailSubject = "🎁 Presente de Boas-Vindas - Trial Gratuito!";
          const trialProducts = emailData.trialProducts.map((p: any) => 
            `<div style="background:#e8f5e9;padding:20px;border-radius:8px;margin:16px 0;border-left:4px solid #4caf50"><p style="color:#1b5e20;font-size:18px;font-weight:bold;margin:0 0 12px">${p.product_title}</p><p style="color:#2e7d32;margin:8px 0">⏰ <strong>${p.trial_days} dias</strong> de acesso gratuito</p><p style="color:#666;font-size:14px;margin:8px 0 0;font-style:italic">Expira em: ${new Date(p.expires_at).toLocaleDateString('pt-BR')}</p></div>`
          ).join('');
          emailHtml = `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;background:#f6f9fc;margin:0;padding:40px}.container{max-width:600px;margin:0 auto;background:#fff;padding:40px;border-radius:8px}h1{color:#333;text-align:center}.button{display:inline-block;padding:14px 20px;background:#4caf50;color:#fff;text-decoration:none;border-radius:6px;margin:24px 0;font-weight:600}</style></head><body><div class="container"><h1>🎁 Presente de Boas-Vindas!</h1><p>Olá, <strong>${emailData.userName}</strong>!</p><p>Como presente de boas-vindas, você ganhou acesso gratuito:</p>${trialProducts}<a href="https://dashboard-enxovalcompleto.lovable.app/materiais" class="button">Acessar Materiais</a></div></body></html>`;
          break;

        case "promotion":
          emailSubject = `🎉 ${emailData.promotionName} - Acesso Especial Liberado!`;
          emailHtml = `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;background:#f6f9fc;margin:0;padding:40px}.container{max-width:600px;margin:0 auto;background:#fff;padding:40px;border-radius:8px}h1{color:#d32f2f;text-align:center;text-transform:uppercase}.promo{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px 24px;border-radius:12px;margin:32px 0;text-align:center;color:#fff}.button{display:inline-block;padding:16px 24px;background:#d32f2f;color:#fff;text-decoration:none;border-radius:6px;margin:32px 0;font-weight:bold;text-transform:uppercase}</style></head><body><div class="container"><h1>🎉 ${emailData.promotionName}</h1><p>Olá, <strong>${emailData.userName}</strong>!</p><p style="color:#d32f2f;font-size:18px;text-align:center;font-weight:600">Temos uma surpresa especial para você! 🎁</p><div class="promo"><p style="font-size:16px;margin:0 0 16px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Acesso Liberado:</p><p style="font-size:24px;font-weight:bold;margin:0 0 20px">${emailData.productTitle}</p><p style="font-size:18px;margin:16px 0;font-weight:600">⏰ ${emailData.durationDays} dias de acesso gratuito</p><p style="font-size:14px;margin:16px 0 0">Válido até: <strong>${new Date(emailData.expiresAt).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}</strong></p></div><a href="https://dashboard-enxovalcompleto.lovable.app/materiais" class="button">Acessar Agora</a></div></body></html>`;
          break;

        case "purchase":
          emailSubject = `✅ Compra Aprovada - ${emailData.productTitle}`;
          emailHtml = `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;background:#f6f9fc;margin:0;padding:40px}.container{max-width:600px;margin:0 auto;background:#fff;padding:40px;border-radius:8px}h1{color:#4caf50;text-align:center}.credentials{background:#f4f4f4;padding:24px;border-radius:8px;margin:24px 0;border:2px solid #4caf50}.button{display:inline-block;padding:14px 20px;background:#4caf50;color:#fff;text-decoration:none;border-radius:6px;margin:24px 0;font-weight:600}</style></head><body><div class="container"><h1>✅ Compra Aprovada!</h1><p>Olá, <strong>${emailData.userName}</strong>!</p><p style="background:#e8f5e9;padding:20px;border-radius:8px;text-align:center;color:#2e7d32">🎉 Sua compra do produto <strong>${emailData.productTitle}</strong> foi confirmada com sucesso!</p><div class="credentials"><p style="text-align:center;color:#2e7d32;font-weight:bold;margin:0 0 16px">Seus Dados de Acesso:</p><p><strong>📧 Email:</strong> ${emailData.email}</p><p><strong>🔑 Senha:</strong> <code style="background:#fff;padding:12px;border-radius:4px;font-size:18px;font-weight:bold">${emailData.password}</code></p>${emailData.expiresAt?`<p style="color:#d97706;text-align:center;font-style:italic">⏰ Acesso expira em: ${new Date(emailData.expiresAt).toLocaleDateString('pt-BR')}</p>`:'<p style="color:#2e7d32;text-align:center;font-weight:bold">♾️ Acesso vitalício!</p>'}</div><p style="background:#fef3c7;padding:16px;border-radius:6px;color:#d97706">⚠️ <strong>Importante:</strong> Recomendamos alterar sua senha após o primeiro acesso.</p><a href="https://dashboard-enxovalcompleto.lovable.app" class="button">Acessar Plataforma</a></div></body></html>`;
          break;
      }
    }

    if (!emailHtml) {
      return new Response(JSON.stringify({ error: "HTML do email não fornecido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Mãe Consciente <contato@infoprolab.com.br>",
        to: [to],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("❌ Erro ao enviar email via Resend:", responseData);
      return new Response(JSON.stringify({ error: responseData?.message || "Erro ao enviar email" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Email enviado com sucesso via Resend:", responseData);
    return new Response(JSON.stringify({ success: true, data: responseData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("💥 Erro geral:", error);
    return new Response(
      JSON.stringify({
        error: "Erro interno no envio de email",
        details: error.message || String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
