import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Comment {
  id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user_email: string;
  user_photo: string | null;
}

interface CommentSectionProps {
  postId: string;
}

export const CommentSection = ({ postId }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, [postId]);

  const loadComments = async () => {
    const { data: commentsData, error } = await supabase
      .from("post_comments")
      .select("id, user_id, comment, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading comments:", error);
      return;
    }

    const enrichedComments = await Promise.all(
      (commentsData || []).map(async (comment) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, foto_perfil_url, full_name")
          .eq("id", comment.user_id)
          .single();

        const displayName = profile?.full_name || profile?.email?.split("@")[0] || "Usuário";

        return {
          ...comment,
          user_email: displayName,
          user_photo: profile?.foto_perfil_url || null,
        };
      })
    );

    setComments(enrichedComments);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      user_id: user.id,
      comment: newComment,
    });

    if (error) {
      toast.error("Erro ao comentar");
      return;
    }

    setNewComment("");
    loadComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("post_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      toast.error("Erro ao deletar comentário");
      return;
    }

    loadComments();
  };

  return (
    <div className="border-t pt-4 space-y-4">
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.user_photo || undefined} />
              <AvatarFallback>
                {comment.user_email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-muted rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                   <p className="font-semibold text-sm">
                     {comment.user_email}
                   </p>
                  <p className="text-sm">{comment.comment}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
                {currentUserId === comment.user_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleDeleteComment(comment.id)}
                    aria-label="Deletar comentário"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Escreva um comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
        />
        <Button size="icon" onClick={handleAddComment} aria-label="Enviar comentário">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
