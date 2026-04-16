import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { handleCorsOptions } from "../_shared/cors.ts";
import { 
  createErrorResponse, 
  createSuccessResponse, 
  withErrorHandling,
  logEvent 
} from "../_shared/error-handler.ts";

const BANNED_PHRASES = [
  "Ai, minha flor",
  "Ai, mamãe",
  "Ai, minha querida",
  "Como eu te entendo",
  "Sei exatamente como você se sente",
  "Você não está sozinha",
  "Força, mamãe",
  "Forças, mamãe",
  "Vai ficar tudo bem",
  "Meninas, alguém mais",
  "Oi meninas",
  "Olá mamães",
];

serve(withErrorHandling(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  const { postContent, postCategory, persona } = await req.json();

  if (!postContent) {
    return createErrorResponse('VALIDATION_ERROR', req, 'Post content is required');
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return createErrorResponse('CONFIG_ERROR', req, 'LOVABLE_API_KEY not configured');
  }

  // Build persona-aware system prompt using DB fields
  let systemPrompt: string;
  if (persona) {
    const name = persona.full_name || persona.name || 'Mãe';
    const profile = persona.personality || persona.profile || '';
    const style = persona.personality_style || persona.style || 'Natural e informal.';
    systemPrompt = `Você é ${name}. ${profile}
Estilo de escrita: ${style}
Você está comentando em uma comunidade brasileira de mães e gestantes.
Escreva APENAS em português brasileiro informal.`;
  } else {
    systemPrompt = `Você é uma mãe brasileira participando de uma comunidade de gestantes e mães.
Escreva APENAS em português brasileiro informal e natural.
Cada comentário deve ter personalidade própria — varie o tom entre: prática, engraçada, reflexiva, técnica, insegura, veterana.`;
  }

  const prompt = `Comente este post de outra mãe na comunidade:

Categoria: ${postCategory || 'Geral'}
Post: "${postContent}"

**REGRAS OBRIGATÓRIAS:**
1. Escreva 1-3 linhas, como comentário real de rede social
2. Responda ao CONTEÚDO ESPECÍFICO do post — não seja genérica
3. Use no máximo 1 emoji
4. Pode: compartilhar experiência, dar dica prática, fazer pergunta, ou discordar educadamente
5. NUNCA repita frases do post original

**ABERTURAS VARIADAS — escolha UMA:**
- Comece contando algo que aconteceu com você ("Aqui aconteceu...", "Semana passada...", "Com X meses...")
- Comece com uma dica direta ("Tenta...", "O que funcionou aqui foi...", "Uma coisa que ajuda...")
- Comece com uma pergunta ("Qual idade?", "Já tentou...?", "Quanto tempo faz...?")
- Comece com opinião ("Sinceramente...", "Eu acho que...", "Discordo um pouco...")
- Comece com um fato ou dado ("A pediatra explicou que...", "Li que...")

**FRASES 100% PROIBIDAS (NUNCA use):**
${BANNED_PHRASES.map(f => `- "${f}"`).join('\n')}
- Qualquer abertura com "Ai, [vocativo]"
- Qualquer frase começando com interjeição + vocativo

Retorne APENAS o texto do comentário, sem aspas ou formatação extra.`;

  logEvent('info', 'generate-comment-request', { postCategory, hasPersona: !!persona });

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.95,
      max_tokens: 150,
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    logEvent('error', 'ai-api-error', { status: aiResponse.status, error: errorText });
    return createErrorResponse('AI_ERROR', req, errorText);
  }

  const aiData = await aiResponse.json();
  let comment = aiData.choices[0].message.content.trim();
  
  // Remove quotes if AI wrapped the response
  comment = comment.replace(/^["']|["']$/g, '');

  logEvent('info', 'generate-comment-success');
  return createSuccessResponse({ comment }, req);
}));
