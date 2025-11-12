import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PostpartumSymptom {
  id: string;
  user_id: string;
  date: string;
  pain_level?: number;
  bleeding_intensity?: 'none' | 'light' | 'moderate' | 'heavy' | 'very_heavy';
  swelling_level?: number;
  healing_status?: 'good' | 'normal' | 'concerning' | 'infected';
  energy_level?: number;
  sleep_hours?: number;
  appetite?: 'none' | 'low' | 'normal' | 'high';
  bowel_movement?: boolean;
  fever?: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const usePostpartumSymptoms = () => {
  const queryClient = useQueryClient();

  const { data: symptoms, isLoading } = useQuery({
    queryKey: ['postpartum-symptoms'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // @ts-ignore - types will be updated after migration
      const { data, error } = await supabase
        // @ts-ignore
        .from('postpartum_symptoms')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      // @ts-ignore
      return data as PostpartumSymptom[];
    },
  });

  const addSymptom = useMutation({
    mutationFn: async (symptom: Omit<PostpartumSymptom, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // @ts-ignore - types will be updated after migration
      const { data, error } = await supabase
        // @ts-ignore
        .from('postpartum_symptoms')
        .insert({ ...symptom, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      // @ts-ignore
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['postpartum-symptoms'] });
      // @ts-ignore
      checkAlerts(data);
      toast.success('Sintomas registrados com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao registrar sintomas');
      console.error(error);
    },
  });

  const updateSymptom = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PostpartumSymptom> & { id: string }) => {
      // @ts-ignore - types will be updated after migration
      const { data, error } = await supabase
        // @ts-ignore
        .from('postpartum_symptoms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      // @ts-ignore
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['postpartum-symptoms'] });
      // @ts-ignore
      checkAlerts(data);
      toast.success('Sintomas atualizados');
    },
  });

  return {
    symptoms,
    isLoading,
    addSymptom: addSymptom.mutate,
    updateSymptom: updateSymptom.mutate,
    isAdding: addSymptom.isPending,
  };
};

// Sistema de alertas inteligentes
function checkAlerts(symptom: PostpartumSymptom) {
  const alerts: string[] = [];

  // Sangramento intenso
  if (symptom.bleeding_intensity === 'very_heavy') {
    toast.error('⚠️ ALERTA: Sangramento muito intenso. Procure atendimento médico imediatamente!', {
      duration: 10000,
    });
    alerts.push('heavy_bleeding');
  } else if (symptom.bleeding_intensity === 'heavy') {
    toast.warning('⚠️ Sangramento intenso detectado. Monitore de perto e contate seu médico se persistir.', {
      duration: 8000,
    });
  }

  // Febre
  if (symptom.fever) {
    toast.error('⚠️ ALERTA: Febre pode indicar infecção. Entre em contato com seu médico.', {
      duration: 10000,
    });
    alerts.push('fever');
  }

  // Cicatrização preocupante
  if (symptom.healing_status === 'infected') {
    toast.error('⚠️ ALERTA: Sinais de infecção na cicatrização. Procure atendimento médico!', {
      duration: 10000,
    });
    alerts.push('infection');
  } else if (symptom.healing_status === 'concerning') {
    toast.warning('⚠️ Cicatrização preocupante. Agende consulta com seu médico para avaliação.', {
      duration: 8000,
    });
  }

  // Dor alta persistente
  if (symptom.pain_level && symptom.pain_level >= 4) {
    toast.warning('Dor intensa. Se persistir, consulte seu médico sobre medicação adequada.', {
      duration: 6000,
    });
  }

  // Energia muito baixa
  if (symptom.energy_level !== undefined && symptom.energy_level <= 1 && symptom.sleep_hours && symptom.sleep_hours < 4) {
    toast.info('💙 Você está com energia muito baixa. Tente descansar quando o bebê dormir.', {
      duration: 6000,
    });
  }

  return alerts;
}
