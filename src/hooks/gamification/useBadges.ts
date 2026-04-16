/**
 * @fileoverview Hook para gerenciamento de badges/conquistas
 * @module hooks/gamification/useBadges
 */

import { useMemo } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { QueryKeys, QueryCacheConfig } from '@/lib/query-config';

import { useUserLevel } from './useUserLevel';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'contributor' | 'mentor' | 'consistent' | 'explorer';
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  display_order: number;
}

export interface UserBadge {
  id: string;
  badge_id: string;
  unlocked_at: string;
  badge?: Badge;
}

export const useBadges = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { addXP } = useUserLevel();

  // Buscar badges disponíveis
  const { data: allBadges = [], isLoading: loadingBadges } = useQuery({
    queryKey: QueryKeys.badges(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select(
          'id, code, name, description, icon, category, requirement_type, requirement_value, xp_reward, display_order'
        )
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as Badge[];
    },
    staleTime: QueryCacheConfig.reference.staleTime,
    gcTime: QueryCacheConfig.reference.gcTime,
  });

  const userBadgesQueryKey = QueryKeys.userBadges(user?.id ?? '');

  // Buscar badges do usuário
  const { data: userBadges = [], isLoading: loadingUserBadges } = useQuery({
    queryKey: userBadgesQueryKey,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_badges')
        .select(
          'id, user_id, badge_id, unlocked_at, badge:badges(id, code, name, description, icon, category, requirement_type, requirement_value, xp_reward, display_order)'
        )
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserBadge[];
    },
    enabled: !!user,
    staleTime: QueryCacheConfig.user.staleTime,
    gcTime: QueryCacheConfig.user.gcTime,
  });

  // Badges por categoria (memoizado)
  const badgesByCategory = useMemo(
    () => ({
      contributor: allBadges.filter(b => b.category === 'contributor'),
      mentor: allBadges.filter(b => b.category === 'mentor'),
      consistent: allBadges.filter(b => b.category === 'consistent'),
      explorer: allBadges.filter(b => b.category === 'explorer'),
    }),
    [allBadges]
  );

  // Verificar se badge está desbloqueado
  const isBadgeUnlocked = (badgeCode: string) => {
    return userBadges.some(ub => ub.badge?.code === badgeCode);
  };

  // Mutation para desbloquear badge
  const unlockBadgeMutation = useMutation({
    mutationFn: async (badgeId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_badges')
        .insert({ user_id: user.id, badge_id: badgeId })
        .select('*, badge:badges(*)')
        .single();

      if (error) {
        if (error.code === '23505') return null; // Já desbloqueado
        throw error;
      }
      return data;
    },
    onSuccess: data => {
      if (data?.badge) {
        queryClient.invalidateQueries({ queryKey: userBadgesQueryKey });
        toast.success(`🏆 Badge desbloqueado: ${data.badge.name}!`, {
          duration: 5000,
        });

        // Dar XP pela conquista
        if (data.badge.xp_reward > 0) {
          addXP({
            amount: data.badge.xp_reward,
            actionType: `badge_${data.badge.code}`,
          });
        }
      }
    },
  });

  return {
    allBadges,
    userBadges,
    badgesByCategory,
    isBadgeUnlocked,
    unlockBadge: unlockBadgeMutation.mutate,
    isLoading: loadingBadges || loadingUserBadges,
  };
};
