import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { Post } from "@/hooks/usePosts";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CommentSection } from "./CommentSection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
}

export const PostCard = ({ post, onLike, onDelete }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user?.id || null);
    });
  });

  const isOwner = currentUser === post.user_id;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.user_photo || undefined} />
            <AvatarFallback>
              {post.user_email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{post.user_email.split("@")[0]}</p>
            <p className="text-sm text-muted-foreground">{timeAgo}</p>
          </div>
        </div>

        {isOwner && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Deletar post">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deletar post</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja deletar este post? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(post.id)}>
                  Deletar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <p className="mb-4 whitespace-pre-wrap">{post.content}</p>

      {post.image_urls && post.image_urls.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <img
              src={post.image_urls[currentImageIndex]}
              alt="Post"
              className="w-full rounded-lg object-cover max-h-96"
            />
            {post.image_urls.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {post.image_urls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      index === currentImageIndex
                        ? "bg-white"
                        : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onLike(post.id)}
          className={post.user_has_liked ? "text-red-500" : ""}
        >
          <Heart
            className={`h-5 w-5 mr-1 ${
              post.user_has_liked ? "fill-current" : ""
            }`}
          />
          {post.likes_count}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="h-5 w-5 mr-1" />
          {post.comments_count}
        </Button>
      </div>

      {showComments && <CommentSection postId={post.id} />}
    </Card>
  );
};
