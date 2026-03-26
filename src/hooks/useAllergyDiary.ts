import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { QueryKeys, QueryCacheConfig } from "@/lib/query-config";

export interface AllergyLog {
  id: string;
  user_id: string;
  baby_profile_id: string | null;
  food_name: string;
  introduction_date: string;
  reaction_type: string;
  reaction_severity: string;
  symptoms: string[];
  onset_time_hours: number | null;
  photo_url: string | null;
  action_taken: string | null;
  doctor_consulted: boolean;
  is_confirmed_allergy: boolean;
  notes: string | null;
  created_at: string;
}

export const REACTION_TYPES = [
  { value: "none", label: "Sem reação", color: "text-green-600" },
  { value: "mild", label: "Leve", color: "text-yellow-600" },
  { value: "moderate", label: "Moderada", color: "text-orange-600" },
  { value: "severe", label: "Grave", color: "text-red-600" },
];

export const ALLERGY_SYMPTOMS = [
  "Vermelhidão na pele", "Urticária", "Inchaço nos lábios",
  "Vômito", "Diarreia", "Cólica intensa",
  "Chiado no peito", "Tosse", "Coriza",
  "Olhos lacrimejando", "Irritabilidade", "Recusa alimentar",
  "Eczema", "Manchas vermelhas", "Coceira",
];

export const COMMON_ALLERGENS = [
  "Leite de vaca", "Ovo", "Amendoim", "Soja", "Trigo",
  "Peixe", "Camarão", "Morango", "Kiwi", "Tomate",
  "Laranja", "Mel", "Castanhas", "Chocolate", "Milho",
];

export function useAllergyDiary(babyProfileId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ["allergy-logs", user?.id, babyProfileId];

  const { data: logs = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = (supabase.from("baby_allergy_logs" as any).select("*") as any)
        .eq("user_id", user!.id)
        .order("introduction_date", { ascending: false });

      if (babyProfileId) query = query.eq("baby_profile_id", babyProfileId);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AllergyLog[];
    },
    enabled: !!user,
    ...QueryCacheConfig.list,
  });

  const addLog = useMutation({
    mutationFn: async (log: Record<string, unknown>) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await (supabase.from("baby_allergy_logs" as any).insert({
        ...log,
        user_id: user.id,
        baby_profile_id: babyProfileId || null,
      } as any).select().single() as any);
      if (error) throw error;
      return data as AllergyLog;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "🍎 Registrado!", description: `${data.food_name} adicionado ao diário` });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao registrar alimento", variant: "destructive" });
    },
  });

  const updateLog = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { data, error } = await (supabase.from("baby_allergy_logs" as any)
        .update(updates as any).eq("id", id).select().single() as any);
      if (error) throw error;
      return data as AllergyLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Atualizado", description: "Registro atualizado" });
    },
  });

  const removeLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("baby_allergy_logs" as any).delete().eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Removido", description: "Registro excluído" });
    },
  });

  // Stats
  const confirmedAllergies = logs.filter(l => l.is_confirmed_allergy);
  const safefoods = logs.filter(l => l.reaction_type === "none" && !l.is_confirmed_allergy);
  const pendingWatch = logs.filter(l => l.reaction_type !== "none" && !l.is_confirmed_allergy);

  return {
    logs,
    loading,
    addLog: addLog.mutateAsync,
    updateLog: (id: string, updates: Record<string, unknown>) => updateLog.mutateAsync({ id, updates }),
    removeLog: removeLog.mutateAsync,
    reload: () => queryClient.invalidateQueries({ queryKey }),
    confirmedAllergies,
    safefoods,
    pendingWatch,
  };
}
