import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { getAuthenticatedUser } from "@/hooks/useAuthenticatedAction";
import type { Database } from "@/integrations/supabase/types";

type PostpartumMedicationRow = Database['public']['Tables']['postpartum_medications']['Row'];
type PostpartumMedicationInsert = Database['public']['Tables']['postpartum_medications']['Insert'];
type MedicationLogRow = Database['public']['Tables']['medication_logs']['Row'];

export type PostpartumMedication = PostpartumMedicationRow;
export type MedicationLog = MedicationLogRow;

export const usePostpartumMedications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: medications, isLoading } = useQuery({
    queryKey: ['postpartum-medications'],
    queryFn: async () => {
      const userId = await getAuthenticatedUser();

      const { data, error } = await supabase
        .from('postpartum_medications')
        .select('id, user_id, medication_name, dosage, frequency, time_of_day, start_date, end_date, notes, is_active, created_at, updated_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: logs } = useQuery({
    queryKey: ['medication-logs'],
    queryFn: async () => {
      const userId = await getAuthenticatedUser();

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('medication_logs')
        .select('id, user_id, medication_id, taken_at, scheduled_time, notes, created_at')
        .eq('user_id', userId)
        .gte('taken_at', today)
        .order('taken_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const addMedication = useMutation({
    mutationFn: async (medication: Omit<PostpartumMedicationInsert, 'user_id'>) => {
      const userId = await getAuthenticatedUser();

      const { data, error } = await supabase
        .from('postpartum_medications')
        .insert({ ...medication, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postpartum-medications'] });
      toast({
        title: "Sucesso",
        description: "Medicamento adicionado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao adicionar medicamento",
        variant: "destructive",
      });
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
      toast({
        title: "Sucesso",
        description: "Medicamento atualizado",
      });
    },
  });

  const logMedication = useMutation({
    mutationFn: async (log: { medication_id: string; scheduled_time?: string; notes?: string }) => {
      const userId = await getAuthenticatedUser();

      const { data, error } = await supabase
        .from('medication_logs')
        .insert({ ...log, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication-logs'] });
      toast({
        title: "✅ Sucesso",
        description: "Medicamento registrado",
      });
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
