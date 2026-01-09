import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

type FavoriteType = 'recipe' | 'exercise';

interface FavoriteItem {
  item_id: string;
  notes: string | null;
}

interface UseFavoritesReturn {
  favorites: Set<string>;
  favoriteNotes: Map<string, string | null>;
  loading: boolean;
  toggleFavorite: (itemId: string, itemType: FavoriteType) => Promise<void>;
  isFavorite: (itemId: string) => boolean;
  updateNotes: (itemId: string, notes: string) => Promise<void>;
  getNotes: (itemId: string) => string | null;
}

export function useFavorites(itemType: FavoriteType): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoriteNotes, setFavoriteNotes] = useState<Map<string, string | null>>(new Map());
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
        .select('item_id, notes')
        .eq('user_id', user.id)
        .eq('item_type', itemType);

      if (error) throw error;

      const items = data || [];
      setFavorites(new Set(items.map(f => f.item_id)));
      setFavoriteNotes(new Map(items.map(f => [f.item_id, f.notes])));
    } catch (error) {
      logger.error("Erro ao carregar favoritos", error, { context: "useFavorites" });
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
      logger.error("Erro ao favoritar", error, { context: "useFavorites" });
      toast.error('Erro ao atualizar favoritos');
    }
  };

  const isFavorite = (itemId: string) => favorites.has(itemId);

  const updateNotes = async (itemId: string, notes: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar logado');
        return;
      }

      const { error } = await supabase
        .from('user_favorites')
        .update({ notes })
        .eq('user_id', user.id)
        .eq('item_type', itemType)
        .eq('item_id', itemId);

      if (error) throw error;

      setFavoriteNotes(prev => new Map(prev).set(itemId, notes));
      toast.success('Nota atualizada com sucesso');
    } catch (error) {
      logger.error("Erro ao atualizar nota", error, { context: "useFavorites" });
      toast.error('Erro ao atualizar nota');
    }
  };

  const getNotes = (itemId: string) => favoriteNotes.get(itemId) || null;

  return { favorites, favoriteNotes, loading, toggleFavorite, isFavorite, updateNotes, getNotes };
}
