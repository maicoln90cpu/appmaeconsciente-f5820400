import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { FAKE_PROFILES, POSTS_DATA, COMMENTS_TEMPLATES, SPECIFIC_COMMENTS } from './data.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar se usuário é admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Não autorizado')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado')
    }

    // Verificar se é admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')

    if (!roles || roles.length === 0) {
      throw new Error('Apenas admins podem executar esta função')
    }

    console.log('Iniciando seed da comunidade...')
    
    // Criar perfis fictícios
    const createdProfiles = []
    
    for (const profile of FAKE_PROFILES) {
      try {
        // Criar usuário fake no auth (sem senha, não poderá fazer login)
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
          email: profile.email,
          email_confirm: true,
          user_metadata: {
            nome: profile.nome
          }
        })

        if (authError) {
          console.error(`Erro ao criar auth user ${profile.email}:`, authError)
          continue
        }

        if (!authUser?.user) {
          console.error(`Nenhum usuário retornado para ${profile.email}`)
          continue
        }

        // Atualizar perfil
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .update({
            email: profile.email,
            cidade: profile.cidade,
            estado: profile.estado,
            perfil_completo: true
          })
          .eq('id', authUser.user.id)

        if (profileError) {
          console.error(`Erro ao atualizar perfil ${profile.email}:`, profileError)
        } else {
          createdProfiles.push({ id: authUser.user.id, ...profile })
          console.log(`Perfil criado: ${profile.nome}`)
        }
      } catch (error) {
        console.error(`Erro ao processar perfil ${profile.email}:`, error)
      }
    }

    if (createdProfiles.length === 0) {
      throw new Error('Nenhum perfil foi criado')
    }

    console.log(`${createdProfiles.length} perfis criados com sucesso`)

    // Criar posts
    const createdPosts = []
    
    for (const postData of POSTS_DATA) {
      const randomProfile = createdProfiles[Math.floor(Math.random() * createdProfiles.length)]
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - postData.daysAgo)

      const { data: post, error: postError } = await supabaseClient
        .from('posts')
        .insert({
          user_id: randomProfile.id,
          content: postData.content,
          categoria: postData.categoria,
          tags: postData.tags,
          created_at: createdAt.toISOString(),
          display_name: randomProfile.nome
        })
        .select()
        .single()

      if (postError) {
        console.error('Erro ao criar post:', postError)
        continue
      }

      createdPosts.push({ ...post, categoria: postData.categoria })
      console.log(`Post criado: ${postData.content.substring(0, 50)}...`)
    }

    console.log(`${createdPosts.length} posts criados com sucesso`)

    // Criar curtidas (100-150 curtidas distribuídas)
    const likesCount = Math.floor(Math.random() * 50) + 100
    const createdLikes = []

    for (let i = 0; i < likesCount; i++) {
      const randomPost = createdPosts[Math.floor(Math.random() * createdPosts.length)]
      const randomProfile = createdProfiles[Math.floor(Math.random() * createdProfiles.length)]

      // Verificar se já curtiu
      const { data: existingLike } = await supabaseClient
        .from('post_likes')
        .select('id')
        .eq('post_id', randomPost.id)
        .eq('user_id', randomProfile.id)
        .single()

      if (!existingLike) {
        const { error: likeError } = await supabaseClient
          .from('post_likes')
          .insert({
            post_id: randomPost.id,
            user_id: randomProfile.id
          })

        if (!likeError) {
          createdLikes.push({ post_id: randomPost.id, user_id: randomProfile.id })
        }
      }
    }

    console.log(`${createdLikes.length} curtidas criadas com sucesso`)

    // Criar comentários (50-80 comentários)
    const commentsCount = Math.floor(Math.random() * 30) + 50
    const createdComments = []

    for (let i = 0; i < commentsCount; i++) {
      const randomPost = createdPosts[Math.floor(Math.random() * createdPosts.length)]
      const randomProfile = createdProfiles[Math.floor(Math.random() * createdProfiles.length)]
      
      // Buscar comentários específicos para a categoria
      const categoryComments = SPECIFIC_COMMENTS[randomPost.categoria] || []
      const allComments = [...categoryComments, ...COMMENTS_TEMPLATES]
      const randomComment = allComments[Math.floor(Math.random() * allComments.length)]

      // Criar timestamp baseado no post
      const postDate = new Date(randomPost.created_at)
      const commentDate = new Date(postDate)
      commentDate.setHours(postDate.getHours() + Math.floor(Math.random() * 48)) // 0-48h depois do post

      const { error: commentError } = await supabaseClient
        .from('post_comments')
        .insert({
          post_id: randomPost.id,
          user_id: randomProfile.id,
          comment: randomComment,
          created_at: commentDate.toISOString()
        })

      if (!commentError) {
        createdComments.push({ post_id: randomPost.id, comment: randomComment })
      }
    }

    console.log(`${createdComments.length} comentários criados com sucesso`)

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          profiles: createdProfiles.length,
          posts: createdPosts.length,
          likes: createdLikes.length,
          comments: createdComments.length
        },
        message: 'Comunidade povoada com sucesso!'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Erro ao povoar comunidade:', error)
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Erro desconhecido',
        details: error 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
