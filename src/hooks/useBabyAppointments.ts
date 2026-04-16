/**
 * @fileoverview Hook para gerenciar consultas/agendamentos do bebê
 * Migrado para usar createSupabaseCRUD
 */

import { useMemo } from 'react';

import { createSupabaseCRUD } from '@/hooks/factories/createSupabaseCRUD';

import type { Database } from '@/integrations/supabase/types';

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

// Base hook using factory
const useAppointmentsBase = createSupabaseCRUD<BabyAppointmentRow, BabyAppointmentInsert>({
  tableName: 'baby_appointments',
  queryKey: ['baby-appointments'],
  orderBy: 'scheduled_date',
  orderDirection: 'asc',
  messages: {
    addSuccess: 'Consulta agendada',
    addError: 'Erro ao agendar consulta',
    updateSuccess: 'Consulta atualizada',
    deleteSuccess: 'Consulta removida',
  },
});

export const useBabyAppointments = (babyProfileId?: string) => {
  const base = useAppointmentsBase();

  // Filter by baby profile if provided
  const appointments = useMemo(() => {
    if (!babyProfileId) return base.data;
    return base.data.filter(a => a.baby_profile_id === babyProfileId);
  }, [base.data, babyProfileId]);

  // Categorize appointments
  const today = new Date().toISOString().split('T')[0];

  const upcomingAppointments = useMemo(
    () => appointments?.filter(a => !a.completed && a.scheduled_date >= today) || [],
    [appointments, today]
  );

  const pastAppointments = useMemo(
    () => appointments?.filter(a => a.completed || a.scheduled_date < today) || [],
    [appointments, today]
  );

  const todayAppointments = useMemo(
    () => appointments?.filter(a => a.scheduled_date === today && !a.completed) || [],
    [appointments, today]
  );

  // Toggle completed status
  const toggleCompleted = (data: { id: string; completed: boolean }) => {
    base.update({ id: data.id, completed: data.completed });
  };

  return {
    appointments,
    upcomingAppointments,
    pastAppointments,
    todayAppointments,
    isLoading: base.isLoading,
    addAppointment: base.add,
    updateAppointment: base.update,
    deleteAppointment: base.remove,
    toggleCompleted,
    isAdding: base.isAdding,
  };
};
