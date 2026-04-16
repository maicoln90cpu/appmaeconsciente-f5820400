import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getAuthenticatedUser } from '@/hooks/useAuthenticatedAction';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type EmotionalLogRow = Database['public']['Tables']['emotional_logs']['Row'];
type EmotionalLogInsert = Database['public']['Tables']['emotional_logs']['Insert'];

export type EmotionalLog = EmotionalLogRow;

export const useEmotionalLogs = () => {
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['emotional-logs'],
    queryFn: async () => {
      const userId = await getAuthenticatedUser();

      const { data, error } = await supabase
        .from('emotional_logs')
        .select('id, user_id, date, mood, edinburgh_score, notes, created_at, updated_at')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const addLog = useMutation({
    mutationFn: async (log: Omit<EmotionalLogInsert, 'user_id'>) => {
      const userId = await getAuthenticatedUser();

      const { data, error } = await supabase
        .from('emotional_logs')
        .insert({ ...log, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['emotional-logs'] });
      checkEdinburghScore(data);
      toast('Sucesso', { description: 'Registro emocional salvo' });
    },
    onError: () => {
      toast.error('Erro', { description: 'Erro ao salvar registro' });
    },
  });

  const updateLog = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmotionalLog> & { id: string }) => {
      const { data, error } = await supabase
        .from('emotional_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['emotional-logs'] });
      checkEdinburghScore(data);
      toast('Sucesso', { description: 'Registro atualizado' });
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
    toast.error('💙 Atenção importante', {
      description:
        'Seu resultado sugere risco de depressão pós-parto. Por favor, converse com um profissional de saúde mental. Você não está sozinha.',
    });
  } else if (log.edinburgh_score >= 10) {
    toast('💙 Cuide-se', {
      description:
        'Alguns sinais de ansiedade ou tristeza foram detectados. Considere conversar com alguém de confiança ou um profissional.',
    });
  } else {
    toast('💕 Tudo bem!', {
      description: 'Seu bem-estar emocional está dentro do esperado. Continue cuidando de você!',
    });
  }
}
