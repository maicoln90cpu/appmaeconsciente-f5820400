import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type PostpartumAppointmentRow = Database['public']['Tables']['postpartum_appointments']['Row'];
type PostpartumAppointmentInsert = Database['public']['Tables']['postpartum_appointments']['Insert'];

export type PostpartumAppointment = PostpartumAppointmentRow;

export const usePostpartumAppointments = () => {
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['postpartum-appointments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('postpartum_appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const addAppointment = useMutation({
    mutationFn: async (appointment: Omit<PostpartumAppointmentInsert, 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

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
