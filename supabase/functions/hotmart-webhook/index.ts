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
    
    console.log('=== WEBHOOK HOTMART INICIADO ===');
    console.log('Event:', payload.event);
    console.log('Payload completo:', JSON.stringify(payload, null, 2));
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

    console.log('Transaction ID:', transactionId);
    console.log('Hotmart Product ID:', hotmartProductId);
    console.log('Buyer Email:', buyerEmail);
    console.log('Status da compra:', status);

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

    // ✅ CORREÇÃO: Buscar mapeamento Hotmart primeiro
    console.log('🔍 Buscando mapeamento para hotmart_product_id:', hotmartProductId);
    
    const { data: mapping, error: mappingError } = await supabase
      .from('hotmart_product_mapping')
      .select('internal_product_id')
      .eq('hotmart_product_id', hotmartProductId)
      .maybeSingle();

    if (mappingError) {
      console.error('❌ Erro ao buscar mapeamento:', mappingError);
      
      await supabase.from('hotmart_transactions').upsert({
        transaction_id: transactionId,
        hotmart_product_id: hotmartProductId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        status: 'mapping_error',
        amount: payload.data.commission?.value || 0,
        event_type: event,
      }, {
        onConflict: 'transaction_id',
        ignoreDuplicates: false
      });

      return new Response(
        JSON.stringify({ error: 'Erro ao buscar mapeamento do produto', details: mappingError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!mapping) {
      console.error('❌ Mapeamento não encontrado para hotmart_product_id:', hotmartProductId);
      console.log('💡 Configure o mapeamento em: Admin Dashboard > Mapeamentos Hotmart');
      
      await supabase.from('hotmart_transactions').upsert({
        transaction_id: transactionId,
        hotmart_product_id: hotmartProductId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        status: 'mapping_not_found',
        amount: payload.data.commission?.value || 0,
        event_type: event,
      }, {
        onConflict: 'transaction_id',
        ignoreDuplicates: false
      });

      return new Response(
        JSON.stringify({ 
          error: 'Produto Hotmart não mapeado no sistema',
          hotmart_product_id: hotmartProductId,
          hint: 'Configure o mapeamento no Admin Dashboard'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const internalProductId = mapping.internal_product_id;
    console.log('✅ Mapeamento encontrado! Internal Product ID:', internalProductId);

    // Buscar produto interno
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, access_duration_days, payment_url, title')
      .eq('id', internalProductId)
      .maybeSingle();

    if (productError || !product) {
      console.error('❌ Erro ao buscar produto interno:', productError || 'Produto não existe');
      
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
        JSON.stringify({ error: 'Produto interno não encontrado', internal_product_id: internalProductId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productId = product.id;
    console.log('✅ Produto encontrado:', productId, '|', product.title);

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
      
      // Calcular expiresAt antes de enviar o email
      const durationDays = product.access_duration_days;
      let newUserExpiresAt = null;
      
      if (durationDays) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + durationDays);
        newUserExpiresAt = expirationDate.toISOString();
      }
      
      // Enviar email de boas-vindas com compra aprovada
      try {
        console.log('Tentando enviar email para:', buyerEmail);
        
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-resend-email', {
          body: {
            to: buyerEmail,
            template: "purchase",
            data: {
              userName: buyerName,
              email: buyerEmail,
              password: randomPassword,
              productTitle: product.title,
              expiresAt: newUserExpiresAt,
            },
          }
        });
        
        if (emailError) {
          console.error('ERRO ao invocar send-resend-email:', emailError);
        } else {
          console.log('✅ Email de boas-vindas enviado com sucesso!', emailData);
        }
      } catch (emailError) {
        console.error('EXCEÇÃO ao enviar email:', emailError);
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

    // Calcular data de expiração (reutilizando se já calculado para usuário novo)
    const durationDays = product.access_duration_days;
    let accessExpiresAt = null;
    
    if (durationDays) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + durationDays);
      accessExpiresAt = expirationDate.toISOString();
      console.log(`Acesso concedido por ${durationDays} dias, expira em:`, accessExpiresAt);
    } else {
      console.log('Acesso vitalício concedido');
    }

    // Conceder acesso
    const { error: accessError } = await supabase
      .from('user_product_access')
      .upsert({
        user_id: userId,
        product_id: productId,
        expires_at: accessExpiresAt
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
    console.log('Tentando inserir transação:', {
      transaction_id: transactionId,
      hotmart_product_id: hotmartProductId,
      buyer_email: buyerEmail,
      status: 'processed',
    });

    const { data: txData, error: txError } = await supabase
      .from('hotmart_transactions')
      .insert({
        transaction_id: transactionId,
        hotmart_product_id: hotmartProductId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        status: 'processed',
        amount: payload.data.commission?.value || 0,
        user_id: userId,
        product_id: productId,
        event_type: event,
      });

    if (txError) {
      // Se for erro de duplicata, só logar e continuar
      if (txError.code === '23505') {
        console.log('Transação duplicada ignorada:', transactionId);
      } else {
        console.error('Erro ao registrar transação:', txError);
      }
    } else {
      console.log('✅ Transação registrada com SUCESSO:', txData);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Acesso concedido',
        userId,
        expiresAt: accessExpiresAt,
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
