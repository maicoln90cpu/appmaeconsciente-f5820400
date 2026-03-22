import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import logger from "@/lib/logger";

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
  const [logs, setLogs] = useState<AllergyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) { setLogs([]); return; }

      let query = (supabase.from("baby_allergy_logs" as any).select("*") as any)
        .eq("user_id", userData.user.id)
        .order("introduction_date", { ascending: false });

      if (babyProfileId) query = query.eq("baby_profile_id", babyProfileId);

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data || []) as AllergyLog[]);
    } catch (e) {
      logger.error("Error loading allergy logs", e);
    } finally {
      setLoading(false);
    }
  }, [babyProfileId]);

  const addLog = useCallback(async (log: Record<string, unknown>) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error("Não autenticado");

    const { data, error } = await (supabase.from("baby_allergy_logs" as any).insert({
      ...log,
      user_id: userData.user.id,
      baby_profile_id: babyProfileId || null,
    } as any).select().single() as any);

    if (error) {
      toast({ title: "Erro", description: "Erro ao registrar alimento", variant: "destructive" });
      throw error;
    }

    setLogs(prev => [data as AllergyLog, ...prev]);
    toast({ title: "🍎 Registrado!", description: `${(log as any).food_name} adicionado ao diário` });
    return data as AllergyLog;
  }, [babyProfileId, toast]);

  const updateLog = useCallback(async (id: string, updates: Record<string, unknown>) => {
    const { data, error } = await (supabase.from("baby_allergy_logs" as any)
      .update(updates as any).eq("id", id).select().single() as any);

    if (error) throw error;
    setLogs(prev => prev.map(l => l.id === id ? data as AllergyLog : l));
    toast({ title: "Atualizado", description: "Registro atualizado" });
    return data as AllergyLog;
  }, [toast]);

  const removeLog = useCallback(async (id: string) => {
    const { error } = await (supabase.from("baby_allergy_logs" as any).delete().eq("id", id) as any);
    if (error) throw error;
    setLogs(prev => prev.filter(l => l.id !== id));
    toast({ title: "Removido", description: "Registro excluído" });
  }, [toast]);

  // Stats
  const confirmedAllergies = logs.filter(l => l.is_confirmed_allergy);
  const safefoods = logs.filter(l => l.reaction_type === "none" && !l.is_confirmed_allergy);
  const pendingWatch = logs.filter(l => l.reaction_type !== "none" && !l.is_confirmed_allergy);

  useEffect(() => { load(); }, [load]);

  return { logs, loading, addLog, updateLog, removeLog, reload: load, confirmedAllergies, safefoods, pendingWatch };
}
