/**
 * @fileoverview Hook para gerenciar consultas pós-parto
 * Migrado para usar createSupabaseCRUD factory
 */

import { useMemo } from "react";
import { createSupabaseCRUD } from "@/hooks/factories/createSupabaseCRUD";
import type { Database } from "@/integrations/supabase/types";

type PostpartumAppointmentRow = Database['public']['Tables']['postpartum_appointments']['Row'];
type PostpartumAppointmentInsert = Database['public']['Tables']['postpartum_appointments']['Insert'];

export type PostpartumAppointment = PostpartumAppointmentRow;

// Cria o hook base usando a factory
const useAppointmentsBase = createSupabaseCRUD<PostpartumAppointment, PostpartumAppointmentInsert>({
  tableName: 'postpartum_appointments',
  queryKey: ['postpartum-appointments'],
  orderBy: 'scheduled_date',
  orderDirection: 'asc',
  messages: {
    addSuccess: 'Consulta agendada com sucesso',
    addError: 'Erro ao agendar consulta',
    updateSuccess: 'Consulta atualizada',
    updateError: 'Erro ao atualizar consulta',
    deleteSuccess: 'Consulta removida',
    deleteError: 'Erro ao remover consulta',
  },
});

/**
 * Hook para gerenciar consultas pós-parto
 * Mantém a mesma API do hook original para compatibilidade
 */
export const usePostpartumAppointments = () => {
  const {
    data: appointments,
    isLoading,
    add,
    update,
    remove,
  } = useAppointmentsBase();

  // Consultas futuras
  const upcomingAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => apt.scheduled_date >= today && !apt.completed);
  }, [appointments]);

  // Consultas passadas
  const pastAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => apt.scheduled_date < today || apt.completed);
  }, [appointments]);

  return {
    appointments,
    upcomingAppointments,
    pastAppointments,
    isLoading,
    addAppointment: add,
    updateAppointment: update,
    deleteAppointment: remove,
  };
};
