import { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Trash2, Eye, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { supabase } from '@/integrations/supabase/client';


export const PostModeration = () => {
  const queryClient = useQueryClient();
  const [isSeeding, setIsSeeding] = useState(false);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      // Passo 1: Buscar posts
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(
          'id, user_id, content, categoria, display_name, image_urls, is_hidden, moderation_status, tags, created_at, updated_at'
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!postsData) return [];

      // Passo 2: Enriquecer com perfis
      const enrichedPosts = await Promise.all(
        postsData.map(async post => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, foto_perfil_url')
            .eq('id', post.user_id)
            .maybeSingle();

          return {
            ...post,
            profiles: profile || { email: 'Usuário desconhecido', foto_perfil_url: null },
          };
        })
      );

      return enrichedPosts;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      toast.success('Post deletado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao deletar post');
    },
  });

  const handleSeedCommunity = async () => {
    try {
      setIsSeeding(true);
      toast.loading('Povoando comunidade...');

      const { data, error } = await supabase.functions.invoke('seed-community');

      if (error) throw error;

      toast.dismiss();
      toast.success(
        `Comunidade povoada! ${data.profiles_created || 0} perfis, ${data.posts_created || 0} posts, ${data.comments_created || 0} comentários`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Erro ao povoar comunidade: ${error.message}`);
      console.error('Erro:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  if (isLoading) {
    return <div>Carregando posts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Moderação de Posts</h2>
        <Button
          onClick={handleSeedCommunity}
          disabled={isSeeding}
          variant="default"
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Povoar Comunidade
        </Button>
      </div>
      <div className="grid gap-4">
        {posts?.map(post => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">
                    {(post.profiles as any)?.email || 'Usuário desconhecido'}
                  </CardTitle>
                  <Badge variant="outline">
                    {format(new Date(post.created_at), 'dd/MM/yyyy HH:mm')}
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
