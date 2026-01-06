import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { getAuthenticatedUser } from "@/hooks/useAuthenticatedAction";
import type { Database } from "@/integrations/supabase/types";

type BabyRoutineRow = Database['public']['Tables']['baby_routines']['Row'];
type BabyRoutineInsert = Database['public']['Tables']['baby_routines']['Insert'];
type BabyRoutineLogRow = Database['public']['Tables']['baby_routine_logs']['Row'];
type BabyRoutineLogInsert = Database['public']['Tables']['baby_routine_logs']['Insert'];

export type BabyRoutine = BabyRoutineRow;
export type BabyRoutineLog = BabyRoutineLogRow;

export const ROUTINE_TYPES = [
  { value: 'feeding', label: 'Alimentação', icon: '🍼', color: 'bg-pink-100 text-pink-700' },
  { value: 'sleep', label: 'Sono', icon: '😴', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'bath', label: 'Banho', icon: '🛁', color: 'bg-blue-100 text-blue-700' },
  { value: 'play', label: 'Brincadeira', icon: '🧸', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'walk', label: 'Passeio', icon: '🚶', color: 'bg-green-100 text-green-700' },
  { value: 'medication', label: 'Medicamento', icon: '💊', color: 'bg-red-100 text-red-700' },
  { value: 'massage', label: 'Massagem', icon: '👐', color: 'bg-purple-100 text-purple-700' },
  { value: 'tummy_time', label: 'Tempo de Barriga', icon: '👶', color: 'bg-orange-100 text-orange-700' },
  { value: 'reading', label: 'Leitura', icon: '📚', color: 'bg-teal-100 text-teal-700' },
  { value: 'other', label: 'Outro', icon: '📋', color: 'bg-gray-100 text-gray-700' },
] as const;

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
  { value: 1, label: 'Seg', fullLabel: 'Segunda' },
  { value: 2, label: 'Ter', fullLabel: 'Terça' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
] as const;

export const useBabyRoutines = (babyProfileId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: routines, isLoading } = useQuery({
    queryKey: ['baby-routines', babyProfileId],
    queryFn: async () => {
      const userId = await getAuthenticatedUser();

      let query = supabase
        .from('baby_routines')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('scheduled_time', { ascending: true });

      if (babyProfileId) {
        query = query.eq('baby_profile_id', babyProfileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: todayLogs } = useQuery({
    queryKey: ['baby-routine-logs-today', babyProfileId],
    queryFn: async () => {
      const userId = await getAuthenticatedUser();
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('baby_routine_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', `${today}T00:00:00`)
        .lte('completed_at', `${today}T23:59:59`);

      if (error) throw error;
      return data;
    },
  });

  const addRoutine = useMutation({
    mutationFn: async (routine: Omit<BabyRoutineInsert, 'user_id'>) => {
      const userId = await getAuthenticatedUser();

      const { data, error } = await supabase
        .from('baby_routines')
        .insert({ ...routine, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-routines'] });
      toast({
        title: "Sucesso",
        description: "Rotina criada",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar rotina",
        variant: "destructive",
      });
    },
  });

  const updateRoutine = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BabyRoutine> & { id: string }) => {
      const { data, error } = await supabase
        .from('baby_routines')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-routines'] });
      toast({
        title: "Sucesso",
        description: "Rotina atualizada",
      });
    },
  });

  const deleteRoutine = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('baby_routines')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-routines'] });
      toast({
        title: "Sucesso",
        description: "Rotina removida",
      });
    },
  });

  const logRoutine = useMutation({
    mutationFn: async (log: Omit<BabyRoutineLogInsert, 'user_id'>) => {
      const userId = await getAuthenticatedUser();

      const { data, error } = await supabase
        .from('baby_routine_logs')
        .insert({ ...log, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-routine-logs-today'] });
      toast({
        title: "Sucesso",
        description: "Rotina concluída",
      });
    },
  });

  const isRoutineCompletedToday = (routineId: string) => {
    return todayLogs?.some(log => log.routine_id === routineId) || false;
  };

  // Get today's routines (filter by day of week)
  const todayDayOfWeek = new Date().getDay();
  const todaysRoutines = routines?.filter(r => 
    r.days_of_week?.includes(todayDayOfWeek)
  ) || [];

  const completedToday = todaysRoutines.filter(r => isRoutineCompletedToday(r.id)).length;
  const progress = todaysRoutines.length > 0 ? (completedToday / todaysRoutines.length) * 100 : 0;

  return {
    routines,
    todaysRoutines,
    todayLogs,
    isLoading,
    addRoutine: addRoutine.mutate,
    updateRoutine: updateRoutine.mutate,
    deleteRoutine: deleteRoutine.mutate,
    logRoutine: logRoutine.mutate,
    isRoutineCompletedToday,
    progress,
    completedToday,
    isAdding: addRoutine.isPending,
  };
};
