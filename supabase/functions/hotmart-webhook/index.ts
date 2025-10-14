import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok',
};

interface HotmartWebhookData {
  id: string;
  event: string;
  version: string;
  data: {
    product: {
      id: number;
      name: string;
    };
    buyer: {
      email: string;
      name: string;
    };
    purchase: {
      transaction: string;
      status: string;
      approved_date?: number;
    };
    commission?: {
      value: number;
    };
  };
}

// Função para gerar senha aleatória segura
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: HotmartWebhookData = await req.json();
    
    console.log('=== Hotmart Webhook Recebido ===');
    console.log('Event:', payload.event);
    console.log('Status:', payload.data.purchase.status);
    console.log('Transaction:', payload.data.purchase.transaction);

    // Validar assinatura Hotmart
    const hottok = req.headers.get('x-hotmart-hottok');
    const expectedHottok = Deno.env.get('HOTMART_HOTTOK');
    
    if (expectedHottok && hottok !== expectedHottok) {
      console.error('Assinatura Hotmart inválida');
      return new Response(
        JSON.stringify({ error: 'Assinatura inválida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hotmartProductId = payload.data.product.id.toString();
    const buyerEmail = payload.data.buyer.email.toLowerCase();
    const buyerName = payload.data.buyer.name;
    const transactionId = payload.data.purchase.transaction;
    const event = payload.event;
    const status = payload.data.purchase.status.toLowerCase();

    console.log('Product ID Hotmart:', hotmartProductId);
    console.log('Comprador:', buyerEmail);

    // Webhook de teste
    if (hotmartProductId === '0') {
      console.log('⚠️ Webhook de TESTE detectado (Product ID: 0)');
      
      await supabase.from('hotmart_transactions').upsert({
        transaction_id: transactionId,
        hotmart_product_id: hotmartProductId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        status: 'test',
        amount: payload.data.commission?.value || 0,
        event_type: event,
      }, {
        onConflict: 'transaction_id',
        ignoreDuplicates: false
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Test webhook recebido', test: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar produto diretamente por hotmart_product_id
    console.log('Buscando produto por hotmart_product_id:', hotmartProductId);
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, access_duration_days, payment_url, title')
      .eq('hotmart_product_id', hotmartProductId)
      .maybeSingle();

    if (productError) {
      console.error('Erro ao buscar produto:', productError);
      
      await supabase.from('hotmart_transactions').upsert({
        transaction_id: transactionId,
        hotmart_product_id: hotmartProductId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        status: 'failed',
        amount: payload.data.commission?.value || 0,
        event_type: event,
      }, {
        onConflict: 'transaction_id',
        ignoreDuplicates: false
      });

      return new Response(
        JSON.stringify({ error: 'Erro ao buscar produto', details: productError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!product) {
      console.log('Produto não encontrado para hotmart_product_id:', hotmartProductId);
      
      await supabase.from('hotmart_transactions').upsert({
        transaction_id: transactionId,
        hotmart_product_id: hotmartProductId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        status: 'product_not_found',
        amount: payload.data.commission?.value || 0,
        event_type: event,
      }, {
        onConflict: 'transaction_id',
        ignoreDuplicates: false
      });

      return new Response(
        JSON.stringify({ 
          message: 'Produto não cadastrado no sistema', 
          hotmart_product_id: hotmartProductId 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productId = product.id;
    console.log('Produto encontrado:', productId, product.title);

    // Buscar ou criar usuário
    let userId: string | null = null;
    let randomPassword = '';
    
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', buyerEmail)
      .maybeSingle();

    if (existingProfile) {
      userId = existingProfile.id;
      console.log('Usuário existente encontrado:', userId);
    } else {
      console.log('Criando novo usuário:', buyerEmail);
      
      randomPassword = generateRandomPassword();
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: buyerEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          full_name: buyerName,
          created_by: 'hotmart_webhook'
        }
      });

      if (createError) {
        console.error('Erro ao criar usuário:', createError);
        
        await supabase.from('hotmart_transactions').upsert({
          transaction_id: transactionId,
          hotmart_product_id: hotmartProductId,
          buyer_email: buyerEmail,
          buyer_name: buyerName,
          status: 'user_creation_failed',
          amount: payload.data.commission?.value || 0,
          product_id: productId,
          event_type: event,
        }, {
          onConflict: 'transaction_id',
          ignoreDuplicates: false
        });

        return new Response(
          JSON.stringify({ error: 'Falha ao criar usuário' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.user.id;
      console.log('Usuário criado com sucesso:', userId);
      
      // Enviar email de boas-vindas via E-goi
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bem-vindo(a)!</h1>
            </div>
            <div class="content">
              <h2>Olá, ${buyerName}!</h2>
              <p>Sua compra do produto <strong>${product.title}</strong> foi confirmada com sucesso!</p>
              <p>Seu acesso já está liberado na plataforma. Use as credenciais abaixo para fazer login:</p>
              
              <div class="credentials">
                <p><strong>📧 Email:</strong> ${buyerEmail}</p>
                <p><strong>🔑 Senha:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px; font-size: 16px;">${randomPassword}</code></p>
              </div>
              
              <p>⚠️ <strong>Importante:</strong> Recomendamos que você altere sua senha após o primeiro acesso para maior segurança.</p>
              
              <p>Se você tiver qualquer dúvida, entre em contato com nosso suporte.</p>
              
              <div class="footer">
                <p>Este é um email automático. Por favor, não responda.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await supabase.functions.invoke('send-egoi-email', {
          body: {
            to: buyerEmail,
            subject: `Bem-vindo! Suas credenciais de acesso - ${product.title}`,
            html: emailHtml,
          }
        });
        
        if (emailResponse.error) {
          console.error('Erro ao enviar email:', emailResponse.error);
        } else {
          console.log('✅ Email de boas-vindas enviado para:', buyerEmail);
        }
      } catch (emailError) {
        console.error('Erro ao invocar função de email:', emailError);
      }
    }

    // Processar cancelamento/reembolso
    const isCancellation = event === 'PURCHASE_CANCELED';
    const isRefund = event === 'PURCHASE_REFUNDED' || event === 'PURCHASE_PROTEST';

    if (isCancellation || isRefund) {
      console.log('Processando cancelamento/reembolso');
      
      await supabase
        .from('user_product_access')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      await supabase.from('hotmart_transactions').upsert({
        transaction_id: transactionId,
        hotmart_product_id: hotmartProductId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        status: isCancellation ? 'canceled' : 'refunded',
        amount: payload.data.commission?.value || 0,
        user_id: userId,
        product_id: productId,
        event_type: event,
      }, {
        onConflict: 'transaction_id',
        ignoreDuplicates: false
      });
      
      return new Response(
        JSON.stringify({ success: true, message: 'Acesso revogado', userId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar compra aprovada
    const isApprovedPurchase = status === 'approved';
    const isPurchaseComplete = event === 'PURCHASE_COMPLETE';
    
    if (!isApprovedPurchase && !isPurchaseComplete) {
      console.log('Ignorando compra não aprovada:', { event, status });
      
      await supabase.from('hotmart_transactions').upsert({
        transaction_id: transactionId,
        hotmart_product_id: hotmartProductId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        status: 'pending',
        amount: payload.data.commission?.value || 0,
        user_id: userId,
        product_id: productId,
        event_type: event,
      }, {
        onConflict: 'transaction_id',
        ignoreDuplicates: false
      });

      return new Response(
        JSON.stringify({ message: 'Evento ignorado - não aprovado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processando compra aprovada');

    // Calcular data de expiração
    const durationDays = product.access_duration_days;
    let expiresAt = null;
    
    if (durationDays) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + durationDays);
      expiresAt = expirationDate.toISOString();
      console.log(`Acesso concedido por ${durationDays} dias, expira em:`, expiresAt);
    } else {
      console.log('Acesso vitalício concedido');
    }

    // Conceder acesso
    const { error: accessError } = await supabase
      .from('user_product_access')
      .upsert({
        user_id: userId,
        product_id: productId,
        expires_at: expiresAt
      }, {
        onConflict: 'user_id,product_id'
      });

    if (accessError) {
      console.error('Erro ao conceder acesso:', accessError);
      
      await supabase.from('hotmart_transactions').upsert({
        transaction_id: transactionId,
        hotmart_product_id: hotmartProductId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        status: 'access_grant_failed',
        amount: payload.data.commission?.value || 0,
        user_id: userId,
        product_id: productId,
        event_type: event,
      }, {
        onConflict: 'transaction_id',
        ignoreDuplicates: false
      });

      return new Response(
        JSON.stringify({ error: 'Falha ao conceder acesso' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Acesso concedido com sucesso para:', userId);

    // Registrar transação bem-sucedida
    await supabase.from('hotmart_transactions').upsert({
      transaction_id: transactionId,
      hotmart_product_id: hotmartProductId,
      buyer_email: buyerEmail,
      buyer_name: buyerName,
      status: 'processed',
      amount: payload.data.commission?.value || 0,
      user_id: userId,
      product_id: productId,
      event_type: event,
    }, {
      onConflict: 'transaction_id',
      ignoreDuplicates: false
    });

    console.log('✅ Transação registrada com SUCESSO');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Acesso concedido',
        userId,
        expiresAt,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro ao processar webhook Hotmart:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
