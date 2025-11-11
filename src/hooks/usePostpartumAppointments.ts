import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PostpartumAppointment {
  id: string;
  user_id: string;
  appointment_type: 'gynecologist' | 'pediatrician' | 'pelvic_physiotherapist' | 'nutritionist' | 'psychologist' | 'other';
  title: string;
  scheduled_date: string;
  scheduled_time?: string;
  location?: string;
  doctor_name?: string;
  reminder_sent: boolean;
  completed: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const usePostpartumAppointments = () => {
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['postpartum-appointments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // @ts-ignore - types will be updated after migration
      const { data, error } = await supabase
        .from('postpartum_appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data as PostpartumAppointment[];
    },
  });

  const addAppointment = useMutation({
    mutationFn: async (appointment: Omit<PostpartumAppointment, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'reminder_sent' | 'completed'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // @ts-ignore - types will be updated after migration
      const { data, error } = await supabase
        .from('postpartum_appointments')
        .insert({ ...appointment, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postpartum-appointments'] });
      toast.success('Consulta agendada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao agendar consulta');
    },
  });

  const updateAppointment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PostpartumAppointment> & { id: string }) => {
      // @ts-ignore - types will be updated after migration
      const { data, error } = await supabase
        .from('postpartum_appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postpartum-appointments'] });
      toast.success('Consulta atualizada');
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      // @ts-ignore - types will be updated after migration
      const { error } = await supabase
        .from('postpartum_appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postpartum-appointments'] });
      toast.success('Consulta removida');
    },
  });

  return {
    appointments,
    isLoading,
    addAppointment: addAppointment.mutate,
    updateAppointment: updateAppointment.mutate,
    deleteAppointment: deleteAppointment.mutate,
  };
};
