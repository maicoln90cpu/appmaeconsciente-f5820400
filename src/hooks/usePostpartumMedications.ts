import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PostpartumMedication {
  id: string;
  user_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  times_per_day: number;
  schedule_times: string[];
  start_date: string;
  end_date?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  user_id: string;
  taken_at: string;
  scheduled_time?: string;
  notes?: string;
  created_at: string;
}

export const usePostpartumMedications = () => {
  const queryClient = useQueryClient();

  const { data: medications, isLoading } = useQuery({
    queryKey: ['postpartum-medications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // @ts-ignore - types will be updated after migration
      const { data, error } = await supabase
        // @ts-ignore
        .from('postpartum_medications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // @ts-ignore
      return data as PostpartumMedication[];
    },
  });

  const { data: logs } = useQuery({
    queryKey: ['medication-logs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];
      // @ts-ignore - types will be updated after migration
      const { data, error } = await supabase
        // @ts-ignore
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('taken_at', today)
        .order('taken_at', { ascending: false });

      if (error) throw error;
      // @ts-ignore
      return data as MedicationLog[];
    },
  });

  const addMedication = useMutation({
    mutationFn: async (medication: Omit<PostpartumMedication, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // @ts-ignore - types will be updated after migration
      const { data, error } = await supabase
        // @ts-ignore
        .from('postpartum_medications')
        .insert({ ...medication, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postpartum-medications'] });
      toast.success('Medicamento adicionado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao adicionar medicamento');
    },
  });

  const updateMedication = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PostpartumMedication> & { id: string }) => {
      // @ts-ignore - types will be updated after migration
      const { data, error } = await supabase
        // @ts-ignore
        .from('postpartum_medications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postpartum-medications'] });
      toast.success('Medicamento atualizado');
    },
  });

  const logMedication = useMutation({
    mutationFn: async (log: { medication_id: string; scheduled_time?: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // @ts-ignore - types will be updated after migration
      const { data, error } = await supabase
        // @ts-ignore
        .from('medication_logs')
        .insert({ ...log, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication-logs'] });
      toast.success('✅ Medicamento registrado');
    },
  });

  return {
    medications,
    logs,
    isLoading,
    addMedication: addMedication.mutate,
    updateMedication: updateMedication.mutate,
    logMedication: logMedication.mutate,
  };
};
