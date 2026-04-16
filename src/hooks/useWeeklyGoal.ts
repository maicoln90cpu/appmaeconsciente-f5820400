/**
 * @fileoverview Hook para gerenciar metas semanais
 * @module hooks/useWeeklyGoal
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/hooks/useGamification';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface WeeklyGoalData {
  activeDays: number;
  targetDays: number;
  totalXPThisWeek: number;
  daysWithActivity: string[];
  goalCompleted: boolean;
  rewardClaimed: boolean;
}

const WEEKLY_GOAL_REWARD_XP = 100;
const DEFAULT_TARGET_DAYS = 5;

export const useWeeklyGoal = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { addXP, dailyActivity } = useGamification();

  // Calculate weekly goal data
  const { data: weeklyData, isLoading } = useQuery({
    queryKey: ['weekly-goal', user?.id],
    queryFn: async (): Promise<WeeklyGoalData> => {
      if (!user) {
        return {
          activeDays: 0,
          targetDays: DEFAULT_TARGET_DAYS,
          totalXPThisWeek: 0,
          daysWithActivity: [],
          goalCompleted: false,
          rewardClaimed: false,
        };
      }

      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

      // Fetch activity for this week
      const { data: activities, error } = await supabase
        .from('daily_activity')
        .select('activity_date, total_xp_earned')
        .eq('user_id', user.id)
        .gte('activity_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('activity_date', format(weekEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      const daysWithActivity = activities?.map(a => a.activity_date) || [];
      const activeDays = daysWithActivity.length;
      const totalXPThisWeek =
        activities?.reduce((acc, a) => acc + (a.total_xp_earned || 0), 0) || 0;

      // Check if reward was claimed this week
      const { data: claimData } = await supabase
        .from('user_streaks')
        .select('id, user_id, streak_type, current_streak, longest_streak, last_activity_date')
        .eq('user_id', user.id)
        .eq('streak_type', 'weekly_goal')
        .maybeSingle();

      const lastClaimDate = claimData?.last_activity_date;
      const rewardClaimed = lastClaimDate ? new Date(lastClaimDate) >= weekStart : false;

      return {
        activeDays,
        targetDays: DEFAULT_TARGET_DAYS,
        totalXPThisWeek,
        daysWithActivity,
        goalCompleted: activeDays >= DEFAULT_TARGET_DAYS,
        rewardClaimed,
      };
    },
    enabled: !!user,
    staleTime: 60000,
  });

  // Claim weekly reward
  const claimReward = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (!weeklyData?.goalCompleted) throw new Error('Goal not completed');
      if (weeklyData?.rewardClaimed) throw new Error('Already claimed');

      const today = format(new Date(), 'yyyy-MM-dd');

      // Record claim in streaks table
      const { error } = await supabase.from('user_streaks').upsert(
        {
          user_id: user.id,
          streak_type: 'weekly_goal',
          current_streak: weeklyData?.activeDays || 0,
          longest_streak: Math.max(weeklyData?.activeDays || 0, 0),
          last_activity_date: today,
        },
        { onConflict: 'user_id,streak_type' }
      );

      if (error) throw error;

      return WEEKLY_GOAL_REWARD_XP;
    },
    onSuccess: xpReward => {
      queryClient.invalidateQueries({ queryKey: ['weekly-goal'] });
      addXP({ amount: xpReward, actionType: 'weekly_goal_completed' });
    },
  });

  // Get progress percentage
  const progressPercentage = weeklyData
    ? Math.min((weeklyData.activeDays / weeklyData.targetDays) * 100, 100)
    : 0;

  // Get days of the week with status
  const weekDays = (() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return days.map(day => ({
      date: format(day, 'yyyy-MM-dd'),
      dayName: format(day, 'EEE', { locale: ptBR }),
      isToday: format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
      hasActivity: weeklyData?.daysWithActivity.includes(format(day, 'yyyy-MM-dd')) || false,
      isFuture: day > today,
    }));
  })();

  return {
    weeklyData,
    isLoading,
    activeDays: weeklyData?.activeDays || 0,
    targetDays: weeklyData?.targetDays || DEFAULT_TARGET_DAYS,
    totalXPThisWeek: weeklyData?.totalXPThisWeek || 0,
    goalCompleted: weeklyData?.goalCompleted || false,
    rewardClaimed: weeklyData?.rewardClaimed || false,
    progressPercentage,
    weekDays,
    claimReward: claimReward.mutate,
    isClaiming: claimReward.isPending,
    WEEKLY_GOAL_REWARD_XP,
  };
};
