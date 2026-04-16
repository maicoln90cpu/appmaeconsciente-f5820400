/**
 * @fileoverview Hook para rastrear login diário e streaks
 * @module hooks/useDailyLogin
 */

import { useEffect, useRef } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays, parseISO } from 'date-fns';

import { useGamification, XP_REWARDS } from '@/hooks/useGamification';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';


export interface DailyLoginData {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_login_date: string | null;
  total_logins: number;
}

const STREAK_XP_BONUSES: Record<number, number> = {
  7: 50,
  14: 100,
  30: 250,
  60: 500,
  90: 1000,
};

export const useDailyLogin = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { addXP } = useGamification();

  // Fetch daily login data
  const { data: loginData, isLoading } = useQuery({
    queryKey: ['daily-login', user?.id],
    queryFn: async (): Promise<DailyLoginData | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_streaks')
        .select('id, user_id, streak_type, current_streak, longest_streak, last_activity_date')
        .eq('user_id', user.id)
        .eq('streak_type', 'daily_login')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return {
          id: '',
          user_id: user.id,
          current_streak: 0,
          longest_streak: 0,
          last_login_date: null,
          total_logins: 0,
        };
      }

      return {
        id: data.id,
        user_id: data.user_id,
        current_streak: data.current_streak,
        longest_streak: data.longest_streak,
        last_login_date: data.last_activity_date,
        total_logins: data.current_streak, // Using current_streak as proxy
      };
    },
    enabled: !!user,
    staleTime: 60000,
  });

  // Record daily login
  const recordLogin = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const today = format(new Date(), 'yyyy-MM-dd');

      // Get current streak data
      const { data: existing } = await supabase
        .from('user_streaks')
        .select('id, current_streak, longest_streak, last_activity_date')
        .eq('user_id', user.id)
        .eq('streak_type', 'daily_login')
        .maybeSingle();

      if (existing?.last_activity_date === today) {
        // Already logged today
        return { alreadyLogged: true, streak: existing.current_streak };
      }

      let newStreak = 1;
      let longestStreak = 1;

      if (existing?.last_activity_date) {
        const daysDiff = differenceInDays(new Date(today), parseISO(existing.last_activity_date));

        if (daysDiff === 1) {
          // Consecutive day
          newStreak = existing.current_streak + 1;
        }
        longestStreak = Math.max(newStreak, existing.longest_streak);
      }

      const { error } = await supabase.from('user_streaks').upsert(
        {
          user_id: user.id,
          streak_type: 'daily_login',
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_activity_date: today,
        },
        { onConflict: 'user_id,streak_type' }
      );

      if (error) throw error;

      return {
        alreadyLogged: false,
        streak: newStreak,
        isNewRecord: newStreak > (existing?.longest_streak || 0),
      };
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['daily-login'] });
      queryClient.invalidateQueries({ queryKey: ['user-streaks'] });

      if (!data.alreadyLogged) {
        // Give XP for daily login
        addXP({ amount: 5, actionType: 'daily_login' });

        // Check for streak bonuses
        const bonusXP = STREAK_XP_BONUSES[data.streak];
        if (bonusXP) {
          addXP({ amount: bonusXP, actionType: `streak_${data.streak}` });
        }
      }
    },
  });

  // Auto-record login on mount (with ref guard to prevent double-fire in StrictMode)
  const hasRecordedRef = useRef(false);
  useEffect(() => {
    if (user && !isLoading) {
      const today = format(new Date(), 'yyyy-MM-dd');
      if (loginData?.last_login_date !== today && !hasRecordedRef.current) {
        hasRecordedRef.current = true;
        recordLogin.mutate();
      }
    }
  }, [user, isLoading, loginData?.last_login_date]);

  return {
    loginData,
    isLoading,
    currentStreak: loginData?.current_streak || 0,
    longestStreak: loginData?.longest_streak || 0,
    recordLogin: recordLogin.mutate,
    isRecording: recordLogin.isPending,
  };
};
