import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { analytics } from "@/lib/analytics";

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_urls: string[];
  created_at: string;
  user_email: string;
  user_photo: string | null;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
  display_name: string | null;
  categoria: string | null;
  tags: string[] | null;
}

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Cache de profiles para evitar refetch
  const [profileCache, setProfileCache] = useState<Map<string, { email: string; foto_perfil_url: string | null }>>(new Map());

  const loadPosts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Fetch all posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`
          id,
          user_id,
          content,
          image_urls,
          created_at,
          display_name,
          categoria,
          tags
        `)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;
      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Get all unique user IDs
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const postIds = postsData.map(p => p.id);

      // Batch fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, foto_perfil_url")
        .in("id", userIds);

      // Atualizar cache de profiles
      const newProfileCache = new Map(profileCache);
      profiles?.forEach(p => {
        newProfileCache.set(p.id, { email: p.email, foto_perfil_url: p.foto_perfil_url });
      });
      setProfileCache(newProfileCache);

      // Batch fetch likes counts and user likes
      const { data: allLikes } = await supabase
        .from("post_likes")
        .select("post_id, user_id")
        .in("post_id", postIds);

      // Batch fetch comments counts
      const { data: allComments } = await supabase
        .from("post_comments")
        .select("post_id")
        .in("post_id", postIds);

      // Create lookup maps for O(1) access
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const likesCountMap = new Map<string, number>();
      const userLikesSet = new Set<string>();

      allLikes?.forEach(like => {
        likesCountMap.set(like.post_id, (likesCountMap.get(like.post_id) || 0) + 1);
        if (like.user_id === user.id) {
          userLikesSet.add(like.post_id);
        }
      });

      const commentsCountMap = new Map<string, number>();
      allComments?.forEach(comment => {
        commentsCountMap.set(comment.post_id, (commentsCountMap.get(comment.post_id) || 0) + 1);
      });

      // Enrich posts using lookup maps
      const enrichedPosts = postsData.map(post => {
        const profile = profileMap.get(post.user_id);
        return {
          ...post,
          user_email: post.display_name || profile?.email || "Usuário",
          user_photo: profile?.foto_perfil_url || null,
          likes_count: likesCountMap.get(post.id) || 0,
          comments_count: commentsCountMap.get(post.id) || 0,
          user_has_liked: userLikesSet.has(post.id),
        };
      });

      setPosts(enrichedPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
      toast({
        title: "Erro ao carregar posts",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, profileCache]);

  // Atualização otimista de likes
  const updatePostLike = useCallback((postId: string, liked: boolean) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          user_has_liked: liked,
          likes_count: liked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1),
        };
      }
      return post;
    }));
  }, []);

  // Atualização otimista de comentários
  const updatePostCommentCount = useCallback((postId: string, delta: number) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments_count: Math.max(0, post.comments_count + delta),
        };
      }
      return post;
    }));
  }, []);

  // Adicionar post localmente (otimista)
  const addPostLocally = useCallback((newPost: any) => {
    const profile = profileCache.get(newPost.user_id);
    const enrichedPost: Post = {
      ...newPost,
      image_urls: newPost.image_urls || [],
      user_email: newPost.display_name || profile?.email || "Usuário",
      user_photo: profile?.foto_perfil_url || null,
      likes_count: 0,
      comments_count: 0,
      user_has_liked: false,
    };
    setPosts(prev => [enrichedPost, ...prev]);
  }, [profileCache]);

  // Remover post localmente
  const removePostLocally = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  const createPost = async (
    content: string,
    imageUrls: string[],
    displayName?: string | null,
    categoria?: string,
    tags?: string[]
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validação de conteúdo
      const trimmedContent = content.trim();
      
      if (trimmedContent.length === 0) {
        toast({
          title: "Conteúdo vazio",
          description: "Escreva algo antes de publicar.",
          variant: "destructive",
        });
        return;
      }

      if (trimmedContent.length > 5000) {
        toast({
          title: "Conteúdo muito longo",
          description: "O post deve ter no máximo 5000 caracteres.",
          variant: "destructive",
        });
        return;
      }

      // Verificação anti-XSS básica
      const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i];
      if (dangerousPatterns.some(pattern => pattern.test(trimmedContent))) {
        toast({
          title: "Conteúdo inválido",
          description: "O post contém código potencialmente perigoso.",
          variant: "destructive",
        });
        return;
      }

      const { data: newPostData, error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: trimmedContent,
        image_urls: imageUrls,
        display_name: displayName || null,
        categoria: categoria || null,
        tags: tags || null,
      }).select().single();

      if (error) {
        // Tratamento específico de erro de rate limit
        if (error.message.includes("Aguarde antes de postar novamente")) {
          toast({
            title: "Aguarde um momento",
            description: "Você está postando muito rápido. Tente novamente em alguns segundos.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      analytics.postCreated();
      toast({ title: "Post criado com sucesso!" });
      
      // Atualização otimista - adicionar post localmente
      if (newPostData) {
        addPostLocally(newPostData);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Erro ao criar post",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const deletePost = async (postId: string) => {
    try {
      // Otimista - remover localmente primeiro
      removePostLocally(postId);

      const { error } = await supabase.from("posts").delete().eq("id", postId);

      if (error) {
        // Reverter se falhar
        await loadPosts();
        throw error;
      }

      toast({ title: "Post deletado com sucesso!" });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Erro ao deletar post",
        variant: "destructive",
      });
    }
  };

  const toggleLike = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const willLike = !post.user_has_liked;

      // Atualização otimista
      updatePostLike(postId, willLike);

      if (post.user_has_liked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        
        if (error) {
          // Reverter
          updatePostLike(postId, true);
          throw error;
        }
      } else {
        const { error } = await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: user.id,
        });
        
        if (error) {
          // Reverter
          updatePostLike(postId, false);
          throw error;
        }
        analytics.postLiked(postId);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  useEffect(() => {
    loadPosts();

    // Subscribe to realtime changes - processar payload ao invés de refetch
    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          // Só adicionar se não for do usuário atual (já adicionou otimisticamente)
          if (payload.new && (payload.new as any).user_id !== currentUserId) {
            addPostLocally(payload.new);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        (payload) => {
          if (payload.old) {
            removePostLocally((payload.old as any).id);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "post_likes" },
        (payload) => {
          if (payload.new) {
            const like = payload.new as any;
            // Só atualizar se não for do usuário atual
            if (like.user_id !== currentUserId) {
              setPosts(prev => prev.map(post => {
                if (post.id === like.post_id) {
                  return { ...post, likes_count: post.likes_count + 1 };
                }
                return post;
              }));
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "post_likes" },
        (payload) => {
          if (payload.old) {
            const like = payload.old as any;
            if (like.user_id !== currentUserId) {
              setPosts(prev => prev.map(post => {
                if (post.id === like.post_id) {
                  return { ...post, likes_count: Math.max(0, post.likes_count - 1) };
                }
                return post;
              }));
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "post_comments" },
        (payload) => {
          if (payload.new) {
            updatePostCommentCount((payload.new as any).post_id, 1);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "post_comments" },
        (payload) => {
          if (payload.old) {
            updatePostCommentCount((payload.old as any).post_id, -1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return {
    posts,
    loading,
    createPost,
    deletePost,
    toggleLike,
    reloadPosts: loadPosts,
  };
};
