/**
 * @fileoverview Hook para gerenciamento de posts da comunidade
 * @module hooks/usePosts
 * 
 * Provê operações CRUD com React Query e realtime updates
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import { analytics } from "@/lib/analytics";
import logger from "@/lib/logger";
import { createMultiTableSubscription } from "@/lib/realtime-utils";
import { QueryKeys, QueryCacheConfig } from "@/lib/query-config";

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

const POSTS_PER_PAGE = 20;

export const usePosts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Cache de profiles
  const [profileCache, setProfileCache] = useState<Map<string, { email: string; foto_perfil_url: string | null }>>(new Map());

  // Query key centralizada
  const postsQueryKey = QueryKeys.posts();

  // Infinite Query para posts paginados
  const {
    data,
    isLoading: loading,
    isFetchingNextPage: loadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: postsQueryKey,
    queryFn: async ({ pageParam = 0 }) => {
      if (!user) return { posts: [], nextPage: null };

      const from = pageParam * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

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
        .order("created_at", { ascending: false })
        .range(from, to);

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        return { posts: [], nextPage: null };
      }

      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const postIds = postsData.map(p => p.id);

      const [profilesResult, likesResult, commentsResult] = await Promise.all([
        supabase.from("profiles").select("id, email, foto_perfil_url, full_name").in("id", userIds),
        supabase.from("post_likes").select("post_id, user_id").in("post_id", postIds),
        supabase.from("post_comments").select("post_id").in("post_id", postIds),
      ]);

      // Update profile cache
      const newProfileCache = new Map(profileCache);
      profilesResult.data?.forEach(p => {
        newProfileCache.set(p.id, { email: p.email, foto_perfil_url: p.foto_perfil_url });
      });
      setProfileCache(newProfileCache);

      const profileMap = new Map(profilesResult.data?.map(p => [p.id, p]) || []);
      const likesCountMap = new Map<string, number>();
      const userLikesSet = new Set<string>();

      likesResult.data?.forEach(like => {
        likesCountMap.set(like.post_id, (likesCountMap.get(like.post_id) || 0) + 1);
        if (like.user_id === user.id) {
          userLikesSet.add(like.post_id);
        }
      });

      const commentsCountMap = new Map<string, number>();
      commentsResult.data?.forEach(comment => {
        commentsCountMap.set(comment.post_id, (commentsCountMap.get(comment.post_id) || 0) + 1);
      });

      const enrichedPosts: Post[] = postsData.map(post => {
        const profile = profileMap.get(post.user_id);
        return {
          ...post,
          user_email: post.display_name || profile?.full_name || profile?.email || "Usuário",
          user_photo: profile?.foto_perfil_url || null,
          likes_count: likesCountMap.get(post.id) || 0,
          comments_count: commentsCountMap.get(post.id) || 0,
          user_has_liked: userLikesSet.has(post.id),
        };
      });

      return {
        posts: enrichedPosts,
        nextPage: postsData.length === POSTS_PER_PAGE ? pageParam + 1 : null
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user,
    initialPageParam: 0,
    ...QueryCacheConfig.dynamic,
  });

  // Flatten posts
  const posts = useMemo(() => 
    data?.pages.flatMap(page => page.posts) ?? [],
    [data]
  );

  // Load more
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNextPage();
    }
  }, [loadingMore, hasMore, fetchNextPage]);

  // Optimistic like update
  const updatePostLike = useCallback((postId: string, liked: boolean) => {
    queryClient.setQueryData(postsQueryKey, (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((post: Post) => {
            if (post.id === postId) {
              return {
                ...post,
                user_has_liked: liked,
                likes_count: liked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1),
              };
            }
            return post;
          })
        }))
      };
    });
  }, [queryClient, postsQueryKey]);

  // Optimistic comment count update
  const updatePostCommentCount = useCallback((postId: string, delta: number) => {
    queryClient.setQueryData(postsQueryKey, (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((post: Post) => {
            if (post.id === postId) {
              return { ...post, comments_count: Math.max(0, post.comments_count + delta) };
            }
            return post;
          })
        }))
      };
    });
  }, [queryClient, postsQueryKey]);

  // Add post locally (optimistic)
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

    queryClient.setQueryData(postsQueryKey, (old: any) => {
      if (!old) return { pages: [{ posts: [enrichedPost], nextPage: null }], pageParams: [0] };
      return {
        ...old,
        pages: [
          { ...old.pages[0], posts: [enrichedPost, ...old.pages[0].posts] },
          ...old.pages.slice(1)
        ]
      };
    });
  }, [profileCache, queryClient, postsQueryKey]);

  // Remove post locally
  const removePostLocally = useCallback((postId: string) => {
    queryClient.setQueryData(postsQueryKey, (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: page.posts.filter((p: Post) => p.id !== postId)
        }))
      };
    });
  }, [queryClient, postsQueryKey]);

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async ({
      content,
      imageUrls,
      displayName,
      categoria,
      tags
    }: {
      content: string;
      imageUrls: string[];
      displayName?: string | null;
      categoria?: string;
      tags?: string[];
    }) => {
      if (!user) throw new Error("Não autenticado");

      const trimmedContent = content.trim();
      
      if (trimmedContent.length === 0) throw new Error("Conteúdo vazio");
      if (trimmedContent.length > 5000) throw new Error("Conteúdo muito longo");

      const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i];
      if (dangerousPatterns.some(pattern => pattern.test(trimmedContent))) {
        throw new Error("Conteúdo inválido");
      }

      const { data, error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: trimmedContent,
        image_urls: imageUrls,
        display_name: displayName || null,
        categoria: categoria || null,
        tags: tags || null,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      analytics.postCreated();
      toast({ title: "Post criado com sucesso!" });
      addPostLocally(data);
    },
    onError: (error: any) => {
      if (error.message?.includes("Aguarde antes de postar")) {
        toast({ title: "Aguarde um momento", description: "Você está postando muito rápido.", variant: "destructive" });
      } else {
        toast({ title: "Erro ao criar post", description: "Tente novamente mais tarde.", variant: "destructive" });
      }
      logger.error("Error creating post", error);
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
      return postId;
    },
    onMutate: (postId) => {
      removePostLocally(postId);
    },
    onSuccess: () => {
      toast({ title: "Post deletado com sucesso!" });
    },
    onError: (error) => {
      logger.error("Error deleting post", error);
      toast({ title: "Erro ao deletar post", variant: "destructive" });
      refetch(); // Revert
    }
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Não autenticado");
      
      const post = posts.find(p => p.id === postId);
      if (!post) throw new Error("Post não encontrado");

      if (post.user_has_liked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (error) throw error;
        return { postId, liked: false };
      } else {
        const { error } = await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: user.id,
        });
        if (error) throw error;
        analytics.postLiked(postId);
        return { postId, liked: true };
      }
    },
    onMutate: (postId) => {
      const post = posts.find(p => p.id === postId);
      if (post) {
        updatePostLike(postId, !post.user_has_liked);
      }
    },
    onError: (error, postId) => {
      const post = posts.find(p => p.id === postId);
      if (post) {
        updatePostLike(postId, post.user_has_liked); // Revert
      }
      logger.error("Error toggling like", error);
    }
  });

  // Realtime subscriptions
  useEffect(() => {
    if (!user?.id) return;

    const subscription = createMultiTableSubscription(
      `posts-changes-${user.id}`,
      [
        {
          table: "posts",
          event: "INSERT",
          onPayload: (payload: any) => {
            if (payload.new && payload.new.user_id !== user.id) {
              addPostLocally(payload.new);
            }
          },
        },
        {
          table: "posts",
          event: "DELETE",
          onPayload: (payload: any) => {
            if (payload.old) {
              removePostLocally(payload.old.id);
            }
          },
        },
        {
          table: "post_likes",
          event: "INSERT",
          onPayload: (payload: any) => {
            if (payload.new && payload.new.user_id !== user.id) {
              updatePostLike(payload.new.post_id, true);
            }
          },
        },
        {
          table: "post_likes",
          event: "DELETE",
          onPayload: (payload: any) => {
            if (payload.old && payload.old.user_id !== user.id) {
              updatePostLike(payload.old.post_id, false);
            }
          },
        },
        {
          table: "post_comments",
          event: "INSERT",
          onPayload: (payload: any) => {
            if (payload.new) {
              updatePostCommentCount(payload.new.post_id, 1);
            }
          },
        },
        {
          table: "post_comments",
          event: "DELETE",
          onPayload: (payload: any) => {
            if (payload.old) {
              updatePostCommentCount(payload.old.post_id, -1);
            }
          },
        },
      ]
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, addPostLocally, removePostLocally, updatePostLike, updatePostCommentCount]);

  // Public API
  const createPost = async (
    content: string,
    imageUrls: string[],
    displayName?: string | null,
    categoria?: string,
    tags?: string[]
  ) => {
    await createPostMutation.mutateAsync({ content, imageUrls, displayName, categoria, tags });
  };

  const deletePost = (postId: string) => deletePostMutation.mutate(postId);

  const toggleLike = (postId: string) => toggleLikeMutation.mutate(postId);

  return {
    posts,
    loading,
    loadingMore,
    hasMore: hasMore ?? false,
    loadMore,
    createPost,
    deletePost,
    toggleLike,
    reloadPosts: () => refetch(),
  };
};
