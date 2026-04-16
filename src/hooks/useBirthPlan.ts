import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { getAuthenticatedUser } from "@/hooks/useAuthenticatedAction";
import { logger } from "@/lib/logger";

export interface BirthPlan {
  id: string;
  user_id: string;
  delivery_type: string;
  anesthesia: string;
  companion_name: string | null;
  companion_backup: string | null;
  skin_to_skin: boolean;
  delayed_cord_clamping: boolean;
  breastfeed_first_hour: boolean;
  music_playlist: string | null;
  lighting_preference: string;
  photos_video: boolean;
  episiotomy_preference: string;
  placenta_preference: string;
  special_requests: string | null;
  emergency_notes: string | null;
  pediatrician_name: string | null;
  hospital_name: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export type BirthPlanInput = Omit<BirthPlan, "id" | "user_id" | "created_at" | "updated_at">;

export function useBirthPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: plan, isLoading } = useQuery({
    queryKey: ["birth-plan"],
    queryFn: async (): Promise<BirthPlan | null> => {
      const userId = await getAuthenticatedUser();
      const { data, error } = await supabase
        .from("birth_plans")
        .select("id, user_id, delivery_type, hospital_name, companion_name, companion_backup, pediatrician_name, anesthesia, episiotomy_preference, skin_to_skin, delayed_cord_clamping, breastfeed_first_hour, photos_video, lighting_preference, music_playlist, placenta_preference, special_requests, emergency_notes, due_date, created_at, updated_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as BirthPlan | null;
    },
  });

  const savePlan = useMutation({
    mutationFn: async (input: Partial<BirthPlanInput>) => {
      const userId = await getAuthenticatedUser();
      if (plan) {
        const { data, error } = await supabase
          .from("birth_plans")
          .update(input)
          .eq("id", plan.id)
          .select()
          .single();
        if (error) throw error;
        return data as BirthPlan;
      } else {
        const { data, error } = await supabase
          .from("birth_plans")
          .insert({ ...input, user_id: userId })
          .select()
          .single();
        if (error) throw error;
        return data as BirthPlan;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["birth-plan"] });
      toast({ title: "Plano de parto salvo ✅", description: "Suas preferências foram registradas" });
    },
    onError: (e) => {
      logger.error("Birth plan save error", e);
      toast({ title: "Erro", description: "Não foi possível salvar o plano", variant: "destructive" });
    },
  });

  return {
    plan: plan ?? null,
    isLoading,
    savePlan: savePlan.mutate,
    savePlanAsync: savePlan.mutateAsync,
    isSaving: savePlan.isPending,
  };
}
