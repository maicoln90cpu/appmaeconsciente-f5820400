/**
 * @fileoverview Hook para gerenciar diário de contrações
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useState, useCallback, useRef, useEffect } from 'react';

export interface Contraction {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  intensity: number | null;
  notes: string | null;
  session_id: string | null;
  created_at: string;
}

export interface ContractionInput {
  start_time?: string;
  end_time?: string;
  duration_seconds?: number;
  intensity?: number;
  notes?: string;
  session_id?: string;
}

export const useContractions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Fetch contractions
  const { data: contractions = [], isLoading } = useQuery({
    queryKey: ['contractions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('contraction_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as unknown as Contraction[];
    },
    enabled: !!user,
  });

  // Start timer
  const startTimer = useCallback(() => {
    if (isTimerRunning) return;

    startTimeRef.current = new Date();
    setIsTimerRunning(true);
    setTimerSeconds(0);

    if (!currentSessionId) {
      setCurrentSessionId(crypto.randomUUID());
    }

    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
        setTimerSeconds(elapsed);
      }
    }, 1000);
  }, [isTimerRunning, currentSessionId]);

  // Stop timer
  const stopTimer = useCallback(
    async (intensity?: number, notes?: string) => {
      if (!isTimerRunning || !startTimeRef.current || !user) return;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const endTime = new Date();
      const durationSeconds = Math.floor(
        (endTime.getTime() - startTimeRef.current.getTime()) / 1000
      );

      const { error } = await supabase.from('contraction_logs').insert({
        user_id: user.id,
        start_time: startTimeRef.current.toISOString(),
        end_time: endTime.toISOString(),
        duration_seconds: durationSeconds,
        intensity: intensity || null,
        notes: notes || null,
        session_id: currentSessionId,
      });

      if (error) {
        toast.error('Erro ao salvar contração');
      } else {
        toast.success('Contração registrada!');
        queryClient.invalidateQueries({ queryKey: ['contractions'] });
      }

      setIsTimerRunning(false);
      setTimerSeconds(0);
      startTimeRef.current = null;
    },
    [isTimerRunning, user, currentSessionId, queryClient]
  );

  // End session
  const endSession = useCallback(() => {
    setCurrentSessionId(null);
  }, []);

  // Delete contraction
  const deleteContraction = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('contraction_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractions'] });
      toast.success('Contração removida');
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Calculate stats for session
  const getSessionStats = useCallback(
    (sessionId: string) => {
      const sessionContractions = contractions.filter(c => c.session_id === sessionId);
      if (sessionContractions.length < 2) return null;

      const intervals: number[] = [];
      const durations: number[] = [];

      for (let i = 0; i < sessionContractions.length; i++) {
        if (sessionContractions[i].duration_seconds) {
          durations.push(sessionContractions[i].duration_seconds!);
        }
        if (i > 0) {
          const prevEnd = new Date(sessionContractions[i - 1].start_time);
          const currStart = new Date(sessionContractions[i].start_time);
          intervals.push(Math.floor((currStart.getTime() - prevEnd.getTime()) / 1000 / 60));
        }
      }

      return {
        count: sessionContractions.length,
        avgDuration: durations.length
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0,
        avgInterval: intervals.length
          ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
          : 0,
      };
    },
    [contractions]
  );

  // Check if should go to hospital (5-1-1 rule)
  const checkHospitalAlert = useCallback(() => {
    if (!currentSessionId) return null;

    const sessionContractions = contractions.filter(c => c.session_id === currentSessionId);
    if (sessionContractions.length < 5) return null;

    const recent = sessionContractions.slice(0, 5);
    const avgDuration = recent.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / 5;

    // Calculate average interval
    let totalInterval = 0;
    for (let i = 1; i < recent.length; i++) {
      const prevStart = new Date(recent[i - 1].start_time);
      const currStart = new Date(recent[i].start_time);
      totalInterval += (currStart.getTime() - prevStart.getTime()) / 1000 / 60;
    }
    const avgInterval = totalInterval / (recent.length - 1);

    // 5-1-1 Rule: Contractions every 5 minutes, lasting 1 minute, for 1 hour
    if (avgInterval <= 5 && avgDuration >= 45) {
      return {
        type: 'hospital',
        message: 'Suas contrações seguem o padrão 5-1-1. Considere ir ao hospital!',
      };
    }

    if (avgInterval <= 10 && avgDuration >= 30) {
      return {
        type: 'attention',
        message: 'Contrações ficando mais frequentes. Fique atenta!',
      };
    }

    return null;
  }, [contractions, currentSessionId]);

  return {
    contractions,
    isLoading,
    isTimerRunning,
    timerSeconds,
    currentSessionId,
    startTimer,
    stopTimer,
    endSession,
    deleteContraction: deleteContraction.mutate,
    getSessionStats,
    checkHospitalAlert,
  };
};
