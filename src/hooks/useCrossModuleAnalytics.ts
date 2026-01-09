import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInHours, differenceInMinutes, subDays, startOfDay, format, parseISO } from "date-fns";

export interface FeedingSleepCorrelation {
  feedingTime: string;
  sleepStartTime: string;
  timeBetweenMinutes: number;
  sleepQuality: "good" | "average" | "poor";
  sleepDurationMinutes: number;
  feedingType: string;
}

export interface DailyPattern {
  date: string;
  totalFeedings: number;
  totalSleepMinutes: number;
  avgSleepQuality: number; // 0-100
  nightWakeups: number;
  colicEpisodes: number;
}

export interface Insight {
  id: string;
  type: "warning" | "suggestion" | "achievement" | "pattern";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action?: {
    label: string;
    path: string;
  };
  icon: string;
}

export interface CrossModuleStats {
  avgTimeBetweenFeedingAndSleep: number;
  bestFeedingTimeForSleep: string | null;
  sleepTrendLastWeek: "improving" | "declining" | "stable";
  feedingPattern: "regular" | "irregular";
  correlationStrength: number; // 0-100
}

export const useCrossModuleAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feedingLogs, setFeedingLogs] = useState<any[]>([]);
  const [sleepLogs, setSleepLogs] = useState<any[]>([]);
  const [colicLogs, setColicLogs] = useState<any[]>([]);
  const [emotionalLogs, setEmotionalLogs] = useState<any[]>([]);
  const [babyProfile, setBabyProfile] = useState<any>(null);

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();

      const [feedingResult, sleepResult, colicResult, emotionalResult, profileResult] = await Promise.all([
        supabase
          .from("baby_feeding_logs")
          .select("id, start_time, end_time, feeding_type, duration_minutes, volume_ml, breast_side")
          .eq("user_id", user.id)
          .gte("start_time", sevenDaysAgo)
          .order("start_time", { ascending: false }),
        supabase
          .from("baby_sleep_logs")
          .select("id, sleep_start, sleep_end, duration_minutes, sleep_type, wakeup_mood, location")
          .eq("user_id", user.id)
          .gte("sleep_start", sevenDaysAgo)
          .order("sleep_start", { ascending: false }),
        supabase
          .from("baby_colic_logs")
          .select("id, start_time, end_time, duration_minutes, intensity, triggers")
          .eq("user_id", user.id)
          .gte("start_time", sevenDaysAgo)
          .order("start_time", { ascending: false }),
        supabase
          .from("emotional_logs")
          .select("id, date, mood, edinburgh_score")
          .eq("user_id", user.id)
          .gte("date", sevenDaysAgo.split("T")[0])
          .order("date", { ascending: false }),
        supabase
          .from("baby_vaccination_profiles")
          .select("id, baby_name, birth_date, gender")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle()
      ]);

      setFeedingLogs(feedingResult.data || []);
      setSleepLogs(sleepResult.data || []);
      setColicLogs(colicResult.data || []);
      setEmotionalLogs(emotionalResult.data || []);
      setBabyProfile(profileResult.data);
    } catch (error) {
      console.error("Error loading cross-module data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calcula correlação entre alimentação e sono
  const correlations = useMemo((): FeedingSleepCorrelation[] => {
    const results: FeedingSleepCorrelation[] = [];

    sleepLogs.forEach((sleep) => {
      const sleepStart = new Date(sleep.sleep_start);
      
      // Encontra a última mamada antes desse sono
      const previousFeeding = feedingLogs.find((feeding) => {
        const feedingTime = new Date(feeding.start_time);
        const timeDiff = differenceInMinutes(sleepStart, feedingTime);
        return timeDiff > 0 && timeDiff < 180; // Dentro de 3 horas
      });

      if (previousFeeding) {
        const timeBetween = differenceInMinutes(sleepStart, new Date(previousFeeding.start_time));
        const sleepQuality = sleep.wakeup_mood === "happy" ? "good" 
          : sleep.wakeup_mood === "crying" ? "poor" : "average";

        results.push({
          feedingTime: previousFeeding.start_time,
          sleepStartTime: sleep.sleep_start,
          timeBetweenMinutes: timeBetween,
          sleepQuality,
          sleepDurationMinutes: sleep.duration_minutes || 0,
          feedingType: previousFeeding.feeding_type
        });
      }
    });

    return results;
  }, [feedingLogs, sleepLogs]);

  // Estatísticas cross-module
  const stats = useMemo((): CrossModuleStats => {
    if (correlations.length === 0) {
      return {
        avgTimeBetweenFeedingAndSleep: 0,
        bestFeedingTimeForSleep: null,
        sleepTrendLastWeek: "stable",
        feedingPattern: "irregular",
        correlationStrength: 0
      };
    }

    // Média de tempo entre alimentação e sono
    const avgTime = correlations.reduce((sum, c) => sum + c.timeBetweenMinutes, 0) / correlations.length;

    // Melhor horário para alimentar antes do sono
    const goodSleepCorrelations = correlations.filter(c => c.sleepQuality === "good");
    let bestTime: string | null = null;
    if (goodSleepCorrelations.length > 0) {
      const avgBestMinutes = goodSleepCorrelations.reduce((sum, c) => sum + c.timeBetweenMinutes, 0) / goodSleepCorrelations.length;
      bestTime = `${Math.floor(avgBestMinutes)} minutos`;
    }

    // Tendência de sono da última semana
    const sortedSleep = [...sleepLogs].sort((a, b) => 
      new Date(a.sleep_start).getTime() - new Date(b.sleep_start).getTime()
    );
    
    let sleepTrend: "improving" | "declining" | "stable" = "stable";
    if (sortedSleep.length >= 4) {
      const firstHalf = sortedSleep.slice(0, Math.floor(sortedSleep.length / 2));
      const secondHalf = sortedSleep.slice(Math.floor(sortedSleep.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / secondHalf.length;
      
      if (secondAvg > firstAvg * 1.1) sleepTrend = "improving";
      else if (secondAvg < firstAvg * 0.9) sleepTrend = "declining";
    }

    // Padrão de alimentação (regular ou irregular)
    const feedingIntervals: number[] = [];
    for (let i = 1; i < feedingLogs.length; i++) {
      const interval = differenceInMinutes(
        new Date(feedingLogs[i - 1].start_time),
        new Date(feedingLogs[i].start_time)
      );
      feedingIntervals.push(Math.abs(interval));
    }
    
    let feedingPattern: "regular" | "irregular" = "irregular";
    if (feedingIntervals.length >= 3) {
      const avg = feedingIntervals.reduce((a, b) => a + b, 0) / feedingIntervals.length;
      const variance = feedingIntervals.reduce((sum, i) => sum + Math.pow(i - avg, 2), 0) / feedingIntervals.length;
      const stdDev = Math.sqrt(variance);
      feedingPattern = stdDev < avg * 0.3 ? "regular" : "irregular";
    }

    // Força da correlação (baseada em consistência dos dados)
    const correlationStrength = Math.min(100, (correlations.length / 10) * 100);

    return {
      avgTimeBetweenFeedingAndSleep: Math.round(avgTime),
      bestFeedingTimeForSleep: bestTime,
      sleepTrendLastWeek: sleepTrend,
      feedingPattern,
      correlationStrength: Math.round(correlationStrength)
    };
  }, [correlations, sleepLogs, feedingLogs]);

  // Gera insights acionáveis baseados nos dados
  const insights = useMemo((): Insight[] => {
    const generatedInsights: Insight[] = [];
    const now = new Date();

    // 1. Alerta de alimentação
    if (feedingLogs.length > 0) {
      const lastFeeding = feedingLogs[0];
      const hoursSinceFeeding = differenceInHours(now, new Date(lastFeeding.start_time));
      
      if (hoursSinceFeeding >= 4) {
        generatedInsights.push({
          id: "feeding-overdue",
          type: "warning",
          priority: "high",
          title: "Hora de alimentar",
          description: `Última mamada foi há ${hoursSinceFeeding} horas. Seu bebê pode estar com fome.`,
          action: { label: "Registrar Mamada", path: "/materiais/rastreador-amamentacao" },
          icon: "🍼"
        });
      } else if (hoursSinceFeeding >= 3) {
        generatedInsights.push({
          id: "feeding-soon",
          type: "suggestion",
          priority: "medium",
          title: "Mamada em breve",
          description: `Última mamada foi há ${hoursSinceFeeding} horas. Considere alimentar em breve.`,
          icon: "⏰"
        });
      }
    }

    // 2. Alerta de sono baseado no último despertar
    if (sleepLogs.length > 0) {
      const lastSleep = sleepLogs[0];
      if (lastSleep.sleep_end) {
        const hoursSinceWake = differenceInHours(now, new Date(lastSleep.sleep_end));
        
        if (hoursSinceWake >= 3) {
          generatedInsights.push({
            id: "nap-overdue",
            type: "warning",
            priority: "high",
            title: "Bebê cansado",
            description: `Acordado há ${hoursSinceWake} horas. Sinais de cansaço podem aparecer.`,
            action: { label: "Registrar Sono", path: "/materiais/diario-sono" },
            icon: "💤"
          });
        } else if (hoursSinceWake >= 2) {
          generatedInsights.push({
            id: "nap-soon",
            type: "suggestion",
            priority: "medium",
            title: "Soneca se aproximando",
            description: `Bebê acordado há ${hoursSinceWake} horas. Observe sinais de sono.`,
            icon: "😴"
          });
        }
      }
    }

    // 3. Insight de correlação alimentação x sono
    if (stats.bestFeedingTimeForSleep && correlations.length >= 5) {
      generatedInsights.push({
        id: "feeding-sleep-pattern",
        type: "pattern",
        priority: "low",
        title: "Padrão descoberto",
        description: `Seu bebê dorme melhor quando alimentado ${stats.bestFeedingTimeForSleep} antes da soneca.`,
        icon: "🔍"
      });
    }

    // 4. Tendência de sono
    if (stats.sleepTrendLastWeek === "declining") {
      generatedInsights.push({
        id: "sleep-declining",
        type: "warning",
        priority: "medium",
        title: "Sono diminuindo",
        description: "O tempo de sono diminuiu na última semana. Considere revisar a rotina.",
        action: { label: "Ver Dicas de Sono", path: "/materiais/diario-sono" },
        icon: "📉"
      });
    } else if (stats.sleepTrendLastWeek === "improving") {
      generatedInsights.push({
        id: "sleep-improving",
        type: "achievement",
        priority: "low",
        title: "Sono melhorando! 🎉",
        description: "O bebê está dormindo mais esta semana. Continue assim!",
        icon: "📈"
      });
    }

    // 5. Padrão irregular de alimentação
    if (stats.feedingPattern === "irregular" && feedingLogs.length >= 5) {
      generatedInsights.push({
        id: "irregular-feeding",
        type: "suggestion",
        priority: "medium",
        title: "Horários variando",
        description: "Os horários de alimentação estão variando muito. Uma rotina pode ajudar.",
        icon: "⚡"
      });
    }

    // 6. Cólicas após alimentação (correlação)
    if (colicLogs.length > 0 && feedingLogs.length > 0) {
      let colicAfterFeeding = 0;
      colicLogs.forEach((colic) => {
        const colicStart = new Date(colic.start_time);
        const recentFeeding = feedingLogs.find((f) => {
          const feedTime = new Date(f.start_time);
          const diff = differenceInMinutes(colicStart, feedTime);
          return diff > 0 && diff < 60;
        });
        if (recentFeeding) colicAfterFeeding++;
      });

      if (colicAfterFeeding >= 2) {
        generatedInsights.push({
          id: "colic-pattern",
          type: "pattern",
          priority: "medium",
          title: "Padrão de cólica",
          description: "Cólicas frequentes após alimentação. Considere verificar a pega ou posição.",
          action: { label: "Dicas de Cólica", path: "/dashboard-bebe" },
          icon: "🤱"
        });
      }
    }

    // 7. Conquista por consistência
    if (feedingLogs.length >= 20 && sleepLogs.length >= 10) {
      generatedInsights.push({
        id: "tracking-achievement",
        type: "achievement",
        priority: "low",
        title: "Ótimo trabalho!",
        description: `Você registrou ${feedingLogs.length} mamadas e ${sleepLogs.length} sonos esta semana!`,
        icon: "🏆"
      });
    }

    // Ordena por prioridade
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return generatedInsights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [feedingLogs, sleepLogs, colicLogs, stats, correlations]);

  // Padrões diários para gráficos
  const dailyPatterns = useMemo((): DailyPattern[] => {
    const patterns: Map<string, DailyPattern> = new Map();
    const last7Days = Array.from({ length: 7 }, (_, i) => 
      format(subDays(new Date(), i), "yyyy-MM-dd")
    );

    last7Days.forEach((date) => {
      patterns.set(date, {
        date,
        totalFeedings: 0,
        totalSleepMinutes: 0,
        avgSleepQuality: 0,
        nightWakeups: 0,
        colicEpisodes: 0
      });
    });

    feedingLogs.forEach((log) => {
      const date = format(parseISO(log.start_time), "yyyy-MM-dd");
      const pattern = patterns.get(date);
      if (pattern) {
        pattern.totalFeedings++;
      }
    });

    sleepLogs.forEach((log) => {
      const date = format(parseISO(log.sleep_start), "yyyy-MM-dd");
      const pattern = patterns.get(date);
      if (pattern) {
        pattern.totalSleepMinutes += log.duration_minutes || 0;
        if (log.sleep_type === "night" && log.wakeup_mood) {
          pattern.nightWakeups++;
        }
      }
    });

    colicLogs.forEach((log) => {
      const date = format(parseISO(log.start_time), "yyyy-MM-dd");
      const pattern = patterns.get(date);
      if (pattern) {
        pattern.colicEpisodes++;
      }
    });

    return Array.from(patterns.values()).reverse();
  }, [feedingLogs, sleepLogs, colicLogs]);

  return {
    loading,
    correlations,
    stats,
    insights,
    dailyPatterns,
    babyProfile,
    reload: loadData
  };
};
