/**
 * @fileoverview Hook para gerenciar imagens de ultrassom
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface UltrasoundImage {
  id: string;
  user_id: string;
  image_url: string;
  gestational_week: number;
  ultrasound_date: string;
  ultrasound_type: string;
  notes: string | null;
  baby_weight_grams: number | null;
  baby_length_cm: number | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface UltrasoundInput {
  image_url: string;
  gestational_week: number;
  ultrasound_date: string;
  ultrasound_type?: string;
  notes?: string;
  baby_weight_grams?: number;
  baby_length_cm?: number;
  is_favorite?: boolean;
}

export const useUltrasounds = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Buscar all ultrasounds
  const { data: ultrasounds = [], isLoading } = useQuery({
    queryKey: ['ultrasounds', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('ultrasound_images')
        .select(
          'id, user_id, image_url, gestational_week, ultrasound_date, ultrasound_type, notes, baby_weight_grams, baby_length_cm, is_favorite, created_at, updated_at'
        )
        .eq('user_id', user.id)
        .order('gestational_week', { ascending: true });

      if (error) throw error;
      return data as UltrasoundImage[];
    },
    enabled: !!user,
  });

  // Upload image to storage
  const uploadImage = async (file: File): Promise<string> => {
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('ultrasounds')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('ultrasounds').getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  // Adicionar ultrasound
  const addUltrasound = useMutation({
    mutationFn: async (input: UltrasoundInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ultrasound_images')
        .insert({
          user_id: user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ultrasounds'] });
      toast.success('Ultrassom adicionado com sucesso!');
    },
    onError: error => {
      console.error('Error adding ultrasound:', error);
      toast.error('Erro ao adicionar ultrassom');
    },
  });

  // Atualizar ultrasound
  const updateUltrasound = useMutation({
    mutationFn: async ({ id, ...input }: Partial<UltrasoundInput> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ultrasound_images')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ultrasounds'] });
      toast.success('Ultrassom atualizado!');
    },
  });

  // Deletar ultrasound
  const deleteUltrasound = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      // Obter the image URL to delete from storage
      const ultrasound = ultrasounds.find(u => u.id === id);

      const { error } = await supabase
        .from('ultrasound_images')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Tentar delete from storage (don't fail if this doesn't work)
      if (ultrasound?.image_url) {
        try {
          const path = ultrasound.image_url.split('/ultrasounds/')[1];
          if (path) {
            await supabase.storage.from('ultrasounds').remove([path]);
          }
        } catch (e) {
          console.warn('Could not delete image from storage:', e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ultrasounds'] });
      toast.success('Ultrassom removido!');
    },
  });

  // Alternar favorite
  const toggleFavorite = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const ultrasound = ultrasounds.find(u => u.id === id);
      if (!ultrasound) throw new Error('Ultrasound not found');

      const { data, error } = await supabase
        .from('ultrasound_images')
        .update({ is_favorite: !ultrasound.is_favorite })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ultrasounds'] });
    },
  });

  // Group by trimester
  const groupedByTrimester = {
    first: ultrasounds.filter(u => u.gestational_week <= 13),
    second: ultrasounds.filter(u => u.gestational_week > 13 && u.gestational_week <= 27),
    third: ultrasounds.filter(u => u.gestational_week > 27),
  };

  return {
    ultrasounds,
    isLoading,
    uploadImage,
    addUltrasound: addUltrasound.mutate,
    updateUltrasound: updateUltrasound.mutate,
    deleteUltrasound: deleteUltrasound.mutate,
    toggleFavorite: toggleFavorite.mutate,
    isAdding: addUltrasound.isPending,
    isUploading: addUltrasound.isPending,
    groupedByTrimester,
    favorites: ultrasounds.filter(u => u.is_favorite),
  };
};
