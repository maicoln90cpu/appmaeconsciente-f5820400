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

    // Only process approved purchases or PURCHASE_COMPLETE events
    const isApprovedPurchase = payload.data.purchase.status === 'approved';
    const isPurchaseComplete = payload.event === 'PURCHASE_COMPLETE';
    
    if (!isApprovedPurchase && !isPurchaseComplete) {
      console.log('Skipping non-approved purchase:', {
        event: payload.event,
        status: payload.data.purchase.status
      });
      return new Response(
        JSON.stringify({ message: 'Event ignored - not approved' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing approved purchase');

    const hotmartProductId = payload.data.product.id.toString();
    const buyerEmail = payload.data.buyer.email.toLowerCase();
    const buyerName = payload.data.buyer.name;
    const transactionId = payload.data.purchase.transaction;

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
    } else {
      // Create placeholder profile for user to claim later
      console.log('User not found, will need to create account:', buyerEmail);
    }

    // Grant product access
    if (userId) {
      const { error: accessError } = await supabase
        .from('user_product_access')
        .upsert({
          user_id: userId,
          product_id: mapping.internal_product_id,
        }, {
          onConflict: 'user_id,product_id'
        });

      if (accessError) {
        console.error('Error granting access:', accessError);
      } else {
        console.log('Access granted successfully to user:', userId);
      }
    }

    // Log transaction
    await supabase.from('hotmart_transactions').insert({
      transaction_id: transactionId,
      hotmart_product_id: hotmartProductId,
      buyer_email: buyerEmail,
      buyer_name: buyerName,
      status: userId ? 'processed' : 'pending_account',
      amount: payload.data.commission?.value || 0,
      user_id: userId,
      product_id: mapping.internal_product_id,
    });

    // TODO: Send welcome email
    // if (userId) {
    //   await supabase.functions.invoke('send-welcome-email', {
    //     body: { userId, productId: mapping.internal_product_id }
    //   });
    // }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: userId ? 'Access granted' : 'Transaction logged - awaiting user registration',
        userId,
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
