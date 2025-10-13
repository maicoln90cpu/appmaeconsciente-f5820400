import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const PostModeration = () => {
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id (email, foto_perfil_url)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Post deletado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao deletar post");
    },
  });

  if (isLoading) {
    return <div>Carregando posts...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Moderação de Posts</h2>
      <div className="grid gap-4">
        {posts?.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">
                    {(post.profiles as any)?.email || "Usuário desconhecido"}
                  </CardTitle>
                  <Badge variant="outline">
                    {format(new Date(post.created_at), "dd/MM/yyyy HH:mm")}
                  </Badge>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate(post.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">{post.content}</p>
              {post.image_urls && post.image_urls.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {post.image_urls.map((url: string, idx: number) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Post image ${idx + 1}`}
                      className="h-20 w-20 object-cover rounded"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
