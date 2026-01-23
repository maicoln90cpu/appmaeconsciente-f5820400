import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsOptions } from "../_shared/cors.ts";
import { 
  createErrorResponse, 
  createSuccessResponse, 
  withErrorHandling,
  logEvent 
} from "../_shared/error-handler.ts";

serve(withErrorHandling(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  const { postContent, postCategory } = await req.json();

  if (!postContent) {
    return createErrorResponse('VALIDATION_ERROR', req, 'Post content is required');
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return createErrorResponse('CONFIG_ERROR', req, 'LOVABLE_API_KEY not configured');
  }

  const prompt = `Você é uma mãe brasileira participando de uma comunidade de gestantes e mães.
Escreva um comentário empático e natural para o seguinte post:

Categoria: ${postCategory || 'Geral'}
Post: "${postContent}"

**REGRAS:**
1. Use linguagem informal e calorosa (como brasileiros conversam)
2. Seja empática e ofereça apoio genuíno
3. Compartilhe experiências pessoais relacionadas (invente detalhes realistas)
4. Use emojis moderadamente (1-2 por comentário)
5. Mantenha o comentário entre 2-4 linhas
6. Seja específica e contextual ao post
7. Evite clichês como "você não está sozinha" sem contexto
8. Faça perguntas ou ofereça dicas práticas quando apropriado

Exemplos de tom:
- "Passa tão rápido! Com meu segundo filho percebi que cada fase tem seu charme ❤️"
- "Tenta fazer caminhadas leves, me ajudou muito com o inchaço no terceiro trimestre"
- "Normal sentir isso! Eu tive muito enjoo também, mas melhorou depois da 12ª semana"

Retorne APENAS o texto do comentário, sem aspas ou formatação extra.`;

  logEvent('info', 'generate-comment-request', { postCategory });

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a warm, empathetic Brazilian mother in an online community. Write natural, conversational comments.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.9,
      max_tokens: 150,
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    logEvent('error', 'ai-api-error', { status: aiResponse.status, error: errorText });
    return createErrorResponse('AI_ERROR', req, errorText);
  }

  const aiData = await aiResponse.json();
  const comment = aiData.choices[0].message.content.trim();

  logEvent('info', 'generate-comment-success');
  return createSuccessResponse({ comment }, req);
}));