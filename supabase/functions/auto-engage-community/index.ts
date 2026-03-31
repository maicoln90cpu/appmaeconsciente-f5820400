import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── 12 PERSONAS DISTINTAS ───
const PERSONAS = [
  {
    name: 'Rafaela Santos',
    email: 'rafaela@maes.virtual',
    cidade: 'São Paulo', estado: 'SP',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rafaela&backgroundColor=b6e3f4',
    profile: 'Mãe de gêmeos de 8 meses, 28 anos. Prática e direta, sem rodeios. Escreve frases curtas e objetivas. Fala sobre logística de cuidar de dois bebês ao mesmo tempo.',
    style: 'Frases curtas. Vai direto ao ponto. Sem floreios.',
  },
  {
    name: 'Débora Lima',
    email: 'debora@maes.virtual',
    cidade: 'Rio de Janeiro', estado: 'RJ',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Debora&backgroundColor=ffd5dc',
    profile: 'Mãe de 3 filhos (12, 7 e 2 anos), 35 anos. Veterana que já viu de tudo. Dá conselhos curtos baseados em experiência real.',
    style: 'Tom de quem já passou por isso mil vezes. Conselhos práticos sem julgamento.',
  },
  {
    name: 'Thaís Oliveira',
    email: 'thais@maes.virtual',
    cidade: 'Belo Horizonte', estado: 'MG',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thais&backgroundColor=c0aede',
    profile: 'Mãe de primeira viagem, bebê de 3 meses, 22 anos. Insegura, faz muitas perguntas. Busca validação.',
    style: 'Faz perguntas. Expressa dúvidas. Pede opiniões. Usa "será que...?" e "alguém mais...?"',
  },
  {
    name: 'Priscila Ferreira',
    email: 'priscila@maes.virtual',
    cidade: 'Curitiba', estado: 'PR',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priscila&backgroundColor=d1f4d1',
    profile: 'Enfermeira e mãe de menina de 1 ano, 31 anos. Técnica mas acessível. Dá informações embasadas sem ser pedante.',
    style: 'Menciona dados ou orientações médicas de forma acessível. Ex: "a pediatra explicou que..."',
  },
  {
    name: 'Aline Costa',
    email: 'aline@maes.virtual',
    cidade: 'Salvador', estado: 'BA',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aline&backgroundColor=ffdfbf',
    profile: 'Grávida de 7 meses do primeiro filho, 27 anos. Ansiosa com o parto, pesquisa muito. Fala sobre enxoval, preparação e expectativas.',
    style: 'Animada mas ansiosa. Conta sobre preparativos. Pergunta sobre experiências de parto.',
  },
  {
    name: 'Luciana Martins',
    email: 'luciana@maes.virtual',
    cidade: 'Porto Alegre', estado: 'RS',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luciana&backgroundColor=e8d5b7',
    profile: 'Mãe de adolescente de 15 anos + bebê de 1 ano, 40 anos. Perspectiva madura, compara as duas experiências de maternidade.',
    style: 'Reflexiva, compara "na época do meu mais velho" com agora. Calma e ponderada.',
  },
  {
    name: 'Bruna Souza',
    email: 'bruna@maes.virtual',
    cidade: 'Recife', estado: 'PE',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bruna&backgroundColor=ffc9de',
    profile: 'Mãe solo de menino de 6 meses, 25 anos. Fala sobre conciliar trabalho e maternidade sozinha. Forte e determinada.',
    style: 'Realista sem ser pessimista. Compartilha perrengues do dia a dia. Orgulho discreto.',
  },
  {
    name: 'Camila Rocha',
    email: 'camila@maes.virtual',
    cidade: 'Florianópolis', estado: 'SC',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CamilaR&backgroundColor=baffc9',
    profile: 'Adepta de criação com apego, mãe de menina de 2 anos, 33 anos. Gentil mas firme nas opiniões sobre criação respeitosa.',
    style: 'Gentil, usa "aqui em casa a gente faz assim...". Sugere sem impor. Cita livros às vezes.',
  },
  {
    name: 'Vanessa Almeida',
    email: 'vanessa@maes.virtual',
    cidade: 'Goiânia', estado: 'GO',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vanessa&backgroundColor=ffd6a5',
    profile: 'Mãe de menino de 2 anos muito agitado, 29 anos. Bem-humorada, conta causos engraçados, leva a maternidade com leveza.',
    style: 'Bem-humorada, conta situações engraçadas. Usa risos e expressões coloquiais tipo "miga", "tô rindo".',
  },
  {
    name: 'Isabela Mendes',
    email: 'isabela@maes.virtual',
    cidade: 'Brasília', estado: 'DF',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabela&backgroundColor=a0c4ff',
    profile: 'Nutricionista e mãe de bebê de 9 meses, 34 anos. Foca em alimentação e introdução alimentar. Compartilha receitas e dicas nutricionais.',
    style: 'Fala sobre comida, receitas, BLW, introdução alimentar. Prática nas dicas de alimentação.',
  },
  {
    name: 'Renata Vieira',
    email: 'renata@maes.virtual',
    cidade: 'Campinas', estado: 'SP',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Renata&backgroundColor=caffbf',
    profile: 'Fisioterapeuta e mãe de bebê de 4 meses, 26 anos. Fala sobre recuperação pós-parto, exercícios e corpo.',
    style: 'Dá dicas de exercícios e recuperação. Encoraja sem pressionar. Linguagem acessível.',
  },
  {
    name: 'Patrícia Campos',
    email: 'patricia@maes.virtual',
    cidade: 'Fortaleza', estado: 'CE',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Patricia&backgroundColor=fdcfe8',
    profile: 'Psicóloga perinatal e mãe de menina de 1 ano e meio, 38 anos. Foca em saúde mental materna. Acolhedora sem ser clínica.',
    style: 'Acolhe sentimentos. Normaliza dificuldades sem minimizar. Sugere buscar ajuda quando necessário.',
  },
];

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

async function getOrCreateVirtualUsers(supabaseClient: any) {
  const { data: existing } = await supabaseClient
    .from('profiles')
    .select('id, email')
    .eq('is_virtual', true)
    .eq('is_active', true)
    .limit(20);

  if (existing && existing.length >= 10) return existing;

  const created: any[] = existing ? [...existing] : [];
  const existingEmails = new Set(created.map((u: any) => u.email));

  for (const persona of PERSONAS) {
    if (existingEmails.has(persona.email)) continue;
    try {
      const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
        email: persona.email,
        email_confirm: true,
        password: crypto.randomUUID(),
        user_metadata: { display_name: persona.name },
      });
      if (!authError && authUser.user) {
        await supabaseClient.from('profiles').update({
          cidade: persona.cidade,
          estado: persona.estado,
          perfil_completo: true,
          is_virtual: true,
          foto_perfil_url: persona.avatar,
          full_name: persona.name,
        }).eq('id', authUser.user.id);
        created.push({ id: authUser.user.id, email: persona.email });
      }
    } catch (e) {
      console.log('Error creating virtual user:', persona.email, e);
    }
  }
  return created;
}

function getPersonaByEmail(email: string) {
  return PERSONAS.find(p => p.email === email) || pickRandom(PERSONAS);
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
    const selectedThemes = pickRandomN(POST_THEMES, maxPosts);
    const selectedPersonasForPosts = pickRandomN(PERSONAS, maxPosts);

    for (let i = 0; i < maxPosts; i++) {
      try {
        const theme = selectedThemes[i] || pickRandom(POST_THEMES);
        const persona = selectedPersonasForPosts[i] || pickRandom(PERSONAS);
        const virtualUser = virtualUsers.find((u: any) => u.email === persona.email) || pickRandom(virtualUsers);

        const systemPrompt = `Você é ${persona.name}. ${persona.profile}
Estilo de escrita: ${persona.style}
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
            user_id: virtualUser.id,
            content: postContent,
            categoria: theme.categoria,
            display_name: persona.name,
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
          console.log(`Created post by ${persona.name}: ${newPost.id}`);
        }

        await new Promise(r => setTimeout(r, 1000));
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

    const postsForReplies = [...(recentPosts || [])].sort(() => Math.random() - 0.5).slice(0, maxReplies);
    const selectedPersonasForReplies = pickRandomN(PERSONAS, maxReplies);

    for (let i = 0; i < postsForReplies.length; i++) {
      try {
        const post = postsForReplies[i];
        const persona = selectedPersonasForReplies[i] || pickRandom(PERSONAS);
        const virtualUser = virtualUsers.find((u: any) => u.email === persona.email) || pickRandom(virtualUsers);

        // Don't reply to own posts
        if (virtualUser.id === post.user_id) continue;

        const { data: existingComment } = await supabaseClient
          .from('post_comments')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', virtualUser.id)
          .maybeSingle();

        if (existingComment) continue;

        const systemPrompt = `Você é ${persona.name}. ${persona.profile}
Estilo de escrita: ${persona.style}
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
          console.log(`Reply by ${persona.name} on post ${post.id}`);
        }

        await new Promise(r => setTimeout(r, 1000));
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
