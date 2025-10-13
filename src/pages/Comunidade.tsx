import { Loader2 } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { CreatePostDialog } from "@/components/comunidade/CreatePostDialog";
import { PostCard } from "@/components/comunidade/PostCard";
import { InstallPrompt } from "@/components/install/InstallPrompt";

const Comunidade = () => {
  const { posts, loading, createPost, deletePost, toggleLike } = usePosts();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Comunidade</h1>
          <p className="text-muted-foreground">
            Compartilhe sua jornada e conecte-se com outras mães
          </p>
        </div>

        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhum post ainda. Seja a primeira a compartilhar!
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={toggleLike}
                onDelete={deletePost}
              />
            ))
          )}
        </div>

        <CreatePostDialog onPostCreated={createPost} />
        <InstallPrompt />
      </div>
    </div>
  );
};

export default Comunidade;
