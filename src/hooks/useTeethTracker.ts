import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import logger from "@/lib/logger";

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
  const [logs, setLogs] = useState<ToothLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) { setLogs([]); return; }

      let query = (supabase.from("baby_teeth_logs" as any).select("*") as any)
        .eq("user_id", userData.user.id)
        .order("noticed_date", { ascending: true });

      if (babyProfileId) query = query.eq("baby_profile_id", babyProfileId);

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data || []) as ToothLog[]);
    } catch (e) {
      logger.error("Error loading teeth logs", e);
    } finally {
      setLoading(false);
    }
  }, [babyProfileId]);

  const addTooth = useCallback(async (tooth: Omit<ToothLog, "id" | "user_id" | "created_at">) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error("Não autenticado");

    const { data, error } = await (supabase.from("baby_teeth_logs" as any).insert({
      ...tooth,
      user_id: userData.user.id,
    } as any).select().single() as any);

    if (error) {
      toast({ title: "Erro", description: "Erro ao registrar dente", variant: "destructive" });
      throw error;
    }

    setLogs(prev => [...prev, data as ToothLog]);
    toast({ title: "🦷 Dente registrado!", description: `${tooth.tooth_name} anotado com sucesso` });
    return data as ToothLog;
  }, [toast]);

  const removeTooth = useCallback(async (id: string) => {
    const { error } = await (supabase.from("baby_teeth_logs" as any).delete().eq("id", id) as any);
    if (error) {
      toast({ title: "Erro", description: "Erro ao remover registro", variant: "destructive" });
      throw error;
    }
    setLogs(prev => prev.filter(l => l.id !== id));
    toast({ title: "Removido", description: "Registro excluído" });
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  return { logs, loading, addTooth, removeTooth, reload: load };
}
