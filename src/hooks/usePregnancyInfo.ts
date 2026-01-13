/**
 * @fileoverview Hook para gerenciar informações da gestação e DPP
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { addDays, differenceInDays, differenceInWeeks, format } from "date-fns";

export interface PregnancyInfo {
  id: string;
  user_id: string;
  last_menstrual_period: string | null;
  conception_date: string | null;
  due_date: string | null;
  due_date_source: string;
  ultrasound_due_date: string | null;
  gestational_weeks: number | null;
  gestational_days: number | null;
  is_high_risk: boolean;
  ob_doctor_name: string | null;
  hospital_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PregnancyInfoInput {
  last_menstrual_period?: string;
  conception_date?: string;
  due_date?: string;
  due_date_source?: string;
  ultrasound_due_date?: string;
  is_high_risk?: boolean;
  ob_doctor_name?: string;
  hospital_name?: string;
  notes?: string;
}

// Calcular DPP pela regra de Naegele (DUM + 280 dias)
export const calculateDueDate = (lmp: Date): Date => {
  return addDays(lmp, 280);
};

// Calcular semanas gestacionais
export const calculateGestationalAge = (lmp: Date, currentDate: Date = new Date()) => {
  const days = differenceInDays(currentDate, lmp);
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  return { weeks, days: remainingDays, totalDays: days };
};

// Calcular trimestre
export const getTrimester = (weeks: number): number => {
  if (weeks < 13) return 1;
  if (weeks < 27) return 2;
  return 3;
};

// Milestones gestacionais
export const PREGNANCY_MILESTONES = [
  { week: 4, title: "Implantação", description: "O embrião se implanta no útero" },
  { week: 6, title: "Batimento cardíaco", description: "É possível detectar o coração batendo" },
  { week: 8, title: "Embriões → Feto", description: "Transição de embrião para feto" },
  { week: 12, title: "Fim do 1º trimestre", description: "Risco de aborto diminui significativamente" },
  { week: 16, title: "Movimentos", description: "Você pode começar a sentir o bebê" },
  { week: 20, title: "Ultrassom morfológico", description: "Exame detalhado da anatomia fetal" },
  { week: 24, title: "Viabilidade", description: "Bebê tem chances fora do útero" },
  { week: 28, title: "3º trimestre", description: "Reta final da gestação" },
  { week: 32, title: "Preparação", description: "Bebê ganhando peso rapidamente" },
  { week: 36, title: "Termo precoce", description: "Bebê está quase pronto" },
  { week: 37, title: "Termo", description: "Gestação considerada a termo" },
  { week: 40, title: "DPP", description: "Data Provável do Parto" },
];

export const usePregnancyInfo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch pregnancy info
  const { data: pregnancyInfo, isLoading } = useQuery({
    queryKey: ["pregnancy-info", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("pregnancy_info")
        .select("id, user_id, last_menstrual_period, conception_date, due_date, due_date_source, ultrasound_due_date, gestational_weeks, gestational_days, is_high_risk, ob_doctor_name, hospital_name, notes, created_at, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data as unknown as PregnancyInfo | null;
    },
    enabled: !!user,
  });

  // Save/Update pregnancy info
  const saveMutation = useMutation({
    mutationFn: async (input: PregnancyInfoInput) => {
      if (!user) throw new Error("Not authenticated");

      // Calculate gestational age if LMP provided
      let gestationalWeeks: number | undefined;
      let gestationalDays: number | undefined;

      if (input.last_menstrual_period) {
        const age = calculateGestationalAge(new Date(input.last_menstrual_period));
        gestationalWeeks = age.weeks;
        gestationalDays = age.days;
      }

      const { data, error } = await supabase
        .from("pregnancy_info")
        .upsert({
          user_id: user.id,
          ...input,
          gestational_weeks: gestationalWeeks,
          gestational_days: gestationalDays,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pregnancy-info"] });
      toast.success("Informações salvas com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar informações");
    },
  });

  // Calculate current gestational age
  const getCurrentGestationalAge = () => {
    if (!pregnancyInfo?.last_menstrual_period) return null;
    return calculateGestationalAge(new Date(pregnancyInfo.last_menstrual_period));
  };

  // Get effective due date
  const getEffectiveDueDate = () => {
    if (pregnancyInfo?.due_date_source === "ultrasound" && pregnancyInfo.ultrasound_due_date) {
      return pregnancyInfo.ultrasound_due_date;
    }
    return pregnancyInfo?.due_date || null;
  };

  // Get days until due date
  const getDaysUntilDue = () => {
    const dueDate = getEffectiveDueDate();
    if (!dueDate) return null;
    return differenceInDays(new Date(dueDate), new Date());
  };

  // Get current trimester
  const getCurrentTrimester = () => {
    const age = getCurrentGestationalAge();
    if (!age) return null;
    return getTrimester(age.weeks);
  };

  // Get completed milestones
  const getCompletedMilestones = () => {
    const age = getCurrentGestationalAge();
    if (!age) return [];
    return PREGNANCY_MILESTONES.filter(m => m.week <= age.weeks);
  };

  // Get next milestone
  const getNextMilestone = () => {
    const age = getCurrentGestationalAge();
    if (!age) return null;
    return PREGNANCY_MILESTONES.find(m => m.week > age.weeks) || null;
  };

  return {
    pregnancyInfo,
    isLoading,
    savePregnancyInfo: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    getCurrentGestationalAge,
    getEffectiveDueDate,
    getDaysUntilDue,
    getCurrentTrimester,
    getCompletedMilestones,
    getNextMilestone,
    calculateDueDate,
    PREGNANCY_MILESTONES,
  };
};
