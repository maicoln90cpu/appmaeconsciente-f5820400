import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { getAuthenticatedUser } from "@/hooks/useAuthenticatedAction";
import type { Database } from "@/integrations/supabase/types";

type PostpartumSymptomRow = Database['public']['Tables']['postpartum_symptoms']['Row'];
type PostpartumSymptomInsert = Database['public']['Tables']['postpartum_symptoms']['Insert'];

export type PostpartumSymptom = PostpartumSymptomRow;

export const usePostpartumSymptoms = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: symptoms, isLoading } = useQuery({
    queryKey: ['postpartum-symptoms'],
    queryFn: async () => {
      const userId = await getAuthenticatedUser();

      const { data, error } = await supabase
        .from('postpartum_symptoms')
        .select('id, user_id, date, bleeding_intensity, pain_level, fever, healing_status, breast_pain, energy_level, sleep_quality, appetite, bowel_movement, urination, swelling, temperature, cramps_level, notes, created_at, updated_at')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const addSymptom = useMutation({
    mutationFn: async (symptom: Omit<PostpartumSymptomInsert, 'user_id'>) => {
      const userId = await getAuthenticatedUser();

      const { data, error } = await supabase
        .from('postpartum_symptoms')
        .insert({ ...symptom, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['postpartum-symptoms'] });
      checkAlerts(data, toast);
      toast({
        title: "Sucesso",
        description: "Sintomas registrados com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao registrar sintomas",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const updateSymptom = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PostpartumSymptom> & { id: string }) => {
      const { data, error } = await supabase
        .from('postpartum_symptoms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['postpartum-symptoms'] });
      checkAlerts(data, toast);
      toast({
        title: "Sucesso",
        description: "Sintomas atualizados",
      });
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
function checkAlerts(symptom: PostpartumSymptom, toast: ReturnType<typeof useToast>['toast']) {
  // Sangramento intenso
  if (symptom.bleeding_intensity === 'very_heavy') {
    toast({
      title: "⚠️ ALERTA",
      description: "Sangramento muito intenso. Procure atendimento médico imediatamente!",
      variant: "destructive",
    });
  } else if (symptom.bleeding_intensity === 'heavy') {
    toast({
      title: "⚠️ Atenção",
      description: "Sangramento intenso detectado. Monitore de perto e contate seu médico se persistir.",
      variant: "destructive",
    });
  }

  // Febre
  if (symptom.fever) {
    toast({
      title: "⚠️ ALERTA",
      description: "Febre pode indicar infecção. Entre em contato com seu médico.",
      variant: "destructive",
    });
  }

  // Cicatrização preocupante
  if (symptom.healing_status === 'infected') {
    toast({
      title: "⚠️ ALERTA",
      description: "Sinais de infecção na cicatrização. Procure atendimento médico!",
      variant: "destructive",
    });
  } else if (symptom.healing_status === 'concerning') {
    toast({
      title: "⚠️ Atenção",
      description: "Cicatrização preocupante. Agende consulta com seu médico para avaliação.",
      variant: "destructive",
    });
  }

  // Dor alta persistente
  if (symptom.pain_level && symptom.pain_level >= 4) {
    toast({
      title: "Dor intensa",
      description: "Se persistir, consulte seu médico sobre medicação adequada.",
    });
  }

  // Energia muito baixa
  if (symptom.energy_level !== undefined && symptom.energy_level !== null && 
      symptom.energy_level <= 1 && symptom.sleep_quality && symptom.sleep_quality < 4) {
    toast({
      title: "💙 Cuide-se",
      description: "Você está com energia muito baixa. Tente descansar quando o bebê dormir.",
    });
  }
}
