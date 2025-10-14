import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateRandomPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar se usuário é admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se é admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!userRole) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { email, full_name } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Gerar senha aleatória
    const randomPassword = generateRandomPassword();

    // Criar usuário
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || '',
        created_by: 'admin_manual'
      }
    });

    if (createError) {
      console.error('Erro ao criar usuário:', createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Enviar email com credenciais
    const emailHtml = `
      <h2>Bem-vindo(a)${full_name ? ', ' + full_name : ''}!</h2>
      <p>Uma conta foi criada para você em nossa plataforma.</p>
      <h3>Suas credenciais de acesso:</h3>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Senha:</strong> ${randomPassword}</p>
      <p>Você pode alterar sua senha após o primeiro login nas configurações do perfil.</p>
      <p>Acesse a plataforma e comece a explorar!</p>
    `;

    try {
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-egoi-email', {
        body: {
          to: email,
          subject: 'Bem-vindo! Suas credenciais de acesso',
          html: emailHtml,
        }
      });

      if (emailError) {
        console.error('Erro ao enviar email:', emailError);
      } else {
        console.log('Email de boas-vindas enviado para:', email);
      }
    } catch (emailError) {
      console.error('Exceção ao enviar email:', emailError);
      // Não falhar a criação se o email falhar
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { id: newUser.user.id, email: newUser.user.email } 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});