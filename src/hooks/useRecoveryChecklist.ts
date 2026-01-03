import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type RecoveryChecklistRow = Database['public']['Tables']['recovery_checklist']['Row'];

export interface RecoveryChecklistItem extends RecoveryChecklistRow {}

// Template de checklist por semana
export const RECOVERY_TIMELINE = [
  {
    week: 1,
    title: "Semana 1: Descanso e Recuperação Inicial",
    items: [
      "Descansar sempre que o bebê dormir",
      "Manter hidratação adequada (8-10 copos de água)",
      "Alimentar-se regularmente (5-6 refeições pequenas)",
      "Cuidar da higiene íntima (banho diário)",
      "Monitorar sangramento e cicatrização",
      "Evitar esforço físico e carregar peso",
    ],
  },
  {
    week: 2,
    title: "Semana 2: Adaptação e Autocuidado",
    items: [
      "Manter rotina de hidratação e alimentação",
      "Começar pequenas caminhadas dentro de casa",
      "Cuidar da cicatrização (pontos ou cesárea)",
      "Registrar sintomas diariamente",
      "Aceitar ajuda de familiares",
      "Descansar entre mamadas",
    ],
  },
  {
    week: 3,
    title: "Semana 3: Movimento Suave",
    items: [
      "Caminhar 10-15 minutos por dia",
      "Praticar exercícios respiratórios",
      "Alongamentos leves",
      "Manter alimentação nutritiva",
      "Monitorar energia e sono",
      "Conversar sobre sentimentos",
    ],
  },
  {
    week: 4,
    title: "Semana 4: Fortalecimento Gradual",
    items: [
      "Aumentar caminhadas para 20-30 minutos",
      "Iniciar exercícios pélvicos leves",
      "Praticar postura correta ao amamentar",
      "Retomar atividades domésticas leves",
      "Planejar consulta de revisão (6 semanas)",
      "Cuidar da saúde emocional",
    ],
  },
  {
    week: 5,
    title: "Semana 5: Bem-estar Emocional",
    items: [
      "Fazer Edinburgh Depression Scale",
      "Conversar sobre sentimentos com alguém de confiança",
      "Separar tempo para autocuidado (banho relaxante, leitura)",
      "Manter exercícios leves diariamente",
      "Dormir quando possível",
      "Pedir ajuda quando necessário",
    ],
  },
  {
    week: 6,
    title: "Semana 6: Reavaliação e Continuidade",
    items: [
      "Consulta de revisão ginecológica",
      "Avaliar recuperação física e emocional",
      "Discutir contracepção com médico",
      "Planejar retorno gradual às atividades",
      "Continuar exercícios pélvicos",
      "Celebrar conquistas da recuperação 💕",
    ],
  },
];

export const useRecoveryChecklist = (weekNumber?: number) => {
  const queryClient = useQueryClient();

  const { data: checklist, isLoading } = useQuery({
    queryKey: ['recovery-checklist', weekNumber],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('recovery_checklist')
        .select('*')
        .eq('user_id', user.id);

      if (weekNumber) {
        query = query.eq('week_number', weekNumber);
      }

      const { data, error } = await query.order('week_number', { ascending: true });

      if (error) throw error;
      return data as RecoveryChecklistItem[];
    },
  });

  const initializeWeek = useMutation({
    mutationFn: async (week: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const weekTemplate = RECOVERY_TIMELINE.find(t => t.week === week);
      if (!weekTemplate) throw new Error('Week not found');

      const items = weekTemplate.items.map(itemText => ({
        user_id: user.id,
        week_number: week,
        item: itemText,
        completed: false,
      }));

      const { error } = await supabase
        .from('recovery_checklist')
        .insert(items);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recovery-checklist'] });
    },
  });

  const toggleItem = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from('recovery_checklist')
        .update({ 
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recovery-checklist'] });
      toast.success('✅ Item atualizado');
    },
  });

  return {
    checklist,
    isLoading,
    initializeWeek: initializeWeek.mutate,
    toggleItem: toggleItem.mutate,
  };
};
