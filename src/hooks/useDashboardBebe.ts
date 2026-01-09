import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useVaccination } from "@/hooks/useVaccination";
import { logger } from "@/lib/logger";

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

interface UseDashboardBebeReturn {
  loading: boolean;
  lastFeeding: FeedingLog | null;
  lastSleep: SleepLog | null;
  feedingLogs24h: FeedingLog[];
  sleepLogs24h: SleepLog[];
  alerts: string[];
  selectedBabyId: string;
  setSelectedBabyId: (id: string) => void;
  babyProfiles: Array<{ id: string; baby_name: string }>;
  stats: {
    totalFeedingTime: number;
    totalSleepTime: number;
    averageSleepDuration: number;
  };
  reload: () => Promise<void>;
}

export const useDashboardBebe = (): UseDashboardBebeReturn => {
  const [loading, setLoading] = useState(true);
  const [lastFeeding, setLastFeeding] = useState<FeedingLog | null>(null);
  const [lastSleep, setLastSleep] = useState<SleepLog | null>(null);
  const [feedingLogs24h, setFeedingLogs24h] = useState<FeedingLog[]>([]);
  const [sleepLogs24h, setSleepLogs24h] = useState<SleepLog[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string>("");
  const { profiles: babyProfiles } = useVaccination();

  const generateAlerts = useCallback((lastFeed: FeedingLog | null, lastSleepData: SleepLog | null) => {
    const newAlerts: string[] = [];
    const now = new Date();

    if (lastFeed) {
      const timeSinceFeeding = now.getTime() - new Date(lastFeed.start_time).getTime();
      const hoursSinceFeeding = timeSinceFeeding / (1000 * 60 * 60);
      if (hoursSinceFeeding >= 3.5) {
        newAlerts.push("🍼 Bebê pode estar com fome - última mamada há mais de 3h30");
      }
    }

    if (lastSleepData?.sleep_end) {
      const timeSinceWakeup = now.getTime() - new Date(lastSleepData.sleep_end).getTime();
      const hoursSinceWakeup = timeSinceWakeup / (1000 * 60 * 60);
      if (hoursSinceWakeup >= 2.25) {
        newAlerts.push("💤 Hora da soneca - bebê acordado há mais de 2h15");
      }
    }

    setAlerts(newAlerts);
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Otimização: queries paralelas com select específico
      const [lastFeedResult, lastSleepResult, feeds24hResult, sleeps24hResult] = await Promise.all([
        supabase
          .from("baby_feeding_logs")
          .select("id, start_time, feeding_type, breast_side, volume_ml, duration_minutes")
          .eq("user_id", user.id)
          .order("start_time", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("baby_sleep_logs")
          .select("id, sleep_start, sleep_end, duration_minutes, sleep_type, wakeup_mood")
          .eq("user_id", user.id)
          .order("sleep_start", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("baby_feeding_logs")
          .select("id, start_time, feeding_type, breast_side, volume_ml, duration_minutes")
          .eq("user_id", user.id)
          .gte("start_time", yesterday.toISOString())
          .order("start_time", { ascending: false }),
        supabase
          .from("baby_sleep_logs")
          .select("id, sleep_start, sleep_end, duration_minutes, sleep_type, wakeup_mood")
          .eq("user_id", user.id)
          .gte("sleep_start", yesterday.toISOString())
          .order("sleep_start", { ascending: false })
      ]);

      setLastFeeding(lastFeedResult.data);
      setLastSleep(lastSleepResult.data);
      setFeedingLogs24h(feeds24hResult.data || []);
      setSleepLogs24h(sleeps24hResult.data || []);

      generateAlerts(lastFeedResult.data, lastSleepResult.data);
    } catch (error) {
      logger.error("Error loading dashboard data", error, { context: "useDashboardBebe" });
    } finally {
      setLoading(false);
    }
  }, [generateAlerts]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-select first baby profile
  useEffect(() => {
    if (babyProfiles.length > 0 && !selectedBabyId) {
      setSelectedBabyId(babyProfiles[0].id);
    }
  }, [babyProfiles, selectedBabyId]);

  // Cálculos memoizados para evitar recálculos desnecessários
  const stats = useMemo(() => {
    const totalFeedingTime = feedingLogs24h.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
    const totalSleepTime = sleepLogs24h.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
    const averageSleepDuration = sleepLogs24h.length > 0 
      ? Math.round(totalSleepTime / sleepLogs24h.length) 
      : 0;

    return { totalFeedingTime, totalSleepTime, averageSleepDuration };
  }, [feedingLogs24h, sleepLogs24h]);

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
    reload: loadDashboardData
  };
};
