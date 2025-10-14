import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  full_name?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, full_name }: CreateUserRequest = await req.json();
    console.log("📝 Criando usuário:", email);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Conectar ao Supabase com service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gerar senha aleatória
    const password = crypto.randomUUID();

    // Criar usuário
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || email,
      }
    });

    if (authError) {
      console.error("❌ Erro ao criar usuário:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Usuário criado:", authData.user.id);

    // Enviar email com a senha via E-goi
    try {
      const emailHtml = `
        <h1>Bem-vindo(a) à Mãe Consciente!</h1>
        <p>Sua conta foi criada com sucesso.</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Senha temporária:</strong> ${password}</p>
        <p>Por favor, faça login e altere sua senha nas configurações.</p>
        <p>Acesse: <a href="https://maeconsciente.infoprolab.com.br">https://maeconsciente.infoprolab.com.br</a></p>
      `;

      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-egoi-email', {
        body: {
          to: email,
          subject: "Bem-vindo(a) à Mãe Consciente - Dados de Acesso",
          html: emailHtml,
        }
      });

      if (emailError) {
        console.error("⚠️ Erro ao enviar email:", emailError);
        // Não falhar a criação do usuário se o email não for enviado
      } else {
        console.log("📧 Email de boas-vindas enviado com sucesso");
      }
    } catch (emailErr) {
      console.error("⚠️ Erro ao enviar email de boas-vindas:", emailErr);
      // Não falhar a criação do usuário se o email não for enviado
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user,
        message: "Usuário criado com sucesso"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("🔥 Erro não tratado:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
