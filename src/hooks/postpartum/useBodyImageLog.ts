import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getAuthenticatedUser } from '@/hooks/useAuthenticatedAction';

import { supabase } from '@/integrations/supabase/client';

export interface BodyImageLog {
  id: string;
  user_id: string;
  date: string;
  notes: string | null;
  photo_url: string | null;
  title: string | null;
  mood: 'positive' | 'neutral' | 'challenging' | null;
  privacy: 'private' | 'partner' | 'community';
  created_at: string;
  updated_at: string;
}

export const useBodyImageLog = () => {
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['body-image-logs'],
    queryFn: async () => {
      const userId = await getAuthenticatedUser();

      const { data, error } = await supabase
        .from('body_image_log')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as BodyImageLog[];
    },
  });

  const addLog = useMutation({
    mutationFn: async (log: {
      date: string;
      title?: string;
      notes?: string;
      photo?: File;
      mood?: 'positive' | 'neutral' | 'challenging';
      privacy?: 'private' | 'partner' | 'community';
    }) => {
      const userId = await getAuthenticatedUser();

      let photo_url = null;

      // Upload foto se fornecida
      if (log.photo) {
        const fileExt = log.photo.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('body-image-photos')
          .upload(fileName, log.photo);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('body-image-photos').getPublicUrl(fileName);

        photo_url = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('body_image_log')
        .insert({
          user_id: userId,
          date: log.date,
          title: log.title || null,
          notes: log.notes || null,
          photo_url,
          mood: log.mood || null,
          privacy: log.privacy || 'private',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-image-logs'] });
      toast('💕 Sucesso', { description: 'Registro de autoestima salvo' });
    },
    onError: () => {
      toast.error('Erro', { description: 'Erro ao salvar registro' });
    },
  });

  const updateLog = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BodyImageLog> & { id: string }) => {
      const { data, error } = await supabase
        .from('body_image_log')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-image-logs'] });
      toast('Sucesso', { description: 'Registro atualizado' });
    },
  });

  const deleteLog = useMutation({
    mutationFn: async (id: string) => {
      const userId = await getAuthenticatedUser();

      // Buscar log para deletar foto se existir
      const { data: log } = await supabase
        .from('body_image_log')
        .select('photo_url')
        .eq('id', id)
        .single();

      if (log?.photo_url) {
        const fileName = log.photo_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('body-image-photos').remove([`${userId}/${fileName}`]);
        }
      }

      const { error } = await supabase.from('body_image_log').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-image-logs'] });
      toast('Sucesso', { description: 'Registro removido' });
    },
  });

  return {
    logs,
    isLoading,
    addLog: addLog.mutate,
    updateLog: updateLog.mutate,
    deleteLog: deleteLog.mutate,
  };
};
