import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CATEGORIES = ['dicas', 'desabafo', 'dúvida', 'conquista', 'relato', 'humor'];

async function getOrCreateVirtualUsers(supabaseClient: any) {
  const { data: existing } = await supabaseClient
    .from('profiles')
    .select('id, email')
    .eq('is_virtual', true)
    .limit(10);

  if (existing && existing.length > 0) return existing;

  const virtualProfiles = [
    { email: 'ana@maes.virtual', cidade: 'São Paulo', estado: 'SP' },
    { email: 'julia@maes.virtual', cidade: 'Rio de Janeiro', estado: 'RJ' },
    { email: 'maria@maes.virtual', cidade: 'Belo Horizonte', estado: 'MG' },
    { email: 'carla@maes.virtual', cidade: 'Curitiba', estado: 'PR' },
    { email: 'fernanda@maes.virtual', cidade: 'Salvador', estado: 'BA' },
  ];

  const created: any[] = [];
  for (const profile of virtualProfiles) {
    try {
      const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
        email: profile.email,
        email_confirm: true,
        password: crypto.randomUUID(),
      });
      if (!authError && authUser.user) {
        await supabaseClient.from('profiles').update({
          cidade: profile.cidade,
          estado: profile.estado,
          perfil_completo: true,
          is_virtual: true,
        }).eq('id', authUser.user.id);
        created.push({ id: authUser.user.id, email: profile.email });
      }
    } catch (e) {
      console.log('Error creating virtual user:', e);
    }
  }
  return created;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const DISPLAY_NAMES = ['Ana', 'Julia', 'Maria', 'Carla', 'Fernanda', 'Beatriz', 'Camila', 'Larissa', 'Patrícia', 'Renata'];

async function generateAIText(apiUrl: string, serviceKey: string, prompt: string): Promise<string | null> {
  try {
    const response = await fetch(`${apiUrl}/functions/v1/generate-comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ postContent: prompt, postCategory: 'geral' }),
    });
    if (!response.ok) return null;
    const { comment } = await response.json();
    return comment;
  } catch {
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
      maxLikes = 4 
    } = await req.json().catch(() => ({}));

    console.log(`AI Engagement: ${maxPosts} posts, ${maxReplies} replies, ${maxLikes} likes`);

    const virtualUsers = await getOrCreateVirtualUsers(supabaseClient);
    if (!virtualUsers || virtualUsers.length === 0) {
      throw new Error('No virtual users available');
    }

    let postsCreated = 0;
    let repliesCreated = 0;
    let likesCreated = 0;
    const engagementLogs: any[] = [];

    // --- 1. CREATE NEW POSTS ---
    const postTopics = [
      'Compartilhe uma dica prática sobre maternidade que você descobriu recentemente. Escreva como se fosse uma mãe real postando em uma comunidade.',
      'Escreva um desabafo curto e autêntico sobre os desafios da maternidade, como cansaço, amamentação, ou sono do bebê.',
      'Faça uma pergunta natural que uma gestante ou mãe de primeira viagem faria em uma comunidade online.',
      'Compartilhe uma conquista pequena do dia a dia com seu bebê, algo que te deixou feliz.',
      'Conte uma situação engraçada que aconteceu com você e seu bebê recentemente.',
      'Peça recomendações sobre produtos para bebê, alimentação infantil ou rotina do bebê.',
    ];

    for (let i = 0; i < maxPosts; i++) {
      try {
        const topic = pickRandom(postTopics);
        const categoria = pickRandom(CATEGORIES);
        const virtualUser = pickRandom(virtualUsers);
        const displayName = pickRandom(DISPLAY_NAMES);

        const postContent = await generateAIContent(lovableKey, 
          `Você é uma mãe brasileira em uma comunidade online de mães e gestantes. ${topic}
          
REGRAS:
- Escreva entre 2-5 linhas
- Use linguagem informal e calorosa brasileira
- Use 1-2 emojis no máximo
- Seja autêntica e específica (cite detalhes realistas)
- NÃO comece com "Oi meninas" todas as vezes, varie as aberturas
- Retorne APENAS o texto do post, sem aspas ou formatação`
        );

        if (!postContent) continue;

        const { data: newPost, error: postError } = await supabaseClient
          .from('posts')
          .insert({
            user_id: virtualUser.id,
            content: postContent,
            categoria,
            display_name: displayName,
            tags: [],
          })
          .select('id')
          .single();

        if (!postError && newPost) {
          postsCreated++;
          engagementLogs.push({
            post_id: newPost.id,
            action_type: 'post',
            virtual_user_id: virtualUser.id,
            content: postContent.substring(0, 200),
          });
          console.log(`Created post ${newPost.id}`);
        }

        await new Promise(r => setTimeout(r, 800));
      } catch (err) {
        console.error('Error creating post:', err);
      }
    }

    // --- 2. ADD REPLIES TO EXISTING POSTS ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentPosts } = await supabaseClient
      .from('posts')
      .select('id, content, categoria, user_id')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(30);

    const realPosts = (recentPosts || []).filter(
      (p: any) => !virtualUsers.some((u: any) => u.id === p.user_id)
    );
    const allPosts = realPosts.length > 0 ? realPosts : (recentPosts || []);

    for (let i = 0; i < maxReplies && i < allPosts.length; i++) {
      try {
        const post = allPosts[i];
        const virtualUser = pickRandom(virtualUsers);

        // Check if already commented by this virtual user
        const { data: existingComment } = await supabaseClient
          .from('post_comments')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', virtualUser.id)
          .maybeSingle();

        if (existingComment) continue;

        const comment = await generateAIContent(lovableKey,
          `Você é uma mãe brasileira respondendo a este post em uma comunidade de mães:
"${post.content}"

REGRAS:
- Escreva um comentário empático e natural de 2-3 linhas
- Use linguagem informal brasileira
- Compartilhe experiência pessoal relacionada (invente detalhes realistas)
- Use 1-2 emojis moderadamente
- Faça perguntas ou ofereça dicas quando apropriado
- Retorne APENAS o texto do comentário`
        );

        if (!comment) continue;

        const { error: commentError } = await supabaseClient
          .from('post_comments')
          .insert({
            post_id: post.id,
            user_id: virtualUser.id,
            comment: comment,
          });

        if (!commentError) {
          repliesCreated++;
          engagementLogs.push({
            post_id: post.id,
            action_type: 'comment',
            virtual_user_id: virtualUser.id,
            content: comment.substring(0, 200),
          });
          console.log(`Created reply on post ${post.id}`);
        }

        await new Promise(r => setTimeout(r, 800));
      } catch (err) {
        console.error('Error creating reply:', err);
      }
    }

    // --- 3. ADD LIKES ---
    const postsToLike = [...(recentPosts || [])].sort(() => Math.random() - 0.5).slice(0, maxLikes);

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

async function generateAIContent(apiKey: string, prompt: string): Promise<string | null> {
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
          { role: 'system', content: 'You are a warm, empathetic Brazilian mother writing naturally in Portuguese. Never use quotes around your response.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.95,
        max_tokens: 200,
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
