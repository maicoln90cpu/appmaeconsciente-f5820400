import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limiter.ts";
import { handleCorsOptions } from "../_shared/cors.ts";
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  parseRequestBody,
  logEvent,
} from "../_shared/error-handler.ts";

interface ChatRequest {
  message: string;
  conversationId: string;
}

serve(withErrorHandling(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return createErrorResponse('UNAUTHORIZED', req);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verificar usuário
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  
  if (userError || !user) {
    return createErrorResponse('UNAUTHORIZED', req);
  }

  // Rate limiting: 20 mensagens por hora
  const rateLimit = checkRateLimit(user.id, 'nutrition-chat', {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return createErrorResponse('RATE_LIMITED', req, 
      `Limite de mensagens atingido. Tente novamente em ${rateLimit.retryAfter} segundos.`
    );
  }

  const { data: body, error: parseError } = await parseRequestBody<ChatRequest>(req);
  
  if (parseError || !body) {
    return createErrorResponse('VALIDATION_ERROR', req, parseError || 'Invalid request body');
  }

  const { message, conversationId } = body;

  if (!message || !conversationId) {
    return createErrorResponse('MISSING_FIELD', req, 'message and conversationId are required');
  }

  logEvent('info', 'chat-start', { conversationId });

  // Buscar histórico da conversa
  const { data: messages } = await supabase
    .from('nutrition_chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  // Buscar dados do perfil para contexto
  const { data: profile } = await supabase
    .from('profiles')
    .select('meses_gestacao')
    .eq('id', user.id)
    .single();

  const trimester = profile?.meses_gestacao 
    ? Math.ceil(profile.meses_gestacao / 3) 
    : 1;

  // Preparar mensagens para a IA
  const conversationHistory = messages?.map(m => ({
    role: m.role,
    content: m.content
  })) || [];

  const systemPrompt = `Você é uma nutricionista especializada em gestação. Você está auxiliando uma gestante que está no ${trimester}º trimestre.

Suas responsabilidades:
- Fornecer orientações nutricionais baseadas em evidências científicas
- Sugerir alimentos e receitas saudáveis para gestantes
- Explicar os benefícios de nutrientes específicos para cada trimestre
- Alertar sobre alimentos que devem ser evitados durante a gestação
- Responder dúvidas sobre suplementação (mas sempre recomendando consultar o médico para prescrições)

Diretrizes importantes:
- Sempre reforce que suas orientações são gerais e não substituem consulta médica
- Seja empática e acolhedora
- Use linguagem simples e acessível
- Quando relevante, sugira receitas práticas e rápidas
- Considere as necessidades nutricionais específicas do trimestre atual
- Mantenha respostas concisas e diretas

Formato de resposta:
- Use markdown para melhor formatação
- Organize informações em listas quando apropriado
- Seja objetiva mas calorosa no tom`;

  // Chamar Lovable AI
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return createErrorResponse('CONFIG_ERROR', req, 'LOVABLE_API_KEY not configured');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ],
      maxOutputTokens: 1000
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logEvent('error', 'ai-api-error', { status: response.status, error: errorText });
    return createErrorResponse('AI_ERROR', req, errorText);
  }

  const data = await response.json();
  const assistantMessage = data.choices?.[0]?.message?.content;

  if (!assistantMessage) {
    return createErrorResponse('AI_ERROR', req, 'No response from AI');
  }

  // Salvar mensagens no banco
  await supabase.from('nutrition_chat_messages').insert([
    {
      conversation_id: conversationId,
      role: 'user',
      content: message
    },
    {
      conversation_id: conversationId,
      role: 'assistant',
      content: assistantMessage
    }
  ]);

  // Atualizar título da conversa se for a primeira mensagem
  if (!messages || messages.length === 0) {
    const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
    await supabase
      .from('nutrition_chat_conversations')
      .update({ title })
      .eq('id', conversationId);
  }

  logEvent('info', 'chat-response-sent', { conversationId });

  return createSuccessResponse({ message: assistantMessage }, req);
}));
