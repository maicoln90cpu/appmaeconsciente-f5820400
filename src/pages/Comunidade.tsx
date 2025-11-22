import { useState } from "react";
import { usePosts } from "@/hooks/usePosts";
import { CreatePostDialog } from "@/components/comunidade/CreatePostDialog";
import { PostCard } from "@/components/comunidade/PostCard";
import { PostFilters } from "@/components/comunidade/PostFilters";
import { InstallPrompt } from "@/components/install/InstallPrompt";
import { LoadingCards } from "@/components/ui/loading-card";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageSquare } from "lucide-react";

const Comunidade = () => {
  const { posts, loading, createPost, deletePost, toggleLike } = usePosts();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = searchQuery
      ? post.content.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesCategory = selectedCategory
      ? post.categoria === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Comunidade</h1>
          <p className="text-muted-foreground">
            Compartilhe sua jornada e conecte-se com outras mães
          </p>
        </div>

        <PostFilters
          onSearch={setSearchQuery}
          onCategoryFilter={setSelectedCategory}
          selectedCategory={selectedCategory}
        />

        {loading ? (
          <LoadingCards count={3} />
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Nenhum post encontrado"
            description={
              searchQuery || selectedCategory
                ? "Tente ajustar os filtros de busca"
                : "Seja a primeira a compartilhar algo com a comunidade!"
            }
          />
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={toggleLike}
                onDelete={deletePost}
              />
            ))}
          </div>
        )}

        <CreatePostDialog onPostCreated={createPost} />
        <InstallPrompt />
      </div>
    </div>
  );
};

export default Comunidade;
