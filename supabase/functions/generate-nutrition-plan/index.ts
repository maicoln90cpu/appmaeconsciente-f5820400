import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

import { handleCorsOptions } from "../_shared/cors.ts";
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  logEvent,
} from "../_shared/error-handler.ts";

serve(withErrorHandling(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return createErrorResponse('UNAUTHORIZED', req);
  }

  const token = authHeader.replace('Bearer ', '');
  
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
  
  if (authError || !user) {
    return createErrorResponse('UNAUTHORIZED', req);
  }

  logEvent('info', 'generate-nutrition-plan-start', { userId: user.id });

  // Get user profile
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return createErrorResponse('NOT_FOUND', req, 'Profile not found');
  }

  // Calculate trimester
  const mesesGestacao = profile.meses_gestacao || 1;
  const trimester = Math.ceil(mesesGestacao / 3);

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return createErrorResponse('CONFIG_ERROR', req, 'LOVABLE_API_KEY not configured');
  }

  const prompt = `Você é uma nutricionista especializada em gestação.
Crie um plano alimentar COMPLETO e PERSONALIZADO para uma gestante com os seguintes dados:

**Perfil da Gestante:**
- Trimestre: ${trimester}° trimestre
- Meses de gestação: ${mesesGestacao} meses
- Localização: ${profile.cidade || 'Brasil'}, ${profile.estado || 'Brasil'}
- Possui outros filhos: ${profile.possui_filhos ? 'Sim' : 'Não'}
${profile.idades_filhos?.length ? `- Idades dos filhos: ${profile.idades_filhos.join(', ')} anos` : ''}

**IMPORTANTE:** Retorne um JSON válido com a estrutura EXATA abaixo. Use valores numéricos realistas para nutrientes.

{
  "meal_plans": [
    {
      "day_of_week": 0,
      "meal_type": "breakfast",
      "title": "Café da manhã energético",
      "description": "Pão integral com abacate e ovo",
      "ingredients": ["2 fatias de pão integral", "1/2 abacate", "1 ovo cozido", "1 copo de suco de laranja"],
      "preparation": "Torre o pão, amasse o abacate, adicione o ovo fatiado por cima.",
      "calories": 350,
      "proteins": 15.5,
      "carbs": 45.2,
      "fats": 12.3,
      "fiber": 8.5,
      "iron": 2.8,
      "calcium": 120,
      "folic_acid": 85,
      "tips": "O abacate fornece gorduras boas essenciais para o desenvolvimento do bebê."
    }
  ],
  "recipes": [
    {
      "title": "Smoothie de frutas vermelhas",
      "description": "Rico em antioxidantes e vitaminas",
      "category": "Bebidas",
      "ingredients": ["1 xícara de morangos", "1/2 xícara de mirtilo", "1 banana", "200ml de leite"],
      "preparation": ["Lave bem as frutas", "Bata todos os ingredientes no liquidificador", "Sirva gelado"],
      "calories": 280,
      "prep_time": 5,
      "servings": 1,
      "trimester_focus": [${trimester}],
      "tags": ["rápido", "nutritivo", "antioxidante"],
      "tips": "Consuma pela manhã para mais energia."
    }
  ],
  "exercises": [
    {
      "title": "Caminhada leve",
      "description": "Exercício cardiovascular de baixo impacto",
      "category": "Cardio",
      "duration_minutes": 30,
      "intensity": "leve",
      "trimester": [${trimester}],
      "benefits": ["Melhora circulação", "Reduz inchaço", "Aumenta energia"],
      "instructions": ["Escolha calçado confortável", "Mantenha ritmo constante", "Hidrate-se bem"],
      "precautions": ["Evite horários muito quentes", "Pare se sentir dor"]
    }
  ],
  "shopping_list": [
    "Pão integral",
    "Abacate",
    "Ovos",
    "Laranjas",
    "Morangos",
    "Mirtilo",
    "Bananas",
    "Leite"
  ]
}

**REGRAS IMPORTANTES:**
1. Crie 21 planos alimentares (7 dias x 3 refeições principais)
2. Crie 12 receitas variadas adaptadas ao trimestre
3. Crie 6 exercícios seguros para o trimestre atual
4. A lista de compras deve incluir TODOS os ingredientes usados
5. Use meal_type: "breakfast", "lunch", "dinner", "morning_snack", "afternoon_snack", "supper"
6. Para day_of_week use 0-6 (0=domingo)
7. Adapte as porções e nutrientes ao trimestre (${trimester}° trimestre precisa de mais calorias)
8. Inclua alimentos ricos em ácido fólico, ferro e cálcio
9. Evite alimentos crus/mal cozidos`;

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a specialized pregnancy nutritionist. Return only valid JSON, no markdown formatting.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    logEvent('error', 'ai-generation-failed', { status: aiResponse.status, error: errorText });
    return createErrorResponse('AI_ERROR', req, errorText);
  }

  const aiData = await aiResponse.json();
  let generatedContent = aiData.choices[0].message.content;

  // Clean markdown formatting if present
  generatedContent = generatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const nutritionPlan = JSON.parse(generatedContent);

  // Insert meal plans
  const mealPlansToInsert = nutritionPlan.meal_plans.map((plan: any) => ({
    ...plan,
    trimester,
    created_by: user.id,
    is_ai_generated: true,
  }));

  const { error: mealPlansError } = await supabaseClient
    .from('meal_plans')
    .insert(mealPlansToInsert);

  if (mealPlansError) {
    logEvent('error', 'meal-plans-insert-failed', { error: mealPlansError.message });
    return createErrorResponse('DATABASE_ERROR', req, mealPlansError.message);
  }

  // Insert recipes
  const recipesToInsert = nutritionPlan.recipes.map((recipe: any) => ({
    ...recipe,
    created_by: user.id,
    is_ai_generated: true,
    is_public: false,
  }));

  const { error: recipesError } = await supabaseClient
    .from('recipes')
    .insert(recipesToInsert);

  if (recipesError) {
    logEvent('error', 'recipes-insert-failed', { error: recipesError.message });
    return createErrorResponse('DATABASE_ERROR', req, recipesError.message);
  }

  // Insert exercises
  const exercisesToInsert = nutritionPlan.exercises.map((exercise: any) => ({
    ...exercise,
    created_by: user.id,
    is_ai_generated: true,
  }));

  const { error: exercisesError } = await supabaseClient
    .from('exercises')
    .insert(exercisesToInsert);

  if (exercisesError) {
    logEvent('error', 'exercises-insert-failed', { error: exercisesError.message });
    return createErrorResponse('DATABASE_ERROR', req, exercisesError.message);
  }

  logEvent('info', 'nutrition-plan-generated', {
    meal_plans: mealPlansToInsert.length,
    recipes: recipesToInsert.length,
    exercises: exercisesToInsert.length,
  });

  return createSuccessResponse({
    success: true,
    message: 'Plano nutricional gerado com sucesso!',
    data: {
      meal_plans_count: mealPlansToInsert.length,
      recipes_count: recipesToInsert.length,
      exercises_count: exercisesToInsert.length,
      shopping_list: nutritionPlan.shopping_list,
    },
  }, req);
}));
