import { useState, useRef, useCallback, useEffect } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getAuthenticatedUser } from '@/hooks/useAuthenticatedAction';

import { logger } from '@/lib/logger';

import { supabase } from '@/integrations/supabase/client';


export interface KickSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  kick_count: number;
  duration_minutes: number | null;
  target_kicks: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useKickCounter() {
  const queryClient = useQueryClient();

  // Timer local state
  const [isActive, setIsActive] = useState(false);
  const [kickCount, setKickCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer effect
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  // Query histórico
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['kick-count-sessions'],
    queryFn: async () => {
      const userId = await getAuthenticatedUser();
      const { data, error } = await supabase
        .from('kick_count_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as KickSession[];
    },
  });

  // Iniciar sessão
  const startSession = useMutation({
    mutationFn: async () => {
      const userId = await getAuthenticatedUser();
      const { data, error } = await supabase
        .from('kick_count_sessions')
        .insert({ user_id: userId, kick_count: 0, target_kicks: 10 })
        .select()
        .single();
      if (error) throw error;
      return data as KickSession;
    },
    onSuccess: data => {
      setActiveSessionId(data.id);
      setKickCount(0);
      setElapsedSeconds(0);
      setIsActive(true);
      toast('Sessão iniciada', { description: 'Toque cada vez que sentir um movimento 🤰' });
    },
    onError: e => {
      logger.error('Kick session start error', e);
      toast.error('Erro', { description: 'Não foi possível iniciar a sessão' });
    },
  });

  // Registrar chute
  const recordKick = useCallback(async () => {
    if (!activeSessionId) return;
    const newCount = kickCount + 1;
    setKickCount(newCount);

    try {
      const { error } = await supabase
        .from('kick_count_sessions')
        .update({ kick_count: newCount })
        .eq('id', activeSessionId);
      if (error) {
        logger.error('Kick record error', error);
        setKickCount(kickCount); // rollback UI
        toast.error('Erro ao salvar chute', { description: 'Tente novamente' });
      }
    } catch (e) {
      logger.error('Kick record exception', e);
      setKickCount(kickCount); // rollback UI
      toast.error('Erro ao salvar chute', { description: 'Tente novamente' });
    }
  }, [activeSessionId, kickCount, toast]);

  // Finalizar sessão
  const endSession = useMutation({
    mutationFn: async () => {
      if (!activeSessionId) throw new Error('No active session');
      const durationMinutes = Math.ceil(elapsedSeconds / 60);
      const { data, error } = await supabase
        .from('kick_count_sessions')
        .update({
          ended_at: new Date().toISOString(),
          kick_count: kickCount,
          duration_minutes: durationMinutes,
        })
        .eq('id', activeSessionId)
        .select()
        .single();
      if (error) throw error;
      return data as KickSession;
    },
    onSuccess: () => {
      setIsActive(false);
      setActiveSessionId(null);
      queryClient.invalidateQueries({ queryKey: ['kick-count-sessions'] });
      toast('Sessão finalizada ✅', {
        description: `${kickCount} movimentos registrados em ${Math.ceil(elapsedSeconds / 60)} min`,
      });
    },
    onError: e => {
      logger.error('Kick session end error', e);
      toast.error('Erro', { description: 'Não foi possível finalizar a sessão' });
    },
  });

  // Deletar sessão
  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kick_count_sessions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kick-count-sessions'] });
      toast('Sessão removida');
    },
  });

  return {
    sessions,
    isLoading,
    isActive,
    kickCount,
    elapsedSeconds,
    startSession: startSession.mutate,
    isStarting: startSession.isPending,
    recordKick,
    endSession: endSession.mutate,
    isEnding: endSession.isPending,
    deleteSession: deleteSession.mutate,
  };
}
