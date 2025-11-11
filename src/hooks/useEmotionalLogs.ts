import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EmotionalLog {
  id: string;
  user_id: string;
  date: string;
  mood: 'very_happy' | 'happy' | 'neutral' | 'sad' | 'very_sad' | 'angry' | 'anxious' | 'tired';
  notes?: string;
  edinburgh_score?: number;
  created_at: string;
  updated_at: string;
}

export const useEmotionalLogs = () => {
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['emotional-logs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // @ts-ignore - types will be updated after migration
      const { data, error } = await supabase
        .from('emotional_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as EmotionalLog[];
    },
  });

  const addLog = useMutation({
    mutationFn: async (log: Omit<EmotionalLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // @ts-ignore - types will be updated after migration
      const { data, error } = await supabase
        .from('emotional_logs')
        .insert({ ...log, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['emotional-logs'] });
      checkEdinburghScore(data);
      toast.success('Registro emocional salvo');
    },
    onError: () => {
      toast.error('Erro ao salvar registro');
    },
  });

  const updateLog = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmotionalLog> & { id: string }) => {
      // @ts-ignore - types will be updated after migration
      const { data, error } = await supabase
        .from('emotional_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['emotional-logs'] });
      checkEdinburghScore(data);
      toast.success('Registro atualizado');
    },
  });

  return {
    logs,
    isLoading,
    addLog: addLog.mutate,
    updateLog: updateLog.mutate,
  };
};

// Sistema de alerta para Edinburgh Depression Scale
function checkEdinburghScore(log: EmotionalLog) {
  if (!log.edinburgh_score) return;

  if (log.edinburgh_score >= 13) {
    toast.error(
      '💙 Seu resultado sugere risco de depressão pós-parto. Por favor, converse com um profissional de saúde mental. Você não está sozinha.',
      { duration: 15000 }
    );
  } else if (log.edinburgh_score >= 10) {
    toast.warning(
      '💙 Alguns sinais de ansiedade ou tristeza foram detectados. Considere conversar com alguém de confiança ou um profissional.',
      { duration: 10000 }
    );
  } else {
    toast.success('Seu bem-estar emocional está dentro do esperado. Continue cuidando de você! 💕');
  }
}
