/**
 * @fileoverview Hook para gerenciamento de gamificação expandida
 * @module hooks/useGamification
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns";

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

export interface DailyActivity {
  activity_date: string;
  posts_count: number;
  comments_count: number;
  likes_count: number;
  sleep_logs_count: number;
  feeding_logs_count: number;
  total_xp_earned: number;
}

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

export const useGamification = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Buscar dados de nível do usuário
  const { data: levelData, isLoading: loadingLevel } = useQuery({
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

  // Buscar atividade diária (últimos 90 dias para calendário)
  const { data: dailyActivity = [], isLoading: loadingActivity } = useQuery({
    queryKey: ['daily-activity', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const startDate = format(subDays(new Date(), 90), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('daily_activity')
        .select('*')
        .eq('user_id', user.id)
        .gte('activity_date', startDate)
        .order('activity_date', { ascending: false });

      if (error) throw error;
      return data as DailyActivity[];
    },
    enabled: !!user,
  });

  // Buscar leaderboard
  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leaderboard_cache')
        .select('*')
        .order('rank_position');

      if (error) throw error;
      return data as LeaderboardEntry[];
    },
    staleTime: 60000,
  });

  // Buscar configuração de opt-in do leaderboard
  const { data: leaderboardOptIn = false } = useQuery({
    queryKey: ['leaderboard-opt-in', user?.id],
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
  });

  // Mutation para adicionar XP
  const addXP = useMutation({
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

  // Mutation para registrar atividade diária
  const recordDailyActivity = useMutation({
    mutationFn: async ({
      activityType,
      xpEarned,
    }: {
      activityType: 'post' | 'comment' | 'like' | 'sleep' | 'feeding';
      xpEarned: number;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const today = format(new Date(), 'yyyy-MM-dd');

      // Tentar inserir ou atualizar usando upsert
      const { data: existing } = await supabase
        .from('daily_activity')
        .select('id, posts_count, comments_count, likes_count, sleep_logs_count, feeding_logs_count, total_xp_earned')
        .eq('user_id', user.id)
        .eq('activity_date', today)
        .maybeSingle();

      const counts = {
        posts_count: existing?.posts_count || 0,
        comments_count: existing?.comments_count || 0,
        likes_count: existing?.likes_count || 0,
        sleep_logs_count: existing?.sleep_logs_count || 0,
        feeding_logs_count: existing?.feeding_logs_count || 0,
      };

      // Incrementar contagem apropriada
      if (activityType === 'post') counts.posts_count++;
      else if (activityType === 'comment') counts.comments_count++;
      else if (activityType === 'like') counts.likes_count++;
      else if (activityType === 'sleep') counts.sleep_logs_count++;
      else if (activityType === 'feeding') counts.feeding_logs_count++;

      const newTotalXP = (existing?.total_xp_earned || 0) + xpEarned;

      await supabase
        .from('daily_activity')
        .upsert({
          user_id: user.id,
          activity_date: today,
          ...counts,
          total_xp_earned: newTotalXP,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,activity_date' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-activity'] });
    },
  });

  // Mutation para alternar opt-in do leaderboard
  const toggleLeaderboardOptIn = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['leaderboard-opt-in'] });
      toast.success(optIn 
        ? 'Você agora aparece no ranking!' 
        : 'Você foi removido do ranking'
      );
    },
  });

  // Mutation para desbloquear badge
  const unlockBadge = useMutation({
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
          addXP.mutate({
            amount: data.badge.xp_reward,
            actionType: `badge_${data.badge.code}`,
          });
        }
      }
    },
  });

  // Gerar dados para o calendário de atividade (últimos 90 dias)
  const activityCalendar = (() => {
    const end = new Date();
    const start = subDays(end, 90);
    const days = eachDayOfInterval({ start, end });
    
    const activityMap = new Map(
      dailyActivity.map(a => [a.activity_date, a])
    );

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const activity = activityMap.get(dateStr);
      
      return {
        date: dateStr,
        totalXP: activity?.total_xp_earned || 0,
        hasActivity: !!activity,
        level: activity ? getActivityLevel(activity.total_xp_earned) : 0,
      };
    });
  })();

  // Badges por categoria
  const badgesByCategory = {
    contributor: allBadges.filter(b => b.category === 'contributor'),
    mentor: allBadges.filter(b => b.category === 'mentor'),
    consistent: allBadges.filter(b => b.category === 'consistent'),
    explorer: allBadges.filter(b => b.category === 'explorer'),
  };

  // Verificar se badge está desbloqueado
  const isBadgeUnlocked = (badgeCode: string) => {
    return userBadges.some(ub => ub.badge?.code === badgeCode);
  };

  // Posição do usuário no leaderboard
  const userRank = leaderboard.find(e => e.user_id === user?.id)?.rank_position;

  return {
    // Nível e XP
    levelData,
    addXP: addXP.mutate,
    
    // Badges
    allBadges,
    userBadges,
    badgesByCategory,
    isBadgeUnlocked,
    unlockBadge: unlockBadge.mutate,
    
    // Atividade
    dailyActivity,
    activityCalendar,
    recordDailyActivity: recordDailyActivity.mutate,
    
    // Leaderboard
    leaderboard,
    leaderboardOptIn,
    toggleLeaderboardOptIn: toggleLeaderboardOptIn.mutate,
    userRank,
    
    // Loading states
    isLoading: loadingLevel || loadingBadges || loadingUserBadges || loadingActivity || loadingLeaderboard,
    
    // Constantes
    XP_REWARDS,
  };
};

// Helper para determinar nível de atividade (0-4) para cores do calendário
function getActivityLevel(xp: number): number {
  if (xp === 0) return 0;
  if (xp < 20) return 1;
  if (xp < 50) return 2;
  if (xp < 100) return 3;
  return 4;
}
