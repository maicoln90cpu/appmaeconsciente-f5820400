import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { getAuthenticatedUser } from "@/hooks/useAuthenticatedAction";
import type { Database } from "@/integrations/supabase/types";

type BabyMedicationRow = Database['public']['Tables']['baby_medications']['Row'];
type BabyMedicationInsert = Database['public']['Tables']['baby_medications']['Insert'];
type BabyMedicationLogRow = Database['public']['Tables']['baby_medication_logs']['Row'];
type BabyMedicationLogInsert = Database['public']['Tables']['baby_medication_logs']['Insert'];

export type BabyMedication = BabyMedicationRow;
export type BabyMedicationLog = BabyMedicationLogRow;

export const MEDICATION_FREQUENCIES = [
  { value: 'once_daily', label: '1x ao dia' },
  { value: 'twice_daily', label: '2x ao dia' },
  { value: 'three_daily', label: '3x ao dia' },
  { value: 'four_daily', label: '4x ao dia' },
  { value: 'every_8h', label: 'A cada 8 horas' },
  { value: 'every_6h', label: 'A cada 6 horas' },
  { value: 'as_needed', label: 'Quando necessário' },
] as const;

export const useBabyMedications = (babyProfileId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: medications, isLoading } = useQuery({
    queryKey: ['baby-medications', babyProfileId],
    queryFn: async () => {
      const userId = await getAuthenticatedUser();

      let query = supabase
        .from('baby_medications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (babyProfileId) {
        query = query.eq('baby_profile_id', babyProfileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: todayLogs } = useQuery({
    queryKey: ['baby-medication-logs-today', babyProfileId],
    queryFn: async () => {
      const userId = await getAuthenticatedUser();
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('baby_medication_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('given_at', `${today}T00:00:00`)
        .lte('given_at', `${today}T23:59:59`);

      if (error) throw error;
      return data;
    },
  });

  const addMedication = useMutation({
    mutationFn: async (medication: Omit<BabyMedicationInsert, 'user_id'>) => {
      const userId = await getAuthenticatedUser();

      const { data, error } = await supabase
        .from('baby_medications')
        .insert({ ...medication, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-medications'] });
      toast({
        title: "Sucesso",
        description: "Medicamento adicionado",
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
    mutationFn: async ({ id, ...updates }: Partial<BabyMedication> & { id: string }) => {
      const { data, error } = await supabase
        .from('baby_medications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-medications'] });
      toast({
        title: "Sucesso",
        description: "Medicamento atualizado",
      });
    },
  });

  const logMedication = useMutation({
    mutationFn: async (log: Omit<BabyMedicationLogInsert, 'user_id'>) => {
      const userId = await getAuthenticatedUser();

      const { data, error } = await supabase
        .from('baby_medication_logs')
        .insert({ ...log, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-medication-logs-today'] });
      toast({
        title: "Sucesso",
        description: "Medicamento registrado",
      });
    },
  });

  const isMedicationGivenToday = (medicationId: string) => {
    return todayLogs?.some(log => log.medication_id === medicationId) || false;
  };

  const getNextDose = (medication: BabyMedication) => {
    const todayLogsForMed = todayLogs?.filter(log => log.medication_id === medication.id) || [];
    const timesPerDay = medication.times_per_day || 1;
    
    if (todayLogsForMed.length >= timesPerDay) {
      return 'Completo hoje';
    }
    
    if (medication.time_of_day && medication.time_of_day.length > todayLogsForMed.length) {
      return medication.time_of_day[todayLogsForMed.length];
    }
    
    return 'Quando necessário';
  };

  return {
    medications,
    todayLogs,
    isLoading,
    addMedication: addMedication.mutate,
    updateMedication: updateMedication.mutate,
    logMedication: logMedication.mutate,
    isMedicationGivenToday,
    getNextDose,
    isAdding: addMedication.isPending,
  };
};
