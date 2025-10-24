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

    // Rate limiting: 1 geração por semana
    const rateLimit = checkRateLimit(user.id, 'generate-recipes', {
      maxRequests: 1,
      windowMs: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Limite de gerações atingido',
          message: `Você já gerou receitas esta semana. Tente novamente em ${Math.ceil(rateLimit.retryAfter! / 86400)} dias.`
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

    const trimester = Math.min(Math.ceil((profile.meses_gestacao || 1) / 3), 3);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const prompt = `Crie 12 receitas saudáveis personalizadas para gestante no ${trimester}° trimestre:

**Perfil da Gestante:**
- Peso: ${profile.peso_atual || 'não informado'} kg
- Altura: ${profile.altura_cm || 'não informado'} cm
- Sexo: ${profile.sexo || 'feminino'}
- Trimestre: ${trimester}º

Ajuste as porções e valores nutricionais baseados nesses dados.

{
  "recipes": [
    {
      "title": "Nome da receita",
      "description": "Descrição breve",
      "category": "cafe_manha",
      "ingredients": ["item 1", "item 2"],
      "preparation": ["passo 1", "passo 2"],
      "calories": 280,
      "nutrients": {
        "proteins": 15.5,
        "carbs": 35.2,
        "fats": 8.3,
        "calcium": 200,
        "iron": 5,
        "folic_acid": 100,
        "fiber": 6
      },
      "prep_time": 15,
      "servings": 2,
      "trimester_focus": [${trimester}],
      "tags": ["rápido", "nutritivo"],
      "tips": "Dica útil"
    }
  ]
}

Categorias: cafe_manha, almoco, jantar, lanche, sobremesa.
Foco: ferro, cálcio, ácido fólico. Inclua valores nutricionais realistas dentro do objeto 'nutrients'.`;

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

    // Delete existing AI recipes
    await supabaseClient
      .from('recipes')
      .delete()
      .eq('created_by', user.id)
      .eq('is_ai_generated', true);

    const recipesToInsert = data.recipes.map((recipe: any) => ({
      ...recipe,
      created_by: user.id,
      is_ai_generated: true,
      is_public: false,
    }));

    const { error } = await supabaseClient
      .from('recipes')
      .insert(recipesToInsert);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, count: recipesToInsert.length }),
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