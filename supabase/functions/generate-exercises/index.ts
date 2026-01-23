import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limiter.ts";
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

  // Rate limiting: 1 geração por semana
  const rateLimit = checkRateLimit(user.id, 'generate-exercises', {
    maxRequests: 1,
    windowMs: 7 * 24 * 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return createErrorResponse('RATE_LIMITED', req, 
      `Você já gerou exercícios esta semana. Tente novamente em ${Math.ceil(rateLimit.retryAfter! / 86400)} dias.`
    );
  }

  logEvent('info', 'generate-exercises-start', { userId: user.id });

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return createErrorResponse('NOT_FOUND', req, 'Profile not found');
  }

  const trimester = Math.min(Math.ceil((profile.meses_gestacao || 1) / 3), 3);

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return createErrorResponse('CONFIG_ERROR', req, 'LOVABLE_API_KEY not configured');
  }

  const prompt = `Crie 10 exercícios seguros personalizados para gestante no ${trimester}° trimestre:

**Perfil da Gestante:**
- Peso: ${profile.peso_atual || 'não informado'} kg
- Altura: ${profile.altura_cm || 'não informado'} cm
- Sexo: ${profile.sexo || 'feminino'}
- Trimestre: ${trimester}º

Ajuste intensidade e duração baseadas nesses dados.

{
  "exercises": [
    {
      "title": "Nome do exercício",
      "description": "Descrição breve",
      "category": "cardio",
      "exercise_type": "em_casa",
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
Tipos (OBRIGATÓRIO): em_casa, aerobio, academia, yoga, alongamento (distribua entre TODOS os tipos).
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

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    logEvent('error', 'ai-generation-failed', { status: aiResponse.status, error: errorText });
    return createErrorResponse('AI_ERROR', req, 'AI generation failed');
  }

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

  if (error) {
    logEvent('error', 'insert-failed', { error: error.message });
    return createErrorResponse('DATABASE_ERROR', req, error.message);
  }

  logEvent('info', 'exercises-generated', { count: exercisesToInsert.length });

  return createSuccessResponse({ 
    success: true, 
    count: exercisesToInsert.length 
  }, req);
}));
