import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html }: EmailRequest = await req.json();
    
    console.log('Enviando email via E-goi para:', to);
    
    const egoiApiKey = Deno.env.get('EGOI_API_KEY');
    const senderEmail = Deno.env.get('EGOI_SENDER_EMAIL') || 'noreply@example.com';
    const senderName = Deno.env.get('EGOI_SENDER_NAME') || 'Sistema';

    if (!egoiApiKey) {
      throw new Error('EGOI_API_KEY não configurada');
    }

    const response = await fetch('https://api.egoiapp.com/emails/transactional', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Apikey': egoiApiKey,
      },
      body: JSON.stringify({
        subject,
        html_body: html,
        to: [to],
        from: {
          email: senderEmail,
          name: senderName,
        },
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Erro E-goi:', result);
      throw new Error(`E-goi API error: ${JSON.stringify(result)}`);
    }

    console.log('Email enviado com sucesso via E-goi para:', to);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro ao enviar email via E-goi:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
