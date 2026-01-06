import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { getAuthenticatedUser } from "@/hooks/useAuthenticatedAction";
import type { Database } from "@/integrations/supabase/types";

type BabyColicsRow = Database['public']['Tables']['baby_colic_logs']['Row'];
type BabyColicsInsert = Database['public']['Tables']['baby_colic_logs']['Insert'];

export type BabyColicLog = BabyColicsRow;

export const COLIC_TRIGGERS = [
  'Após mamada',
  'Gases',
  'Fome',
  'Cansaço',
  'Superestimulação',
  'Mudança de rotina',
  'Desconhecido',
] as const;

export const RELIEF_METHODS = [
  'Colo',
  'Massagem abdominal',
  'Exercício de bicicleta',
  'Banho morno',
  'Ruído branco',
  'Passeio de carro',
  'Balanço/embalo',
  'Chupeta',
  'Enrolar no cueiro',
  'Posição de avião',
] as const;

export const useBabyColic = (babyProfileId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: colicLogs, isLoading } = useQuery({
    queryKey: ['baby-colic-logs', babyProfileId],
    queryFn: async () => {
      const userId = await getAuthenticatedUser();

      let query = supabase
        .from('baby_colic_logs')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (babyProfileId) {
        query = query.eq('baby_profile_id', babyProfileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: true,
  });

  const addColicLog = useMutation({
    mutationFn: async (log: Omit<BabyColicsInsert, 'user_id'>) => {
      const userId = await getAuthenticatedUser();

      const { data, error } = await supabase
        .from('baby_colic_logs')
        .insert({ ...log, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-colic-logs'] });
      toast({
        title: "Sucesso",
        description: "Episódio de cólica registrado",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao registrar episódio",
        variant: "destructive",
      });
    },
  });

  const updateColicLog = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BabyColicLog> & { id: string }) => {
      const { data, error } = await supabase
        .from('baby_colic_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-colic-logs'] });
      toast({
        title: "Sucesso",
        description: "Episódio atualizado",
      });
    },
  });

  const deleteColicLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('baby_colic_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-colic-logs'] });
      toast({
        title: "Sucesso",
        description: "Episódio removido",
      });
    },
  });

  // Calculate statistics
  const stats = colicLogs ? {
    totalEpisodes: colicLogs.length,
    averageDuration: colicLogs.filter(l => l.duration_minutes).reduce((acc, l) => acc + (l.duration_minutes || 0), 0) / (colicLogs.filter(l => l.duration_minutes).length || 1),
    mostCommonTrigger: getMostCommon(colicLogs.flatMap(l => l.triggers || [])),
    mostEffectiveRelief: getMostCommon(colicLogs.flatMap(l => l.relief_methods || [])),
    episodesThisWeek: colicLogs.filter(l => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(l.start_time) >= weekAgo;
    }).length,
  } : null;

  return {
    colicLogs,
    stats,
    isLoading,
    addColicLog: addColicLog.mutate,
    updateColicLog: updateColicLog.mutate,
    deleteColicLog: deleteColicLog.mutate,
    isAdding: addColicLog.isPending,
  };
};

function getMostCommon(arr: string[]): string | null {
  if (arr.length === 0) return null;
  const counts = arr.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}
