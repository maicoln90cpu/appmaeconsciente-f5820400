import { useState, useCallback, memo } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Trash2, MoreVertical, Flag, UserX } from "lucide-react";
import { Post } from "@/hooks/usePosts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CommentSection } from "./CommentSection";
import { useAuth } from "@/contexts/AuthContext";
import { useModeration } from "@/hooks/useModeration";
import { ReportPostDialog } from "./ReportPostDialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
}

const PostCardComponent = ({ post, onLike, onDelete }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const { user } = useAuth();
  const { blockUser, isUserBlocked } = useModeration();

  const isOwner = user?.id === post.user_id;
  const isBlocked = isUserBlocked(post.user_id);
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const handleLike = useCallback(() => {
    onLike(post.id);
  }, [onLike, post.id]);

  const handleDelete = useCallback(() => {
    onDelete(post.id);
  }, [onDelete, post.id]);

  const toggleComments = useCallback(() => {
    setShowComments(prev => !prev);
  }, []);

  const handleImageSelect = useCallback((index: number) => {
    setCurrentImageIndex(index);
  }, []);

  const handleBlock = useCallback(() => {
    blockUser({ blockedId: post.user_id });
  }, [blockUser, post.user_id]);

  // Don't render blocked users' posts
  if (isBlocked) return null;

  return (
    <>
      <ReportPostDialog 
        postId={post.id} 
        open={showReportDialog} 
        onOpenChange={setShowReportDialog} 
      />
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

        {isOwner ? (
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
                <AlertDialogAction onClick={handleDelete}>
                  Deletar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mais opções">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                <Flag className="h-4 w-4 mr-2" />
                Denunciar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleBlock}
                className="text-destructive focus:text-destructive"
              >
                <UserX className="h-4 w-4 mr-2" />
                Bloquear usuária
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              loading="lazy"
            />
            {post.image_urls.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {post.image_urls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageSelect(index)}
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
          onClick={handleLike}
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
          onClick={toggleComments}
        >
          <MessageCircle className="h-5 w-5 mr-1" />
          {post.comments_count}
        </Button>
      </div>

      {showComments && <CommentSection postId={post.id} />}
      </Card>
    </>
  );
};

// Memoização para evitar re-renders desnecessários
export const PostCard = memo(PostCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.likes_count === nextProps.post.likes_count &&
    prevProps.post.comments_count === nextProps.post.comments_count &&
    prevProps.post.user_has_liked === nextProps.post.user_has_liked &&
    prevProps.post.content === nextProps.post.content
  );
});
