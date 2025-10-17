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

/**
 * Generate a cryptographically secure random password
 * @param length Password length (minimum 12 recommended)
 * @returns Random password string
 */
function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  const charsetLength = charset.length;
  
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charsetLength];
  }
  
  return password;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, full_name }: CreateUserRequest = await req.json();
    console.log("📝 Criando usuário:", email);

    if (!email) {
      return new Response(JSON.stringify({ error: "Email é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Conectar ao Supabase com service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gerar senha aleatória segura
    const password = generateSecurePassword(16);

    // Criar usuário
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || email,
      },
    });

    if (authError) {
      console.error("❌ Erro ao criar usuário:", authError);
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Usuário criado:", authData.user.id);

    // Enviar email de boas-vindas
    try {
      const { data: emailData, error: emailError } = await supabase.functions.invoke("send-resend-email", {
        body: {
          to: email,
          template: "welcome",
          data: {
            userName: full_name || email.split("@")[0],
            email: email,
            password: password,
          },
        },
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
        message: "Usuário criado com sucesso",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("🔥 Erro não tratado:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
