import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
}

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: postsData, error } = await supabase
        .from("posts")
        .select(`
          id,
          user_id,
          content,
          image_urls,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich posts with user data, likes, and comments
      const enrichedPosts = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, foto_perfil_url")
            .eq("id", post.user_id)
            .single();

          const { count: likesCount } = await supabase
            .from("post_likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          const { count: commentsCount } = await supabase
            .from("post_comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          const { data: userLike } = await supabase
            .from("post_likes")
            .select("id")
            .eq("post_id", post.id)
            .eq("user_id", user.id)
            .maybeSingle();

          return {
            ...post,
            user_email: profile?.email || "Usuário",
            user_photo: profile?.foto_perfil_url || null,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            user_has_liked: !!userLike,
          };
        })
      );

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
  };

  const createPost = async (content: string, imageUrls: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content,
        image_urls: imageUrls,
      });

      if (error) throw error;

      toast({ title: "Post criado com sucesso!" });
      await loadPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Erro ao criar post",
        variant: "destructive",
      });
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);

      if (error) throw error;

      toast({ title: "Post deletado com sucesso!" });
      await loadPosts();
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

      if (post.user_has_liked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
      } else {
        await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: user.id,
        });
      }

      await loadPosts();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  useEffect(() => {
    loadPosts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => {
          loadPosts();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_likes" },
        () => {
          loadPosts();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments" },
        () => {
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    posts,
    loading,
    createPost,
    deletePost,
    toggleLike,
    reloadPosts: loadPosts,
  };
};
