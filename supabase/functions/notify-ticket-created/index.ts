import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId } = await req.json();
    
    console.log(`New ticket created: ${ticketId}`);
    
    // TODO: Integrate with Resend to send email notification
    // You'll need to:
    // 1. Sign up at https://resend.com
    // 2. Validate your domain at https://resend.com/domains  
    // 3. Create an API key at https://resend.com/api-keys
    // 4. Add RESEND_API_KEY as a secret
    
    // Example Resend integration (uncomment when ready):
    /*
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const resend = new Resend(RESEND_API_KEY);
    
    await resend.emails.send({
      from: 'Maternidade Consciente <suporte@seudominio.com>',
      to: ['seu-email@exemplo.com'],
      subject: 'Novo Ticket de Suporte Criado',
      html: `
        <h2>Novo Ticket de Suporte</h2>
        <p>Um novo ticket foi criado no sistema.</p>
        <p>ID do Ticket: ${ticketId}</p>
      `
    });
    */
    
    return new Response(
      JSON.stringify({ success: true, message: 'Ticket created' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Error in notify-ticket-created:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
