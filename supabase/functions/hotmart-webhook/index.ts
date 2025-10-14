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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse webhook data
    const payload: HotmartWebhookData = await req.json();
    
    console.log('Hotmart webhook received:', {
      event: payload.event,
      transaction: payload.data.purchase.transaction,
      status: payload.data.purchase.status,
    });

    // Validate Hotmart signature (HOTTOK)
    const hottok = req.headers.get('x-hotmart-hottok');
    const expectedHottok = Deno.env.get('HOTMART_HOTTOK');
    
    if (expectedHottok && hottok !== expectedHottok) {
      console.error('Invalid Hotmart signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('=== Hotmart Webhook Processing ===');
    console.log('Event:', payload.event);
    console.log('Status:', payload.data.purchase.status);
    console.log('Transaction:', payload.data.purchase.transaction);
    
    const hotmartProductId = payload.data.product.id.toString();
    const buyerEmail = payload.data.buyer.email.toLowerCase();
    const buyerName = payload.data.buyer.name;
    const transactionId = payload.data.purchase.transaction;
    const event = payload.event;
    const status = payload.data.purchase.status.toLowerCase();

    console.log('Product ID:', hotmartProductId);
    console.log('Buyer:', buyerEmail);

    // ⚠️ OPÇÃO 3: Se for ID 0 (webhook de teste da Hotmart), registrar mas não processar
    if (hotmartProductId === '0') {
      console.log('⚠️ Webhook de TESTE da Hotmart detectado (Product ID: 0)');
      
      await supabase.from('hotmart_transactions').insert({
        transaction_id: transactionId,
        hotmart_product_id: hotmartProductId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        status: 'test',
        amount: payload.data.commission?.value || 0,
        event_type: event,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Test webhook received and logged',
          test: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find internal product mapping
    const { data: mapping, error: mappingError } = await supabase
      .from('hotmart_product_mapping')
      .select('internal_product_id')
      .eq('hotmart_product_id', hotmartProductId)
      .maybeSingle();

    if (mappingError || !mapping) {
      console.error('Product mapping not found:', hotmartProductId);
      
      // Log transaction even if mapping doesn't exist
      await supabase.from('hotmart_transactions').insert({
        transaction_id: transactionId,
        hotmart_product_id: hotmartProductId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        status: 'mapping_not_found',
        amount: payload.data.commission?.value || 0,
        event_type: event,
      });

      return new Response(
        JSON.stringify({ error: 'Product mapping not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find or create user by email
    let userId: string | null = null;
    
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', buyerEmail)
      .maybeSingle();

    if (existingProfile) {
      userId = existingProfile.id;
      console.log('User found:', userId);
    } else {
      console.log('Creating new user account:', buyerEmail);
      
      // Create user via Admin API
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: buyerEmail,
        email_confirm: true, // Confirm email automatically
        user_metadata: {
          full_name: buyerName,
          created_by: 'hotmart_webhook'
        }
      });

      if (createError) {
        console.error('Error creating user:', createError);
        
        // Log transaction as pending
        await supabase.from('hotmart_transactions').insert({
          transaction_id: transactionId,
          hotmart_product_id: hotmartProductId,
          buyer_email: buyerEmail,
          buyer_name: buyerName,
          status: 'user_creation_failed',
          amount: payload.data.commission?.value || 0,
          product_id: mapping.internal_product_id,
          event_type: event,
        });

        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        userId = newUser.user.id;
        console.log('User created successfully:', userId);
      }
    }

    // Check if this is a cancellation or refund
    const isCancellation = event === 'PURCHASE_CANCELED';
    const isRefund = event === 'PURCHASE_REFUNDED' || event === 'PURCHASE_PROTEST';

    if (isCancellation || isRefund) {
      console.log('Processing cancellation/refund');
      
      // Remove access from user
      const { error: revokeError } = await supabase
        .from('user_product_access')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', mapping.internal_product_id);

      if (revokeError) {
        console.error('Error revoking access:', revokeError);
      } else {
        console.log('Access revoked for user:', userId);
      }
      
      // Log transaction
      await supabase.from('hotmart_transactions').insert({
        transaction_id: transactionId,
        hotmart_product_id: hotmartProductId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        status: isCancellation ? 'canceled' : 'refunded',
        amount: payload.data.commission?.value || 0,
        user_id: userId,
        product_id: mapping.internal_product_id,
        event_type: event,
      });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Access revoked',
          userId,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process approved purchase
    const isApprovedPurchase = status === 'approved';
    const isPurchaseComplete = event === 'PURCHASE_COMPLETE';
    
    if (!isApprovedPurchase && !isPurchaseComplete) {
      console.log('Skipping non-approved purchase:', {
        event: event,
        status: status
      });
      
      // Log transaction but don't grant access
      await supabase.from('hotmart_transactions').insert({
        transaction_id: transactionId,
        hotmart_product_id: hotmartProductId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        status: 'pending',
        amount: payload.data.commission?.value || 0,
        user_id: userId,
        product_id: mapping.internal_product_id,
        event_type: event,
      });

      return new Response(
        JSON.stringify({ message: 'Event ignored - not approved' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing approved purchase');

    // Get product details including access duration
    const { data: product } = await supabase
      .from('products')
      .select('access_duration_days')
      .eq('id', mapping.internal_product_id)
      .single();

    // Calculate expiration date
    let expiresAt = null;
    if (product?.access_duration_days) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + product.access_duration_days);
      expiresAt = expirationDate.toISOString();
      console.log('Access will expire at:', expiresAt);
    } else {
      console.log('Lifetime access granted');
    }

    // Grant product access with expiration
    const { error: accessError } = await supabase
      .from('user_product_access')
      .upsert({
        user_id: userId,
        product_id: mapping.internal_product_id,
        expires_at: expiresAt
      }, {
        onConflict: 'user_id,product_id'
      });

    if (accessError) {
      console.error('Error granting access:', accessError);
      
      // Log transaction as failed
      await supabase.from('hotmart_transactions').insert({
        transaction_id: transactionId,
        hotmart_product_id: hotmartProductId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        status: 'access_grant_failed',
        amount: payload.data.commission?.value || 0,
        user_id: userId,
        product_id: mapping.internal_product_id,
        event_type: event,
      });

      return new Response(
        JSON.stringify({ error: 'Failed to grant access' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Access granted successfully to user:', userId);

    // Log successful transaction
    await supabase.from('hotmart_transactions').insert({
      transaction_id: transactionId,
      hotmart_product_id: hotmartProductId,
      buyer_email: buyerEmail,
      buyer_name: buyerName,
      status: 'processed',
      amount: payload.data.commission?.value || 0,
      user_id: userId,
      product_id: mapping.internal_product_id,
      event_type: event,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Access granted',
        userId,
        expiresAt,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing Hotmart webhook:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
