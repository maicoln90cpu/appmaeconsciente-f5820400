import { useState, useMemo } from "react";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import { usePosts } from "@/hooks/usePosts";
import { CreatePostDialog } from "@/components/comunidade/CreatePostDialog";
import { PostCard } from "@/components/comunidade/PostCard";
import { PostFilters } from "@/components/comunidade/PostFilters";
import { ChallengesPanel } from "@/components/comunidade/ChallengesPanel";
import { Leaderboard } from "@/components/gamification";
import { InstallPrompt } from "@/components/install/InstallPrompt";
import { LoadingCards } from "@/components/ui/loading-card";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageSquare, Trophy, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Comunidade = () => {
  const { posts, loading, createPost, deletePost, toggleLike } = usePosts();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return posts.filter((post) => {
      const matchesSearch = searchQuery
        ? post.content.toLowerCase().includes(searchLower)
        : true;
      const matchesCategory = selectedCategory
        ? post.categoria === selectedCategory
        : true;
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Comunidade</h1>
          <p className="text-muted-foreground">
            Compartilhe sua jornada e conecte-se com outras mães
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content - Posts */}
          <div className="lg:col-span-2">
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
          </div>

          {/* Sidebar - Gamification */}
          <div className="space-y-6">
            <Tabs defaultValue="challenges" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="challenges" className="gap-2">
                  <Target className="h-4 w-4" />
                  Desafios
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="gap-2">
                  <Trophy className="h-4 w-4" />
                  Ranking
                </TabsTrigger>
              </TabsList>
              <TabsContent value="challenges" className="mt-4">
                <ChallengesPanel />
              </TabsContent>
              <TabsContent value="leaderboard" className="mt-4">
                <Leaderboard />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <CreatePostDialog onPostCreated={createPost} />
        <InstallPrompt />
      </div>
    </div>
  );
};

export default Comunidade;
