/**
 * @fileoverview Hook para gerenciamento de nível e XP do usuário
 * @module hooks/gamification/useUserLevel
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// XP rewards por ação
export const XP_REWARDS = {
  post_created: 15,
  comment_created: 5,
  like_given: 2,
  sleep_logged: 10,
  feeding_logged: 10,
  vaccine_logged: 20,
  milestone_logged: 25,
  challenge_completed: 50,
  streak_7: 100,
  streak_14: 200,
  streak_30: 500,
  onboarding_completed: 50,
} as const;

export interface UserLevel {
  level: number;
  xp_total: number;
  xp_for_current_level: number;
  xp_for_next_level: number;
  progress_percentage: number;
}

export const useUserLevel = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Buscar dados de nível do usuário
  const { data: levelData, isLoading } = useQuery({
    queryKey: ['user-level', user?.id],
    queryFn: async (): Promise<UserLevel | null> => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('xp_total, level')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const xpTotal = data.xp_total || 0;
      const level = data.level || 1;
      
      // Calcular XP para níveis
      const xpForCurrentLevel = Math.pow(level - 1, 2) * 50;
      const xpForNextLevel = Math.pow(level, 2) * 50;
      const xpInCurrentLevel = xpTotal - xpForCurrentLevel;
      const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
      const progressPercentage = Math.min((xpInCurrentLevel / xpNeededForLevel) * 100, 100);

      return {
        level,
        xp_total: xpTotal,
        xp_for_current_level: xpForCurrentLevel,
        xp_for_next_level: xpForNextLevel,
        progress_percentage: progressPercentage,
      };
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Mutation para adicionar XP
  const addXPMutation = useMutation({
    mutationFn: async ({ 
      amount, 
      actionType 
    }: { 
      amount: number; 
      actionType: keyof typeof XP_REWARDS | string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('add_user_xp', {
        p_user_id: user.id,
        p_xp_amount: amount,
        p_action_type: actionType,
      });

      if (error) throw error;
      return data?.[0];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-level'] });
      queryClient.invalidateQueries({ queryKey: ['daily-activity'] });
      
      if (data?.leveled_up) {
        toast.success(`🎉 Parabéns! Você subiu para o nível ${data.new_level}!`, {
          duration: 5000,
        });
      }
    },
  });

  return {
    levelData,
    isLoading,
    addXP: addXPMutation.mutate,
    addXPAsync: addXPMutation.mutateAsync,
    isAddingXP: addXPMutation.isPending,
    XP_REWARDS,
  };
};
