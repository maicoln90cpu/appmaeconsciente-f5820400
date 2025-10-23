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
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Rate limiting: 3 gerações de plano por dia
    const rateLimit = checkRateLimit(user.id, 'generate-meal-plan', {
      maxRequests: 3,
      windowMs: 24 * 60 * 60 * 1000, // 24 horas
    });

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Limite de gerações atingido',
          message: `Você atingiu o limite diário de geração de planos. Tente novamente em ${Math.ceil(rateLimit.retryAfter! / 3600)} horas.`
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

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    const mesesGestacao = profile.meses_gestacao || 1;
    const trimester = Math.ceil(mesesGestacao / 3);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Você é uma nutricionista especializada em gestação.
Crie um plano alimentar SEMANAL COMPLETO para uma gestante:

**Perfil:**
- Trimestre: ${trimester}° 
- Meses: ${mesesGestacao}
- Localização: ${profile.cidade || 'Brasil'}

**RETORNE JSON VÁLIDO:**
{
  "meal_plans": [
    {
      "day_of_week": 0,
      "meal_type": "cafe_da_manha",
      "title": "Café nutritivo",
      "description": "Descrição breve",
      "ingredients": ["ingrediente 1", "ingrediente 2"],
      "preparation": "Modo de preparo detalhado",
      "calories": 350,
      "proteins": 15.5,
      "carbs": 45.2,
      "fats": 12.3,
      "fiber": 8.5,
      "iron": 2.8,
      "calcium": 120,
      "folic_acid": 85,
      "tips": "Dica importante"
    }
  ]
}

**REGRAS:**
1. Crie 21 planos (7 dias x 3 refeições: cafe_da_manha, almoco, jantar)
2. Use day_of_week: 0-6 (0=domingo)
3. Nutrientes realistas para trimestre ${trimester}
4. Foco em ácido fólico, ferro e cálcio
5. Evite alimentos crus`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Return only valid JSON, no markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI generation failed');
    }

    const aiData = await aiResponse.json();
    let generatedContent = aiData.choices[0].message.content;
    generatedContent = generatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const nutritionPlan = JSON.parse(generatedContent);

    // Delete existing meal plans for this user/trimester
    await supabaseClient
      .from('meal_plans')
      .delete()
      .eq('created_by', user.id)
      .eq('trimester', trimester);

    const mealPlansToInsert = nutritionPlan.meal_plans.map((plan: any) => ({
      ...plan,
      trimester,
      created_by: user.id,
      is_ai_generated: true,
    }));

    const { error: mealPlansError } = await supabaseClient
      .from('meal_plans')
      .insert(mealPlansToInsert);

    if (mealPlansError) throw mealPlansError;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Plano alimentar gerado!',
        count: mealPlansToInsert.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});