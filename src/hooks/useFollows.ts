import { useState, useEffect, useCallback } from 'react';

import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';

export const useFollows = (userId?: string) => {
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadFollows = useCallback(async () => {
    if (!userId) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Obter followers
      const { data: followersData } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', userId);

      // Obter following
      const { data: followingData } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

      setFollowers(followersData?.map(f => f.follower_id) || []);
      setFollowing(followingData?.map(f => f.following_id) || []);

      // Verificar if current user follows this user
      if (user) {
        const { data } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .maybeSingle();

        setIsFollowing(!!data);
      }
    } catch (error) {
      console.error('Error loading follows:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadFollows();
    }
  }, [userId, loadFollows]);

  const toggleFollow = async (targetUserId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Faça login', {
          description: 'Você precisa estar logado para seguir usuários',
        });
        return;
      }

      if (isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        toast('Deixou de seguir');
      } else {
        await supabase.from('user_follows').insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

        toast('Seguindo!');
      }

      await loadFollows();
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast.error('Erro', { description: error.message });
    }
  };

  return {
    followers,
    following,
    isFollowing,
    loading,
    toggleFollow,
    followersCount: followers.length,
    followingCount: following.length,
  };
};
