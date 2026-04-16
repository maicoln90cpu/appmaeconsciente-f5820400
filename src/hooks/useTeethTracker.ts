import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { QueryCacheConfig } from "@/lib/query-config";
import { toast } from "sonner";

export interface ToothLog {
  id: string;
  user_id: string;
  baby_profile_id: string | null;
  tooth_number: number;
  tooth_name: string;
  tooth_position: string;
  noticed_date: string;
  symptoms: string[];
  pain_level: number;
  relief_methods: string[];
  notes: string | null;
  photo_url: string | null;
  created_at: string;
}

// 20 dentes decíduos na ordem típica de erupção
export const BABY_TEETH = [
  { number: 1, name: "Incisivo central inferior esquerdo", position: "lower", avgMonth: 6 },
  { number: 2, name: "Incisivo central inferior direito", position: "lower", avgMonth: 6 },
  { number: 3, name: "Incisivo central superior esquerdo", position: "upper", avgMonth: 8 },
  { number: 4, name: "Incisivo central superior direito", position: "upper", avgMonth: 8 },
  { number: 5, name: "Incisivo lateral superior esquerdo", position: "upper", avgMonth: 10 },
  { number: 6, name: "Incisivo lateral superior direito", position: "upper", avgMonth: 10 },
  { number: 7, name: "Incisivo lateral inferior esquerdo", position: "lower", avgMonth: 10 },
  { number: 8, name: "Incisivo lateral inferior direito", position: "lower", avgMonth: 10 },
  { number: 9, name: "1º Molar superior esquerdo", position: "upper", avgMonth: 14 },
  { number: 10, name: "1º Molar superior direito", position: "upper", avgMonth: 14 },
  { number: 11, name: "1º Molar inferior esquerdo", position: "lower", avgMonth: 14 },
  { number: 12, name: "1º Molar inferior direito", position: "lower", avgMonth: 14 },
  { number: 13, name: "Canino superior esquerdo", position: "upper", avgMonth: 18 },
  { number: 14, name: "Canino superior direito", position: "upper", avgMonth: 18 },
  { number: 15, name: "Canino inferior esquerdo", position: "lower", avgMonth: 18 },
  { number: 16, name: "Canino inferior direito", position: "lower", avgMonth: 18 },
  { number: 17, name: "2º Molar inferior esquerdo", position: "lower", avgMonth: 24 },
  { number: 18, name: "2º Molar inferior direito", position: "lower", avgMonth: 24 },
  { number: 19, name: "2º Molar superior esquerdo", position: "upper", avgMonth: 24 },
  { number: 20, name: "2º Molar superior direito", position: "upper", avgMonth: 24 },
];

export const TOOTH_SYMPTOMS = [
  "Irritabilidade", "Babar excessivo", "Gengiva inchada",
  "Febre baixa", "Dificuldade para dormir", "Perda de apetite",
  "Morder objetos", "Puxar orelha", "Diarreia leve",
];

export const RELIEF_METHODS = [
  "Mordedor gelado", "Massagem na gengiva", "Gel anestésico",
  "Medicação (prescrição)", "Paninho frio", "Alimentos gelados",
  "Camomila", "Distração/colo",
];

export function useTeethTracker(babyProfileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["teeth-logs", user?.id, babyProfileId];

  const { data: logs = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase.from("baby_teeth_logs").select("id, user_id, baby_profile_id, tooth_number, tooth_name, tooth_position, noticed_date, symptoms, pain_level, relief_methods, notes, photo_url, created_at, updated_at")
        .eq("user_id", user!.id)
        .order("noticed_date", { ascending: true });

      if (babyProfileId) query = query.eq("baby_profile_id", babyProfileId);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ToothLog[];
    },
    enabled: !!user,
    ...QueryCacheConfig.list,
  });

  const addTooth = useMutation({
    mutationFn: async (tooth: Omit<ToothLog, "id" | "user_id" | "created_at">) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase.from("baby_teeth_logs").insert({
        ...tooth,
        user_id: user.id,
      }).select().single();
      if (error) throw error;
      return data as ToothLog;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      toast("🦷 Dente registrado!", { description: `${data.tooth_name} anotado com sucesso` });
    },
    onError: () => {
      toast.error("Erro", { description: "Erro ao registrar dente" });
    },
  });

  const removeTooth = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("baby_teeth_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast("Removido", { description: "Registro excluído" });
    },
    onError: () => {
      toast.error("Erro", { description: "Erro ao remover registro" });
    },
  });

  return {
    logs,
    loading,
    addTooth: addTooth.mutateAsync,
    removeTooth: removeTooth.mutateAsync,
    reload: () => queryClient.invalidateQueries({ queryKey }),
  };
}
