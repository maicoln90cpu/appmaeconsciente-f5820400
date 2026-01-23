/**
 * @fileoverview Hook para gerenciamento de atividade diária e calendário
 * @module hooks/gamification/useDailyActivity
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { QueryKeys, QueryCacheConfig } from "@/lib/query-config";

export interface DailyActivity {
  activity_date: string;
  posts_count: number;
  comments_count: number;
  likes_count: number;
  sleep_logs_count: number;
  feeding_logs_count: number;
  total_xp_earned: number;
}

export interface ActivityCalendarDay {
  date: string;
  totalXP: number;
  hasActivity: boolean;
  level: number;
}

// Helper para determinar nível de atividade (0-4) para cores do calendário
function getActivityLevel(xp: number): number {
  if (xp === 0) return 0;
  if (xp < 20) return 1;
  if (xp < 50) return 2;
  if (xp < 100) return 3;
  return 4;
}

export const useDailyActivity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const queryKey = QueryKeys.dailyActivity(user?.id ?? '');

  // Buscar atividade diária (últimos 90 dias para calendário)
  const { data: dailyActivity = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      
      const startDate = format(subDays(new Date(), 90), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('daily_activity')
        .select('activity_date, posts_count, comments_count, likes_count, sleep_logs_count, feeding_logs_count, total_xp_earned')
        .eq('user_id', user.id)
        .gte('activity_date', startDate)
        .order('activity_date', { ascending: false });

      if (error) throw error;
      return data as DailyActivity[];
    },
    enabled: !!user,
    staleTime: QueryCacheConfig.stats.staleTime,
    gcTime: QueryCacheConfig.stats.gcTime,
  });

  // Gerar dados para o calendário de atividade (memoizado)
  const activityCalendar = useMemo((): ActivityCalendarDay[] => {
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
  }, [dailyActivity]);

  // Mutation para registrar atividade diária
  const recordActivityMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    dailyActivity,
    activityCalendar,
    recordDailyActivity: recordActivityMutation.mutate,
    isLoading,
  };
};
