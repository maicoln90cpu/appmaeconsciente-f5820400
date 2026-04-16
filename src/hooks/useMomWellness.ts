import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MomWellnessLog {
  id: string;
  user_id: string;
  log_date: string;
  mood: number;
  energy: number;
  pain: number;
  sleep_hours: number;
  appetite: string;
  anxiety: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useMomWellness = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['mom-wellness-logs'];

  const { data: logs = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mom_wellness_logs')
        .select('*')
        .order('log_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as MomWellnessLog[];
    },
    enabled: !!user,
  });

  const upsertLog = useMutation({
    mutationFn: async (
      log: Omit<MomWellnessLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    ) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('mom_wellness_logs')
        .upsert({ ...log, user_id: user.id }, { onConflict: 'user_id,log_date' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Bem-estar registrado!');
    },
    onError: () => toast.error('Erro ao salvar registro'),
  });

  const todayLog = logs.find(l => l.log_date === new Date().toISOString().split('T')[0]);

  // Calculate weekly averages
  const last7 = logs.slice(0, 7);
  const weeklyAvg =
    last7.length > 0
      ? {
          mood: +(last7.reduce((s, l) => s + l.mood, 0) / last7.length).toFixed(1),
          energy: +(last7.reduce((s, l) => s + l.energy, 0) / last7.length).toFixed(1),
          pain: +(last7.reduce((s, l) => s + l.pain, 0) / last7.length).toFixed(1),
          anxiety: +(last7.reduce((s, l) => s + l.anxiety, 0) / last7.length).toFixed(1),
          sleep: +(last7.reduce((s, l) => s + l.sleep_hours, 0) / last7.length).toFixed(1),
        }
      : null;

  return { logs, isLoading, upsertLog, todayLog, weeklyAvg };
};
