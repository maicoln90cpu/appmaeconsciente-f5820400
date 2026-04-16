/**
 * @fileoverview Hook para dashboard consolidado do bebê
 * @module hooks/useDashboardBebe
 *
 * Provê dados agregados de alimentação, sono e alertas usando React Query
 */

import { useMemo, useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useVaccination } from '@/hooks/useVaccination';

import { logger } from '@/lib/logger';
import { QueryKeys, QueryCacheConfig } from '@/lib/query-config';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface FeedingLog {
  id: string;
  start_time: string;
  feeding_type: string;
  breast_side?: string;
  volume_ml?: number;
  duration_minutes?: number;
}

export interface SleepLog {
  id: string;
  sleep_start: string;
  sleep_end?: string;
  duration_minutes?: number;
  sleep_type: string;
  wakeup_mood?: string;
}

interface DashboardData {
  lastFeeding: FeedingLog | null;
  lastSleep: SleepLog | null;
  feedingLogs24h: FeedingLog[];
  sleepLogs24h: SleepLog[];
}

// Query key local para dashboard (dados agregados)
const dashboardQueryKey = (userId: string) => ['dashboard-bebe', userId] as const;

export const useDashboardBebe = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { profiles: babyProfiles, currentProfile, switchProfile } = useVaccination();

  // Derivar selectedBabyId do currentProfile
  const selectedBabyId = currentProfile?.id ?? '';
  const setSelectedBabyId = switchProfile;

  // Query principal com dados do dashboard
  const {
    data,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: user ? dashboardQueryKey(user.id) : ['dashboard-bebe'],
    queryFn: async (): Promise<DashboardData> => {
      if (!user) {
        return { lastFeeding: null, lastSleep: null, feedingLogs24h: [], sleepLogs24h: [] };
      }

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Queries paralelas para performance
      const [lastFeedResult, lastSleepResult, feeds24hResult, sleeps24hResult] = await Promise.all([
        supabase
          .from('baby_feeding_logs')
          .select('id, start_time, feeding_type, breast_side, volume_ml, duration_minutes')
          .eq('user_id', user.id)
          .order('start_time', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('baby_sleep_logs')
          .select('id, sleep_start, sleep_end, duration_minutes, sleep_type, wakeup_mood')
          .eq('user_id', user.id)
          .order('sleep_start', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('baby_feeding_logs')
          .select('id, start_time, feeding_type, breast_side, volume_ml, duration_minutes')
          .eq('user_id', user.id)
          .gte('start_time', yesterday.toISOString())
          .order('start_time', { ascending: false }),
        supabase
          .from('baby_sleep_logs')
          .select('id, sleep_start, sleep_end, duration_minutes, sleep_type, wakeup_mood')
          .eq('user_id', user.id)
          .gte('sleep_start', yesterday.toISOString())
          .order('sleep_start', { ascending: false }),
      ]);

      return {
        lastFeeding: lastFeedResult.data as FeedingLog | null,
        lastSleep: lastSleepResult.data as SleepLog | null,
        feedingLogs24h: (feeds24hResult.data || []) as FeedingLog[],
        sleepLogs24h: (sleeps24hResult.data || []) as SleepLog[],
      };
    },
    enabled: !!user,
    ...QueryCacheConfig.stats, // Cache de estatísticas
  });

  // Extrair dados do resultado
  const lastFeeding = data?.lastFeeding ?? null;
  const lastSleep = data?.lastSleep ?? null;
  const feedingLogs24h = data?.feedingLogs24h ?? [];
  const sleepLogs24h = data?.sleepLogs24h ?? [];

  // Gerar alertas baseado nos dados
  const alerts = useMemo(() => {
    const newAlerts: string[] = [];
    const now = new Date();

    if (lastFeeding) {
      const timeSinceFeeding = now.getTime() - new Date(lastFeeding.start_time).getTime();
      const hoursSinceFeeding = timeSinceFeeding / (1000 * 60 * 60);
      if (hoursSinceFeeding >= 3.5) {
        newAlerts.push('🍼 Bebê pode estar com fome - última mamada há mais de 3h30');
      }
    }

    if (lastSleep?.sleep_end) {
      const timeSinceWakeup = now.getTime() - new Date(lastSleep.sleep_end).getTime();
      const hoursSinceWakeup = timeSinceWakeup / (1000 * 60 * 60);
      if (hoursSinceWakeup >= 2.25) {
        newAlerts.push('💤 Hora da soneca - bebê acordado há mais de 2h15');
      }
    }

    return newAlerts;
  }, [lastFeeding, lastSleep]);

  // Cálculos memoizados para evitar recálculos desnecessários
  const stats = useMemo(() => {
    const totalFeedingTime = feedingLogs24h.reduce(
      (sum, log) => sum + (log.duration_minutes || 0),
      0
    );
    const totalSleepTime = sleepLogs24h.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
    const averageSleepDuration =
      sleepLogs24h.length > 0 ? Math.round(totalSleepTime / sleepLogs24h.length) : 0;

    return { totalFeedingTime, totalSleepTime, averageSleepDuration };
  }, [feedingLogs24h, sleepLogs24h]);

  // Reload function
  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    loading,
    lastFeeding,
    lastSleep,
    feedingLogs24h,
    sleepLogs24h,
    alerts,
    selectedBabyId,
    setSelectedBabyId,
    babyProfiles,
    stats,
    reload,
  };
};
