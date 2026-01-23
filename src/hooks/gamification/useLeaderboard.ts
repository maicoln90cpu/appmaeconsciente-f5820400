/**
 * @fileoverview Hook para gerenciamento do leaderboard/ranking
 * @module hooks/gamification/useLeaderboard
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { QueryKeys, QueryCacheConfig } from "@/lib/query-config";

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  xp_total: number;
  level: number;
  max_streak: number;
  badges_count: number;
  weekly_xp: number;
  rank_position: number;
}

export const useLeaderboard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Buscar leaderboard
  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useQuery({
    queryKey: QueryKeys.leaderboard(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leaderboard_cache')
        .select('user_id, display_name, xp_total, level, max_streak, badges_count, weekly_xp, rank_position')
        .order('rank_position');

      if (error) throw error;
      return data as LeaderboardEntry[];
    },
    staleTime: QueryCacheConfig.dynamic.staleTime,
    gcTime: QueryCacheConfig.dynamic.gcTime,
  });

  const optInQueryKey = QueryKeys.leaderboardOptIn(user?.id ?? '');

  // Buscar configuração de opt-in do leaderboard
  const { data: leaderboardOptIn = false } = useQuery({
    queryKey: optInQueryKey,
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('leaderboard_opt_in')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data?.leaderboard_opt_in ?? false;
    },
    enabled: !!user,
    staleTime: QueryCacheConfig.user.staleTime,
    gcTime: QueryCacheConfig.user.gcTime,
  });

  // Posição do usuário no leaderboard
  const userRank = leaderboard.find(e => e.user_id === user?.id)?.rank_position;

  // Mutation para alternar opt-in do leaderboard
  const toggleOptInMutation = useMutation({
    mutationFn: async (optIn: boolean) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ leaderboard_opt_in: optIn })
        .eq('id', user.id);

      if (error) throw error;
      return optIn;
    },
    onSuccess: (optIn) => {
      queryClient.invalidateQueries({ queryKey: optInQueryKey });
      toast.success(optIn 
        ? 'Você agora aparece no ranking!' 
        : 'Você foi removido do ranking'
      );
    },
  });

  return {
    leaderboard,
    leaderboardOptIn,
    userRank,
    toggleLeaderboardOptIn: toggleOptInMutation.mutate,
    isLoading: loadingLeaderboard,
  };
};
