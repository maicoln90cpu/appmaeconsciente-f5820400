import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import logger from "@/lib/logger";

export interface StimulationActivity {
  id: string;
  user_id: string;
  baby_profile_id: string | null;
  title: string;
  description: string | null;
  category: string;
  age_range_start: number;
  age_range_end: number;
  duration_minutes: number;
  materials: string[];
  development_areas: string[];
  is_favorite: boolean;
  completed_count: number;
  last_done_at: string | null;
  is_custom: boolean;
  created_at: string;
}

export const ACTIVITY_CATEGORIES = [
  { value: "motor", label: "Motor", icon: "🏃" },
  { value: "cognitive", label: "Cognitivo", icon: "🧠" },
  { value: "language", label: "Linguagem", icon: "🗣️" },
  { value: "social", label: "Social", icon: "👶" },
  { value: "sensory", label: "Sensorial", icon: "✋" },
];

export const DEVELOPMENT_AREAS = [
  "Coordenação motora fina", "Coordenação motora grossa",
  "Cognição", "Linguagem receptiva", "Linguagem expressiva",
  "Socialização", "Percepção visual", "Percepção auditiva",
  "Percepção tátil", "Equilíbrio", "Resolução de problemas",
];

// Banco pré-carregado de atividades por faixa etária
export const DEFAULT_ACTIVITIES: Omit<StimulationActivity, "id" | "user_id" | "baby_profile_id" | "is_favorite" | "completed_count" | "last_done_at" | "is_custom" | "created_at">[] = [
  // 0-3 meses
  { title: "Tummy Time", description: "Coloque o bebê de bruços por curtos períodos para fortalecer pescoço e tronco. Use brinquedos coloridos à frente.", category: "motor", age_range_start: 0, age_range_end: 3, duration_minutes: 5, materials: ["Tapete macio", "Brinquedo colorido"], development_areas: ["Coordenação motora grossa", "Percepção visual"] },
  { title: "Seguir com o olhar", description: "Mova um objeto colorido lentamente de um lado ao outro na frente do bebê.", category: "cognitive", age_range_start: 0, age_range_end: 3, duration_minutes: 5, materials: ["Chocalho colorido"], development_areas: ["Percepção visual", "Cognição"] },
  { title: "Conversa e canção", description: "Converse e cante para o bebê olhando nos olhos dele. Varie tons e expressões.", category: "language", age_range_start: 0, age_range_end: 3, duration_minutes: 10, materials: [], development_areas: ["Linguagem receptiva", "Socialização"] },
  { title: "Massagem sensorial", description: "Massageie suavemente braços, pernas e barriga com diferentes texturas.", category: "sensory", age_range_start: 0, age_range_end: 3, duration_minutes: 10, materials: ["Óleo de bebê", "Tecidos variados"], development_areas: ["Percepção tátil", "Socialização"] },
  // 3-6 meses
  { title: "Alcançar objetos", description: "Segure brinquedos ao alcance do bebê para que tente pegá-los.", category: "motor", age_range_start: 3, age_range_end: 6, duration_minutes: 10, materials: ["Mordedor", "Chocalho"], development_areas: ["Coordenação motora fina", "Cognição"] },
  { title: "Espelho mágico", description: "Coloque um espelho seguro à frente do bebê e observe as reações.", category: "social", age_range_start: 3, age_range_end: 6, duration_minutes: 10, materials: ["Espelho seguro"], development_areas: ["Socialização", "Cognição"] },
  { title: "Livro de texturas", description: "Passe as mãos do bebê em diferentes texturas de livros sensoriais.", category: "sensory", age_range_start: 3, age_range_end: 6, duration_minutes: 10, materials: ["Livro sensorial"], development_areas: ["Percepção tátil", "Cognição"] },
  // 6-9 meses
  { title: "Cesto de tesouros", description: "Ofereça um cesto com objetos variados e seguros para exploração.", category: "sensory", age_range_start: 6, age_range_end: 9, duration_minutes: 15, materials: ["Cesto", "Colher de pau", "Esponja", "Tecido"], development_areas: ["Percepção tátil", "Coordenação motora fina", "Cognição"] },
  { title: "Cadê? Achou!", description: "Brinque de esconder o rosto e objetos, trabalhando a permanência do objeto.", category: "cognitive", age_range_start: 6, age_range_end: 9, duration_minutes: 10, materials: ["Pano leve"], development_areas: ["Cognição", "Socialização"] },
  { title: "Tamborzinho", description: "Ofereça potes e colheres para o bebê bater e explorar sons.", category: "sensory", age_range_start: 6, age_range_end: 9, duration_minutes: 10, materials: ["Pote plástico", "Colher de pau"], development_areas: ["Percepção auditiva", "Coordenação motora grossa"] },
  // 9-12 meses
  { title: "Empilhar e derrubar", description: "Use blocos ou potes empilháveis. Ajude a empilhar e deixe derrubar.", category: "motor", age_range_start: 9, age_range_end: 12, duration_minutes: 15, materials: ["Blocos de empilhar"], development_areas: ["Coordenação motora fina", "Resolução de problemas"] },
  { title: "Primeiro desenho", description: "Giz de cera grosso em papel grande. Deixe rabiscar livremente.", category: "motor", age_range_start: 9, age_range_end: 12, duration_minutes: 10, materials: ["Giz de cera grosso", "Papel grande"], development_areas: ["Coordenação motora fina", "Cognição"] },
  { title: "Apontar e nomear", description: "Aponte para objetos, animais e pessoas nomeando cada um.", category: "language", age_range_start: 9, age_range_end: 12, duration_minutes: 10, materials: ["Livro com figuras"], development_areas: ["Linguagem receptiva", "Linguagem expressiva", "Cognição"] },
  { title: "Circuito de obstáculos", description: "Crie um percurso seguro com almofadas para o bebê engatinhar/andar.", category: "motor", age_range_start: 9, age_range_end: 12, duration_minutes: 15, materials: ["Almofadas", "Túnel de tecido"], development_areas: ["Coordenação motora grossa", "Equilíbrio", "Resolução de problemas"] },
];

export function useStimulationBank(babyProfileId?: string) {
  const [activities, setActivities] = useState<StimulationActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) { setActivities([]); return; }

      let query = (supabase.from("baby_stimulation_activities" as any).select("*") as any)
        .eq("user_id", userData.user.id)
        .order("category", { ascending: true });

      if (babyProfileId) query = query.eq("baby_profile_id", babyProfileId);

      const { data, error } = await query;
      if (error) throw error;
      setActivities((data || []) as StimulationActivity[]);
    } catch (e) {
      logger.error("Error loading stimulation activities", e);
    } finally {
      setLoading(false);
    }
  }, [babyProfileId]);

  const seedDefaults = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const items = DEFAULT_ACTIVITIES.map(a => ({
      ...a,
      user_id: userData.user.id,
      baby_profile_id: babyProfileId || null,
      is_custom: false,
      is_favorite: false,
      completed_count: 0,
    }));

    const { error } = await (supabase.from("baby_stimulation_activities" as any).insert(items as any) as any);
    if (error) {
      toast({ title: "Erro", description: "Erro ao carregar atividades", variant: "destructive" });
      return;
    }
    toast({ title: "✨ Atividades carregadas!", description: `${items.length} atividades disponíveis` });
    await load();
  }, [babyProfileId, load, toast]);

  const addActivity = useCallback(async (activity: Record<string, unknown>) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error("Não autenticado");

    const { data, error } = await (supabase.from("baby_stimulation_activities" as any).insert({
      ...activity,
      user_id: userData.user.id,
      is_custom: true,
    } as any).select().single() as any);

    if (error) throw error;
    setActivities(prev => [...prev, data as StimulationActivity]);
    toast({ title: "Atividade criada!", description: "Nova atividade adicionada" });
    return data as StimulationActivity;
  }, [toast]);

  const markDone = useCallback(async (id: string) => {
    const { data, error } = await (supabase.from("baby_stimulation_activities" as any)
      .update({ completed_count: activities.find(a => a.id === id)!.completed_count + 1, last_done_at: new Date().toISOString() } as any)
      .eq("id", id).select().single() as any);

    if (error) throw error;
    setActivities(prev => prev.map(a => a.id === id ? data as StimulationActivity : a));
    toast({ title: "✅ Feito!", description: "Atividade registrada" });
  }, [activities, toast]);

  const toggleFavorite = useCallback(async (id: string) => {
    const current = activities.find(a => a.id === id);
    if (!current) return;

    const { data, error } = await (supabase.from("baby_stimulation_activities" as any)
      .update({ is_favorite: !current.is_favorite } as any)
      .eq("id", id).select().single() as any);

    if (error) throw error;
    setActivities(prev => prev.map(a => a.id === id ? data as StimulationActivity : a));
  }, [activities]);

  const removeActivity = useCallback(async (id: string) => {
    const { error } = await (supabase.from("baby_stimulation_activities" as any).delete().eq("id", id) as any);
    if (error) throw error;
    setActivities(prev => prev.filter(a => a.id !== id));
    toast({ title: "Removido", description: "Atividade excluída" });
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  return { activities, loading, addActivity, markDone, toggleFavorite, removeActivity, seedDefaults, reload: load };
}
