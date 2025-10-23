import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    // Rate limiting: 3 gerações de exercícios por dia
    const rateLimit = checkRateLimit(user.id, 'generate-exercises', {
      maxRequests: 3,
      windowMs: 24 * 60 * 60 * 1000, // 24 horas
    });

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Limite de gerações atingido',
          message: `Você atingiu o limite diário de geração de exercícios. Tente novamente em ${Math.ceil(rateLimit.retryAfter! / 3600)} horas.`
        }),
        {
          headers: { 
            ...corsHeaders, 
            ...getRateLimitHeaders(rateLimit.retryAfter),
            'Content-Type': 'application/json' 
          },
          status: 429,
        }
      );
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const trimester = Math.ceil((profile.meses_gestacao || 1) / 3);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const prompt = `Crie 8 exercícios seguros para gestante no ${trimester}° trimestre:

{
  "exercises": [
    {
      "title": "Nome do exercício",
      "description": "Descrição breve",
      "category": "cardio",
      "duration_minutes": 20,
      "intensity": "leve",
      "trimester": [${trimester}],
      "benefits": ["benefício 1", "benefício 2"],
      "instructions": ["passo 1", "passo 2"],
      "precautions": ["cuidado 1", "cuidado 2"]
    }
  ]
}

Categorias: cardio, forca, flexibilidade, respiracao, relaxamento.
Intensidades: leve, moderado.
Foco: segurança e bem-estar.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) throw new Error('AI failed');

    const aiData = await aiResponse.json();
    let content = aiData.choices[0].message.content;
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const data = JSON.parse(content);

    // Delete existing AI exercises
    await supabaseClient
      .from('exercises')
      .delete()
      .eq('created_by', user.id)
      .eq('is_ai_generated', true);

    const exercisesToInsert = data.exercises.map((exercise: any) => ({
      ...exercise,
      created_by: user.id,
      is_ai_generated: true,
    }));

    const { error } = await supabaseClient
      .from('exercises')
      .insert(exercisesToInsert);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, count: exercisesToInsert.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});