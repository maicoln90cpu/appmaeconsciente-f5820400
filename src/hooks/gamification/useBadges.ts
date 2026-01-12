/**
 * @fileoverview Hook para gerenciamento de badges/conquistas
 * @module hooks/gamification/useBadges
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useUserLevel } from "./useUserLevel";

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
    queryKey: ['badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as Badge[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Buscar badges do usuário
  const { data: userBadges = [], isLoading: loadingUserBadges } = useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_badges')
        .select(`*, badge:badges(*)`)
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserBadge[];
    },
    enabled: !!user,
  });

  // Badges por categoria (memoizado)
  const badgesByCategory = useMemo(() => ({
    contributor: allBadges.filter(b => b.category === 'contributor'),
    mentor: allBadges.filter(b => b.category === 'mentor'),
    consistent: allBadges.filter(b => b.category === 'consistent'),
    explorer: allBadges.filter(b => b.category === 'explorer'),
  }), [allBadges]);

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
    onSuccess: (data) => {
      if (data?.badge) {
        queryClient.invalidateQueries({ queryKey: ['user-badges'] });
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
