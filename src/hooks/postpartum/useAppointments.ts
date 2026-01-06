import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { getAuthenticatedUser } from "@/hooks/useAuthenticatedAction";
import type { Database } from "@/integrations/supabase/types";

type PostpartumAppointmentRow = Database['public']['Tables']['postpartum_appointments']['Row'];
type PostpartumAppointmentInsert = Database['public']['Tables']['postpartum_appointments']['Insert'];

export type PostpartumAppointment = PostpartumAppointmentRow;

export const usePostpartumAppointments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['postpartum-appointments'],
    queryFn: async () => {
      const userId = await getAuthenticatedUser();

      const { data, error } = await supabase
        .from('postpartum_appointments')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const addAppointment = useMutation({
    mutationFn: async (appointment: Omit<PostpartumAppointmentInsert, 'user_id'>) => {
      const userId = await getAuthenticatedUser();

      const { data, error } = await supabase
        .from('postpartum_appointments')
        .insert({ ...appointment, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postpartum-appointments'] });
      toast({
        title: "Sucesso",
        description: "Consulta agendada com sucesso",
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
      toast({
        title: "Sucesso",
        description: "Consulta atualizada",
      });
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
      toast({
        title: "Sucesso",
        description: "Consulta removida",
      });
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
