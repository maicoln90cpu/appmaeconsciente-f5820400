import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type FavoriteType = 'recipe' | 'exercise';

interface UseFavoritesReturn {
  favorites: Set<string>;
  loading: boolean;
  toggleFavorite: (itemId: string, itemType: FavoriteType) => Promise<void>;
  isFavorite: (itemId: string) => boolean;
}

export function useFavorites(itemType: FavoriteType): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, [itemType]);

  const loadFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_favorites')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('item_type', itemType);

      if (error) throw error;

      setFavorites(new Set(data?.map(f => f.item_id) || []));
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (itemId: string, type: FavoriteType) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar logado para favoritar');
        return;
      }

      const isFav = favorites.has(itemId);

      if (isFav) {
        // Remove favorite
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', type)
          .eq('item_id', itemId);

        if (error) throw error;

        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
        toast.success('Removido dos favoritos');
      } else {
        // Add favorite
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            item_type: type,
            item_id: itemId
          });

        if (error) throw error;

        setFavorites(prev => new Set([...prev, itemId]));
        toast.success('Adicionado aos favoritos');
      }
    } catch (error) {
      console.error('Erro ao favoritar:', error);
      toast.error('Erro ao atualizar favoritos');
    }
  };

  const isFavorite = (itemId: string) => favorites.has(itemId);

  return { favorites, loading, toggleFavorite, isFavorite };
}
