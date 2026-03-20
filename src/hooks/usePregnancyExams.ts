import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { getAuthenticatedUser } from "@/hooks/useAuthenticatedAction";
import { logger } from "@/lib/logger";
import { useEffect, useRef } from "react";

export interface PregnancyExam {
  id: string;
  user_id: string;
  exam_name: string;
  trimester: number;
  category: string;
  scheduled_date: string | null;
  completed: boolean;
  completed_date: string | null;
  result_notes: string | null;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

// Exames padrão do Ministério da Saúde + comuns do particular
const DEFAULT_EXAMS = [
  // 1º Trimestre
  { exam_name: "Hemograma completo", trimester: 1, category: "ambos" },
  { exam_name: "Tipagem sanguínea (ABO/Rh)", trimester: 1, category: "ambos" },
  { exam_name: "Glicemia de jejum", trimester: 1, category: "ambos" },
  { exam_name: "Urina tipo I (EAS)", trimester: 1, category: "ambos" },
  { exam_name: "Urocultura", trimester: 1, category: "ambos" },
  { exam_name: "Sorologia HIV", trimester: 1, category: "ambos" },
  { exam_name: "Sorologia Sífilis (VDRL)", trimester: 1, category: "ambos" },
  { exam_name: "Sorologia Hepatite B (HBsAg)", trimester: 1, category: "ambos" },
  { exam_name: "Sorologia Toxoplasmose", trimester: 1, category: "ambos" },
  { exam_name: "Sorologia Rubéola", trimester: 1, category: "ambos" },
  { exam_name: "Ultrassom Transvaginal (1º tri)", trimester: 1, category: "ambos" },
  { exam_name: "NIPT (Teste Genético Não-Invasivo)", trimester: 1, category: "particular" },
  { exam_name: "Translucência Nucal", trimester: 1, category: "ambos" },
  // 2º Trimestre
  { exam_name: "Ultrassom Morfológico (20-24 sem)", trimester: 2, category: "ambos" },
  { exam_name: "TOTG 75g (Curva Glicêmica)", trimester: 2, category: "ambos" },
  { exam_name: "Hemograma (repetição)", trimester: 2, category: "ambos" },
  { exam_name: "Coombs Indireto (se Rh-)", trimester: 2, category: "ambos" },
  { exam_name: "Ecocardiografia Fetal", trimester: 2, category: "particular" },
  { exam_name: "Urina tipo I (repetição)", trimester: 2, category: "ambos" },
  // 3º Trimestre
  { exam_name: "Hemograma (3º tri)", trimester: 3, category: "ambos" },
  { exam_name: "Sorologia HIV (repetição)", trimester: 3, category: "ambos" },
  { exam_name: "Sorologia Sífilis (repetição)", trimester: 3, category: "ambos" },
  { exam_name: "Sorologia Hepatite B (repetição)", trimester: 3, category: "ambos" },
  { exam_name: "Cultura Streptococcus B (35-37 sem)", trimester: 3, category: "ambos" },
  { exam_name: "Ultrassom Obstétrico (3º tri)", trimester: 3, category: "ambos" },
  { exam_name: "Cardiotocografia (CTG)", trimester: 3, category: "ambos" },
  { exam_name: "Perfil Biofísico Fetal", trimester: 3, category: "particular" },
];

export function usePregnancyExams() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const seededRef = useRef(false);

  const { data: exams = [], isLoading, refetch } = useQuery({
    queryKey: ["pregnancy-exams"],
    queryFn: async () => {
      const userId = await getAuthenticatedUser();
      const { data, error } = await (supabase
        .from("pregnancy_exams" as any)
        .select("*") as any)
        .eq("user_id", userId)
        .order("trimester", { ascending: true })
        .order("exam_name", { ascending: true });
      if (error) throw error;
      return data as PregnancyExam[];
    },
  });

  // Seed exames padrão no primeiro acesso
  useEffect(() => {
    if (!isLoading && exams.length === 0 && !seededRef.current) {
      seededRef.current = true;
      seedDefaultExams();
    }
  }, [isLoading, exams.length]);

  const seedDefaultExams = async () => {
    try {
      const userId = await getAuthenticatedUser();
      const rows = DEFAULT_EXAMS.map((e) => ({ ...e, user_id: userId }));
      const { error } = await (supabase
        .from("pregnancy_exams" as any)
        .insert(rows as any) as any);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["pregnancy-exams"] });
    } catch (e) {
      logger.error("Seed exams error", e);
    }
  };

  const toggleCompleted = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const updates: any = { completed, completed_date: completed ? new Date().toISOString().split("T")[0] : null };
      const { error } = await (supabase
        .from("pregnancy_exams" as any)
        .update(updates)
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pregnancy-exams"] });
    },
  });

  const updateExam = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; scheduled_date?: string; result_notes?: string }) => {
      const { error } = await (supabase
        .from("pregnancy_exams" as any)
        .update(updates as any)
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pregnancy-exams"] });
      toast({ title: "Exame atualizado ✅" });
    },
  });

  const addCustomExam = useMutation({
    mutationFn: async (exam: { exam_name: string; trimester: number; category: string }) => {
      const userId = await getAuthenticatedUser();
      const { error } = await (supabase
        .from("pregnancy_exams" as any)
        .insert({ ...exam, user_id: userId, is_custom: true } as any) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pregnancy-exams"] });
      toast({ title: "Exame adicionado ✅" });
    },
  });

  const deleteExam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from("pregnancy_exams" as any)
        .delete()
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pregnancy-exams"] });
      toast({ title: "Exame removido" });
    },
  });

  const completedCount = exams.filter((e) => e.completed).length;
  const totalCount = exams.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    exams,
    isLoading,
    refetch,
    toggleCompleted: toggleCompleted.mutate,
    updateExam: updateExam.mutate,
    addCustomExam: addCustomExam.mutate,
    deleteExam: deleteExam.mutate,
    completedCount,
    totalCount,
    progressPercent,
  };
}
