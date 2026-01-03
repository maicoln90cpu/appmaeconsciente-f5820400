import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type PostpartumMedicationRow = Database['public']['Tables']['postpartum_medications']['Row'];
type PostpartumMedicationInsert = Database['public']['Tables']['postpartum_medications']['Insert'];
type MedicationLogRow = Database['public']['Tables']['medication_logs']['Row'];

export type PostpartumMedication = PostpartumMedicationRow;
export type MedicationLog = MedicationLogRow;

export const usePostpartumMedications = () => {
  const queryClient = useQueryClient();

  const { data: medications, isLoading } = useQuery({
    queryKey: ['postpartum-medications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('postpartum_medications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: logs } = useQuery({
    queryKey: ['medication-logs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('taken_at', today)
        .order('taken_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const addMedication = useMutation({
    mutationFn: async (medication: Omit<PostpartumMedicationInsert, 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
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
      const { data, error } = await supabase
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

      const { data, error } = await supabase
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
