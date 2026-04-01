import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── 20+ TEMAS ULTRA-ESPECÍFICOS ───
const POST_THEMES = [
  { tema: 'sono do bebê que só dorme no colo e resistência ao berço', categoria: 'dúvida' },
  { tema: 'culpa por voltar ao trabalho e deixar o bebê na creche', categoria: 'desabafo' },
  { tema: 'receita de papinha caseira que o bebê adorou', categoria: 'dicas' },
  { tema: 'pomada para assadura que realmente funciona vs outras que não prestam', categoria: 'dicas' },
  { tema: 'como lidar com palpites não solicitados de sogra/família', categoria: 'desabafo' },
  { tema: 'amamentação exclusiva vs complementar com fórmula', categoria: 'dúvida' },
  { tema: 'introdução alimentar BLW vs tradicional, qual escolheu e por quê', categoria: 'dúvida' },
  { tema: 'cólica do bebê à noite e o que ajudou a aliviar', categoria: 'dicas' },
  { tema: 'primeiro dente nascendo e bebê irritado demais', categoria: 'relato' },
  { tema: 'rotina de skincare pós-parto porque autocuidado importa', categoria: 'dicas' },
  { tema: 'ansiedade de separação do bebê, choro na creche', categoria: 'desabafo' },
  { tema: 'marcos do desenvolvimento que te surpreenderam', categoria: 'conquista' },
  { tema: 'situação engraçada de explosão de fralda em público', categoria: 'humor' },
  { tema: 'cansaço extremo da privação de sono e como sobrevive', categoria: 'desabafo' },
  { tema: 'enxoval: o que realmente usou vs o que foi inútil', categoria: 'dicas' },
  { tema: 'relação com o parceiro mudou depois do bebê', categoria: 'desabafo' },
  { tema: 'exercícios pós-parto que ajudaram na recuperação', categoria: 'dicas' },
  { tema: 'puerpério e saúde mental, dia difícil emocionalmente', categoria: 'desabafo' },
  { tema: 'bebê que não aceita mamadeira de jeito nenhum', categoria: 'dúvida' },
  { tema: 'vitória pequena do dia: bebê dormiu a noite toda', categoria: 'conquista' },
  { tema: 'vacina e reação no bebê, febre e choro', categoria: 'relato' },
  { tema: 'comparação entre filhos ou com bebês de amigas', categoria: 'desabafo' },
  { tema: 'mala da maternidade: o que levou e o que faltou', categoria: 'dicas' },
  { tema: 'amamentar em público e os olhares', categoria: 'relato' },
];

// ─── FRASES PROIBIDAS ───
const BANNED_PHRASES = `
FRASES ABSOLUTAMENTE PROIBIDAS (nunca use nenhuma dessas):
- "Ai, minha flor"
- "Ai, mamãe" 
- "Ai, minha querida"
- "Como eu te entendo"
- "Sei exatamente como você se sente"
- "Meu [nome] fez a mesma coisa"
- "Você não está sozinha"
- "Força, mamãe"
- "Forças, mamãe"
- "Vai ficar tudo bem"
- "Miga" (exceto se a persona Vanessa estiver sendo usada)
- "Meninas, alguém mais..."
- "Oi meninas"
- "Olá mamães"
- Qualquer abertura com interjeição + vocativo ("Ai, fulana", "Nossa, mamãe")

REGRAS DE ABERTURA OBRIGATÓRIAS — cada texto DEVE começar de uma forma diferente:
- Comece com uma afirmação direta sobre o assunto
- OU comece contando algo que aconteceu ("Ontem...", "Essa semana...", "No último mês...")
- OU comece com uma pergunta específica
- OU comece com um dado/informação
- OU comece com uma opinião ("Sinceramente, acho que...", "Eu discordo um pouco...")
- NUNCA comece com saudação genérica
`;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

interface VirtualProfile {
  id: string;
  email: string;
  full_name: string | null;
  personality: string | null;
  personality_style: string | null;
}

async function getActiveVirtualUsers(supabaseClient: any): Promise<VirtualProfile[]> {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('id, email, full_name, personality, personality_style')
    .eq('is_virtual', true)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching virtual users:', error);
    return [];
  }
  return data || [];
}

function buildPersonaPrompt(user: VirtualProfile): string {
  const name = user.full_name || user.email.split('@')[0];
  const profile = user.personality || 'Mãe brasileira participando de uma comunidade de gestantes e mães.';
  const style = user.personality_style || 'Natural e informal.';
  return `Você é ${name}. ${profile}\nEstilo de escrita: ${style}`;
}

async function generateAIContent(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string | null> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.95,
        max_tokens: 250,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
  } catch (err) {
    console.error('AI generation error:', err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const lovableKey = Deno.env.get('LOVABLE_API_KEY') ?? '';
    
    const supabaseClient = createClient(supabaseUrl, serviceKey);

    const { 
      maxPosts = 3, 
      maxReplies = 3, 
      maxLikes = 4,
      randomTiming = false,
      maxDelayMinutes = 30,
      sentimentFilter = true,
      autoModeration = false,
    } = await req.json().catch(() => ({}));

    const randomDelay = async () => {
      if (!randomTiming) return;
      const delay = Math.floor(Math.random() * Math.min(maxDelayMinutes, 30) * 60 * 1000) + 60000;
      console.log(`Random delay: ${Math.round(delay / 1000)}s`);
      await new Promise(r => setTimeout(r, delay));
    };

    console.log(`AI Engagement: ${maxPosts} posts, ${maxReplies} replies, ${maxLikes} likes`);

    // ─── FETCH PERSONAS FROM DATABASE ───
    const virtualUsers = await getActiveVirtualUsers(supabaseClient);
    if (!virtualUsers || virtualUsers.length === 0) {
      throw new Error('No active virtual users found. Create virtual users in Admin > Usuários Virtuais.');
    }

    console.log(`Loaded ${virtualUsers.length} virtual users from database`);

    let postsCreated = 0;
    let repliesCreated = 0;
    let likesCreated = 0;
    const engagementLogs: any[] = [];

    // --- 1. CREATE NEW POSTS ---
    const selectedThemes = pickRandomN(POST_THEMES, maxPosts);
    const selectedUsers = pickRandomN(virtualUsers, maxPosts);

    for (let i = 0; i < maxPosts; i++) {
      try {
        const theme = selectedThemes[i] || pickRandom(POST_THEMES);
        const user = selectedUsers[i] || pickRandom(virtualUsers);
        const personaPrompt = buildPersonaPrompt(user);

        const systemPrompt = `${personaPrompt}
Você está postando em uma comunidade brasileira de mães e gestantes.
Escreva APENAS em português brasileiro informal.
${BANNED_PHRASES}`;

        const userPrompt = `Escreva um post sobre: ${theme.tema}

REGRAS:
- Escreva entre 2-5 linhas como se fosse um post real de rede social
- Use no máximo 1-2 emojis
- Seja específica: cite horários, idades, nomes inventados de produtos/pessoas
- Escreva na primeira pessoa
- NÃO use aspas ao redor do texto
- Retorne APENAS o texto do post`;

        const postContent = await generateAIContent(lovableKey, systemPrompt, userPrompt);
        if (!postContent) continue;

        const { data: newPost, error: postError } = await supabaseClient
          .from('posts')
          .insert({
            user_id: user.id,
            content: postContent,
            categoria: theme.categoria,
            display_name: user.full_name || user.email.split('@')[0],
            tags: [],
          })
          .select('id')
          .single();

        if (!postError && newPost) {
          postsCreated++;
          engagementLogs.push({
            post_id: newPost.id,
            action_type: 'post',
            virtual_user_id: user.id,
            content: postContent.substring(0, 200),
          });
          console.log(`Created post by ${user.full_name}: ${newPost.id}`);
        }

        await randomDelay();
      } catch (err) {
        console.error('Error creating post:', err);
      }
    }

    // --- 2. ADD REPLIES TO EXISTING POSTS ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentPosts } = await supabaseClient
      .from('posts')
      .select('id, content, categoria, user_id, is_hidden, moderation_status')
      .gte('created_at', sevenDaysAgo.toISOString())
      .is('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(30);

    // --- SENTIMENT FILTER ---
    let eligiblePosts = recentPosts || [];
    if (sentimentFilter) {
      const filteredPosts: typeof eligiblePosts = [];
      for (const post of eligiblePosts) {
        try {
          const sentimentRes = await fetch(`${supabaseUrl}/functions/v1/moderate-post`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ postContent: post.content, mode: 'analyze' }),
          });
          if (sentimentRes.ok) {
            const analysis = await sentimentRes.json();
            if (analysis.is_sensitive_for_bots) {
              console.log(`Skipping sensitive post ${post.id}: ${analysis.reason}`);
              continue;
            }
          }
          filteredPosts.push(post);
        } catch {
          filteredPosts.push(post);
        }
      }
      eligiblePosts = filteredPosts;
      console.log(`Sentiment filter: ${recentPosts?.length || 0} → ${eligiblePosts.length} eligible posts`);
    }

    const postsForReplies = [...eligiblePosts].sort(() => Math.random() - 0.5).slice(0, maxReplies);
    const selectedUsersForReplies = pickRandomN(virtualUsers, maxReplies);

    for (let i = 0; i < postsForReplies.length; i++) {
      try {
        const post = postsForReplies[i];
        const user = selectedUsersForReplies[i] || pickRandom(virtualUsers);

        if (user.id === post.user_id) continue;

        const { data: existingComment } = await supabaseClient
          .from('post_comments')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingComment) continue;

        const personaPrompt = buildPersonaPrompt(user);
        const systemPrompt = `${personaPrompt}
Você está respondendo a um post em uma comunidade brasileira de mães.
${BANNED_PHRASES}`;

        const userPrompt = `Responda a este post de outra mãe na comunidade:
"${post.content}"

REGRAS:
- Escreva um comentário de 1-3 linhas
- Responda ao conteúdo específico do post (não seja genérica)
- Use no máximo 1 emoji
- Pode compartilhar experiência própria, dar dica prática, fazer pergunta de follow-up, ou discordar educadamente
- NÃO repita o que o post disse
- Retorne APENAS o texto do comentário`;

        const comment = await generateAIContent(lovableKey, systemPrompt, userPrompt);
        if (!comment) continue;

        const { error: commentError } = await supabaseClient
          .from('post_comments')
          .insert({
            post_id: post.id,
            user_id: user.id,
            comment: comment,
          });

        if (!commentError) {
          repliesCreated++;
          engagementLogs.push({
            post_id: post.id,
            action_type: 'comment',
            virtual_user_id: user.id,
            content: comment.substring(0, 200),
          });
          console.log(`Reply by ${user.full_name} on post ${post.id}`);
        }

        await randomDelay();
      } catch (err) {
        console.error('Error creating reply:', err);
      }
    }

    // --- 3. ADD LIKES ---
    const postsToLike = [...eligiblePosts].sort(() => Math.random() - 0.5).slice(0, maxLikes);

    for (const post of postsToLike) {
      try {
        const virtualUser = pickRandom(virtualUsers);

        const { data: existingLike } = await supabaseClient
          .from('post_likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', virtualUser.id)
          .maybeSingle();

        if (existingLike) continue;

        const { error: likeError } = await supabaseClient
          .from('post_likes')
          .insert({ post_id: post.id, user_id: virtualUser.id });

        if (!likeError) {
          likesCreated++;
          engagementLogs.push({
            post_id: post.id,
            action_type: 'like',
            virtual_user_id: virtualUser.id,
          });
        }
      } catch (err) {
        console.error('Error adding like:', err);
      }
    }

    // Save logs
    if (engagementLogs.length > 0) {
      await supabaseClient.from('ai_engagement_logs').insert(engagementLogs);
    }

    console.log(`AI Engagement done: ${postsCreated} posts, ${repliesCreated} replies, ${likesCreated} likes`);

    return new Response(
      JSON.stringify({
        success: true,
        posts_created: postsCreated,
        replies_created: repliesCreated,
        likes_created: likesCreated,
        total_logs: engagementLogs.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in auto-engage-community:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
