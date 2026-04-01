import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SENSITIVE_CATEGORIES = [
  'luto_perda',
  'emergencia_medica', 
  'violencia_domestica',
  'ideacao_suicida',
  'abuso',
  'conteudo_ofensivo',
  'spam_propaganda',
  'desinformacao_medica',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const lovableKey = Deno.env.get('LOVABLE_API_KEY') ?? '';

    const supabaseClient = createClient(supabaseUrl, serviceKey);

    const { postId, postContent, mode = 'moderate' } = await req.json();

    if (!postContent) {
      return new Response(
        JSON.stringify({ error: 'postContent is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- SENTIMENT ANALYSIS ---
    const analysisPrompt = `Analise o seguinte post de uma comunidade de mães e gestantes brasileiras.

Post: "${postContent}"

Avalie:
1. **Sentimento** (0.0 a 1.0): 0 = muito negativo/sensível, 0.5 = neutro, 1.0 = muito positivo
2. **Categorias sensíveis** detectadas (lista vazia se nenhuma):
   - luto_perda: menção a perda gestacional, óbito fetal, morte de bebê
   - emergencia_medica: sintomas graves, sangramento, emergência
   - violencia_domestica: menção a violência, abuso por parceiro
   - ideacao_suicida: pensamentos suicidas, vontade de desistir da vida
   - abuso: menção a abuso infantil ou de qualquer tipo
   - conteudo_ofensivo: linguagem ofensiva, ataques pessoais, bullying
   - spam_propaganda: propaganda, links suspeitos, venda de produtos
   - desinformacao_medica: informações médicas perigosamente incorretas
3. **Ação recomendada**: "approve" (publicar normal), "flag" (marcar para revisão humana), "hide" (ocultar automaticamente)
4. **Motivo** em português: breve explicação da decisão

REGRAS:
- Posts sobre dificuldades normais da maternidade (cansaço, cólica, amamentação) NÃO são sensíveis
- Desabafos emocionais normais NÃO devem ser flagged
- Apenas situações REALMENTE graves devem ser hidden
- Na dúvida, "approve" — preferimos falsos negativos a falsos positivos`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um moderador de conteúdo especializado em comunidades de maternidade. Responda APENAS em JSON válido.' },
          { role: 'user', content: analysisPrompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
        tools: [{
          type: 'function',
          function: {
            name: 'moderate_post',
            description: 'Analyze and moderate a community post',
            parameters: {
              type: 'object',
              properties: {
                sentiment_score: { type: 'number', description: 'Sentiment score 0.0 to 1.0' },
                flagged_categories: { type: 'array', items: { type: 'string' }, description: 'List of detected sensitive categories' },
                action: { type: 'string', enum: ['approve', 'flag', 'hide'], description: 'Recommended moderation action' },
                reason: { type: 'string', description: 'Brief explanation in Portuguese' },
                is_sensitive_for_bots: { type: 'boolean', description: 'Whether bots should avoid interacting with this post' },
              },
              required: ['sentiment_score', 'flagged_categories', 'action', 'reason', 'is_sensitive_for_bots'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'moderate_post' } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      // Default to approve on AI failure
      return new Response(
        JSON.stringify({ 
          sentiment_score: 0.5, 
          flagged_categories: [], 
          action: 'approve', 
          reason: 'Análise indisponível — aprovado por padrão',
          is_sensitive_for_bots: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    let result: any;
    
    try {
      const toolCall = aiData.choices[0].message.tool_calls?.[0];
      result = JSON.parse(toolCall.function.arguments);
    } catch {
      // Fallback: try parsing content directly
      try {
        const content = aiData.choices[0].message.content;
        result = JSON.parse(content.replace(/```json\n?|```/g, '').trim());
      } catch {
        result = {
          sentiment_score: 0.5,
          flagged_categories: [],
          action: 'approve',
          reason: 'Não foi possível analisar — aprovado por padrão',
          is_sensitive_for_bots: false,
        };
      }
    }

    // --- APPLY MODERATION if postId provided ---
    if (postId && mode === 'moderate') {
      // Log moderation
      await supabaseClient.from('post_moderation_logs').insert({
        post_id: postId,
        action: result.action,
        reason: result.reason,
        sentiment_score: result.sentiment_score,
        flagged_categories: result.flagged_categories,
      });

      // Apply action to post
      if (result.action === 'hide') {
        await supabaseClient.from('posts')
          .update({ is_hidden: true, moderation_status: 'hidden' })
          .eq('id', postId);
      } else if (result.action === 'flag') {
        await supabaseClient.from('posts')
          .update({ moderation_status: 'flagged' })
          .eq('id', postId);
      } else {
        await supabaseClient.from('posts')
          .update({ moderation_status: 'approved' })
          .eq('id', postId);
      }
    }

    console.log(`Moderation result for ${postId || 'analysis'}: ${result.action} (score: ${result.sentiment_score})`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in moderate-post:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
