import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { posts, communityProfiles } from './data.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Starting community seeding...');

    let profilesCreated = 0;
    let profilesSkipped = 0;

    // Create fake user profiles (check for duplicates first)
    for (const profile of communityProfiles) {
      const { data: existingUser } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('email', profile.email)
        .single();

      if (existingUser) {
        console.log('User already exists, skipping:', profile.email);
        profilesSkipped++;
        continue;
      }

      const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
        email: profile.email,
        email_confirm: true,
        user_metadata: {
          display_name: profile.display_name,
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        continue;
      }

      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: profile.email,
          perfil_completo: true,
          meses_gestacao: profile.meses_gestacao,
          possui_filhos: profile.possui_filhos,
          idades_filhos: profile.idades_filhos,
          cidade: profile.cidade,
          estado: profile.estado,
        });

      if (!profileError) profilesCreated++;
    }

    const { data: allUsers } = await supabaseClient.from('profiles').select('id, email');
    const { data: existingPosts } = await supabaseClient.from('posts').select('id, content, categoria').order('created_at', { ascending: false }).limit(10);

    let postsCreated = 0;
    let commentsCreated = 0;

    for (const post of posts) {
      const randomUser = allUsers![Math.floor(Math.random() * allUsers!.length)];
      const { error: postError } = await supabaseClient.from('posts').insert({
        user_id: randomUser.id,
        content: post.content,
        categoria: post.categoria,
        tags: post.tags,
      });
      if (!postError) postsCreated++;
    }

    if (existingPosts && existingPosts.length > 0) {
      for (const post of existingPosts.slice(0, 5)) {
        const commentResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
          body: JSON.stringify({ postContent: post.content, postCategory: post.categoria }),
        });

        if (commentResponse.ok) {
          const { comment } = await commentResponse.json();
          const randomCommenter = allUsers![Math.floor(Math.random() * allUsers!.length)];
          const { error } = await supabaseClient.from('post_comments').insert({
            post_id: post.id,
            user_id: randomCommenter.id,
            comment: comment,
          });
          if (!error) commentsCreated++;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Community seeded successfully',
        profiles_created: profilesCreated,
        profiles_skipped: profilesSkipped,
        posts_created: postsCreated,
        comments_created: commentsCreated,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});