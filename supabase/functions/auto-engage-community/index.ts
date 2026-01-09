import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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

    const { maxComments = 5, maxLikes = 10 } = await req.json();

    console.log(`Starting AI engagement: ${maxComments} comments, ${maxLikes} likes`);

    // Get virtual users (fake profiles for AI engagement)
    const { data: virtualUsers, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id, email')
      .like('email', '%@maes.virtual%')
      .limit(10);

    if (usersError || !virtualUsers || virtualUsers.length === 0) {
      // Create virtual users if none exist
      console.log('No virtual users found, creating some...');
      
      const virtualProfiles = [
        { email: 'ana@maes.virtual', cidade: 'São Paulo', estado: 'SP' },
        { email: 'julia@maes.virtual', cidade: 'Rio de Janeiro', estado: 'RJ' },
        { email: 'maria@maes.virtual', cidade: 'Belo Horizonte', estado: 'MG' },
        { email: 'carla@maes.virtual', cidade: 'Curitiba', estado: 'PR' },
        { email: 'fernanda@maes.virtual', cidade: 'Salvador', estado: 'BA' },
      ];

      for (const profile of virtualProfiles) {
        try {
          const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
            email: profile.email,
            email_confirm: true,
            password: crypto.randomUUID(),
          });

          if (!authError && authUser.user) {
            await supabaseClient.from('profiles').insert({
              id: authUser.user.id,
              email: profile.email,
              cidade: profile.cidade,
              estado: profile.estado,
              perfil_completo: true,
            });
          }
        } catch (e) {
          console.log('Error creating virtual user:', e);
        }
      }

      // Re-fetch virtual users
      const { data: newUsers } = await supabaseClient
        .from('profiles')
        .select('id, email')
        .like('email', '%@maes.virtual%')
        .limit(10);

      if (!newUsers || newUsers.length === 0) {
        throw new Error('Failed to create virtual users');
      }
    }

    // Get updated list of virtual users
    const { data: allVirtualUsers } = await supabaseClient
      .from('profiles')
      .select('id, email')
      .like('email', '%@maes.virtual%');

    if (!allVirtualUsers || allVirtualUsers.length === 0) {
      throw new Error('No virtual users available');
    }

    // Get recent posts without AI comments (from last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentPosts, error: postsError } = await supabaseClient
      .from('posts')
      .select('id, content, categoria, user_id')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (postsError) throw postsError;

    console.log(`Found ${recentPosts?.length || 0} recent posts`);

    let commentsCreated = 0;
    let likesCreated = 0;
    const engagementLogs: any[] = [];

    // Add comments
    for (const post of (recentPosts || []).slice(0, maxComments)) {
      try {
        // Skip posts from virtual users
        if (allVirtualUsers.some(u => u.id === post.user_id)) continue;

        // Check if already commented by AI
        const { data: existingLog } = await supabaseClient
          .from('ai_engagement_logs')
          .select('id')
          .eq('post_id', post.id)
          .eq('action_type', 'comment')
          .maybeSingle();

        if (existingLog) continue;

        // Generate comment using AI
        const commentResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-comment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            postContent: post.content,
            postCategory: post.categoria,
          }),
        });

        if (!commentResponse.ok) {
          console.error('Failed to generate comment:', await commentResponse.text());
          continue;
        }

        const { comment } = await commentResponse.json();

        // Pick random virtual user
        const virtualUser = allVirtualUsers[Math.floor(Math.random() * allVirtualUsers.length)];

        // Insert comment
        const { error: commentError } = await supabaseClient
          .from('post_comments')
          .insert({
            post_id: post.id,
            user_id: virtualUser.id,
            comment: comment,
          });

        if (!commentError) {
          commentsCreated++;
          engagementLogs.push({
            post_id: post.id,
            action_type: 'comment',
            virtual_user_id: virtualUser.id,
            content: comment,
          });
          console.log(`Created comment on post ${post.id}`);
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        console.error('Error processing comment:', err);
      }
    }

    // Add likes
    for (const post of (recentPosts || []).slice(0, maxLikes)) {
      try {
        // Skip posts from virtual users
        if (allVirtualUsers.some(u => u.id === post.user_id)) continue;

        // Pick random virtual user
        const virtualUser = allVirtualUsers[Math.floor(Math.random() * allVirtualUsers.length)];

        // Check if already liked by this user
        const { data: existingLike } = await supabaseClient
          .from('post_likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', virtualUser.id)
          .maybeSingle();

        if (existingLike) continue;

        // Insert like
        const { error: likeError } = await supabaseClient
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: virtualUser.id,
          });

        if (!likeError) {
          likesCreated++;
          engagementLogs.push({
            post_id: post.id,
            action_type: 'like',
            virtual_user_id: virtualUser.id,
          });
        }

      } catch (err) {
        console.error('Error processing like:', err);
      }
    }

    // Save engagement logs
    if (engagementLogs.length > 0) {
      const { error: logError } = await supabaseClient
        .from('ai_engagement_logs')
        .insert(engagementLogs);

      if (logError) {
        console.error('Error saving engagement logs:', logError);
      }
    }

    console.log(`AI Engagement complete: ${commentsCreated} comments, ${likesCreated} likes`);

    return new Response(
      JSON.stringify({
        success: true,
        comments_created: commentsCreated,
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
