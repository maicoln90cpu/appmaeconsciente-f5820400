import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResendCredentialsRequest {
  buyer_email: string;
  buyer_name: string;
  product_id: string;
  transaction_id?: string;
  force_new_password?: boolean;
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se é admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roles) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado - apenas admins' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ResendCredentialsRequest = await req.json();
    const { buyer_email, buyer_name, product_id, transaction_id, force_new_password } = body;

    console.log('=== REENVIO MANUAL DE CREDENCIAIS ===');
    console.log('Email:', buyer_email);
    console.log('Produto:', product_id);
    console.log('Admin:', user.email);

    // Buscar produto
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title, access_duration_days')
      .eq('id', product_id)
      .maybeSingle();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: 'Produto não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar ou criar usuário
    let userId: string;
    let userPassword = '';
    let isNewUser = false;

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', buyer_email.toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      userId = existingProfile.id;
      console.log('✅ Usuário existente:', userId);

      // Se forçar nova senha, atualizar
      if (force_new_password) {
        userPassword = generateSecurePassword(16);
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: userPassword }
        );

        if (updateError) {
          console.error('Erro ao atualizar senha:', updateError);
          return new Response(
            JSON.stringify({ error: 'Erro ao atualizar senha' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log('✅ Nova senha gerada');
      } else {
        // Usuário já existe, não enviamos senha
        userPassword = '(senha existente - não alterada)';
      }
    } else {
      console.log('Criando novo usuário:', buyer_email);
      isNewUser = true;
      userPassword = generateSecurePassword(16);

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: buyer_email.toLowerCase(),
        password: userPassword,
        email_confirm: true,
        user_metadata: {
          full_name: buyer_name,
          created_by: 'manual_admin_resend'
        }
      });

      if (createError) {
        console.error('Erro ao criar usuário:', createError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar usuário', details: createError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.user.id;
      console.log('✅ Usuário criado:', userId);
    }

    // Calcular data de expiração
    let expiresAt = null;
    if (product.access_duration_days) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + product.access_duration_days);
      expiresAt = expirationDate.toISOString();
      console.log(`Acesso por ${product.access_duration_days} dias, expira:`, expiresAt);
    } else {
      console.log('Acesso vitalício');
    }

    // Conceder acesso ao produto
    const { error: accessError } = await supabase
      .from('user_product_access')
      .upsert({
        user_id: userId,
        product_id: product_id,
        expires_at: expiresAt
      }, {
        onConflict: 'user_id,product_id'
      });

    if (accessError) {
      console.error('Erro ao conceder acesso:', accessError);
      return new Response(
        JSON.stringify({ error: 'Erro ao conceder acesso' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Acesso concedido');

    // Enviar email
    try {
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-resend-email', {
        body: {
          to: buyer_email,
          template: "purchase",
          data: {
            userName: buyer_name,
            email: buyer_email,
            password: userPassword,
            productTitle: product.title,
            expiresAt: expiresAt,
          },
        }
      });

      if (emailError) {
        console.error('Erro ao enviar email:', emailError);
        return new Response(
          JSON.stringify({ 
            success: true, 
            warning: 'Acesso concedido mas falha no envio do email',
            userId,
            emailError: emailError.message
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Email enviado com sucesso');
    } catch (emailError) {
      console.error('Exceção ao enviar email:', emailError);
    }

    // Registrar ação no log (opcional - pode adicionar tabela de audit log)
    if (transaction_id) {
      await supabase.from('hotmart_transactions').upsert({
        transaction_id: transaction_id,
        hotmart_product_id: 'MANUAL_RESEND',
        buyer_email: buyer_email,
        buyer_name: buyer_name,
        status: 'manually_processed',
        user_id: userId,
        product_id: product_id,
        event_type: 'MANUAL_ADMIN_RESEND',
      }, {
        onConflict: 'transaction_id',
        ignoreDuplicates: false
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Credenciais enviadas com sucesso',
        userId,
        isNewUser,
        passwordGenerated: isNewUser || force_new_password,
        expiresAt
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro ao reenviar credenciais:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
