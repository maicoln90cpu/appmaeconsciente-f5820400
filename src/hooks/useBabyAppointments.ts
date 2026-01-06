import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { getAuthenticatedUser } from "@/hooks/useAuthenticatedAction";
import type { Database } from "@/integrations/supabase/types";

type BabyAppointmentRow = Database['public']['Tables']['baby_appointments']['Row'];
type BabyAppointmentInsert = Database['public']['Tables']['baby_appointments']['Insert'];

export type BabyAppointment = BabyAppointmentRow;

export const APPOINTMENT_TYPES = [
  { value: 'pediatra', label: 'Pediatra', icon: '👶' },
  { value: 'vacina', label: 'Vacinação', icon: '💉' },
  { value: 'especialista', label: 'Especialista', icon: '🩺' },
  { value: 'exame', label: 'Exame', icon: '🔬' },
  { value: 'emergencia', label: 'Emergência', icon: '🚨' },
  { value: 'retorno', label: 'Retorno', icon: '🔄' },
  { value: 'outro', label: 'Outro', icon: '📋' },
] as const;

export const useBabyAppointments = (babyProfileId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['baby-appointments', babyProfileId],
    queryFn: async () => {
      const userId = await getAuthenticatedUser();

      let query = supabase
        .from('baby_appointments')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: true });

      if (babyProfileId) {
        query = query.eq('baby_profile_id', babyProfileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const addAppointment = useMutation({
    mutationFn: async (appointment: Omit<BabyAppointmentInsert, 'user_id'>) => {
      const userId = await getAuthenticatedUser();

      const { data, error } = await supabase
        .from('baby_appointments')
        .insert({ ...appointment, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-appointments'] });
      toast({
        title: "Sucesso",
        description: "Consulta agendada",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao agendar consulta",
        variant: "destructive",
      });
    },
  });

  const updateAppointment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BabyAppointment> & { id: string }) => {
      const { data, error } = await supabase
        .from('baby_appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-appointments'] });
      toast({
        title: "Sucesso",
        description: "Consulta atualizada",
      });
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('baby_appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-appointments'] });
      toast({
        title: "Sucesso",
        description: "Consulta removida",
      });
    },
  });

  const toggleCompleted = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from('baby_appointments')
        .update({ completed })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-appointments'] });
    },
  });

  // Categorize appointments
  const today = new Date().toISOString().split('T')[0];
  const upcomingAppointments = appointments?.filter(a => !a.completed && a.scheduled_date >= today) || [];
  const pastAppointments = appointments?.filter(a => a.completed || a.scheduled_date < today) || [];
  const todayAppointments = appointments?.filter(a => a.scheduled_date === today && !a.completed) || [];

  return {
    appointments,
    upcomingAppointments,
    pastAppointments,
    todayAppointments,
    isLoading,
    addAppointment: addAppointment.mutate,
    updateAppointment: updateAppointment.mutate,
    deleteAppointment: deleteAppointment.mutate,
    toggleCompleted: toggleCompleted.mutate,
    isAdding: addAppointment.isPending,
  };
};
