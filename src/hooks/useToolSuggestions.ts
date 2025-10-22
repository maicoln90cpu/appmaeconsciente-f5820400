import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export interface ToolSuggestion {
  id: string;
  user_id: string;
  title: string;
  main_idea: string;
  problem_solved: string | null;
  main_functions: string;
  integrations: string[];
  phases: string[];
  target_audience: string | null;
  priority_rating: number;
  reference_examples: string | null;
  available_for_beta: boolean;
  contact_email: string;
  status: "pending" | "approved" | "in_development" | "implemented" | "rejected";
  admin_feedback: string | null;
  reward_granted: boolean;
  share_count: number;
  created_at: string;
  updated_at: string;
}

const suggestionSchema = z.object({
  title: z.string()
    .trim()
    .min(5, "Título deve ter pelo menos 5 caracteres")
    .max(100, "Título muito longo (máx 100 caracteres)"),
  main_idea: z.string()
    .trim()
    .min(50, "Descreva a ideia com pelo menos 50 caracteres")
    .max(500, "Ideia muito longa (máx 500 caracteres)"),
  problem_solved: z.string()
    .trim()
    .max(500, "Descrição muito longa (máx 500 caracteres)")
    .optional(),
  main_functions: z.string()
    .trim()
    .min(20, "Descreva as funções com pelo menos 20 caracteres")
    .max(1000, "Descrição muito longa (máx 1000 caracteres)"),
  integrations: z.array(z.string()).min(1, "Selecione pelo menos uma integração"),
  phases: z.array(z.string()).min(1, "Selecione pelo menos uma fase"),
  target_audience: z.string().optional(),
  priority_rating: z.number().min(1).max(5),
  reference_examples: z.string().trim().max(300, "Referências muito longas (máx 300 caracteres)").optional(),
  available_for_beta: z.boolean(),
  contact_email: z.string().email("Email inválido"),
});

export type ToolSuggestionFormData = z.infer<typeof suggestionSchema>;

export const useToolSuggestions = () => {
  const [suggestions, setSuggestions] = useState<ToolSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSuggestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("tool_suggestions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSuggestions((data || []) as ToolSuggestion[]);
    } catch (error) {
      console.error("Error loading suggestions:", error);
      toast({
        title: "Erro ao carregar sugestões",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSuggestion = async (formData: ToolSuggestionFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive",
        });
        return { success: false };
      }

      // Rate limiting: verificar se usuário criou sugestão recentemente
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("tool_suggestions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", oneDayAgo);

      if (count && count >= 3) {
        toast({
          title: "Limite atingido",
          description: "Você pode enviar no máximo 3 sugestões por dia. Tente novamente amanhã.",
          variant: "destructive",
        });
        return { success: false };
      }

      const validatedData = suggestionSchema.parse(formData);

      const suggestionInsert: any = {
        ...validatedData,
        user_id: user.id,
      };

      const { data: suggestionData, error: suggestionError } = await supabase
        .from("tool_suggestions")
        .insert(suggestionInsert)
        .select()
        .single();

      if (suggestionError) throw suggestionError;

      // Criar ticket vinculado
      const { error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          name: validatedData.contact_email.split('@')[0],
          email: validatedData.contact_email,
          subject: `Nova Sugestão de Ferramenta: ${validatedData.title}`,
          message: `Ideia: ${validatedData.main_idea}\n\nFunções: ${validatedData.main_functions}`,
          ticket_type: "tool_suggestion",
          related_suggestion_id: suggestionData.id,
          priority: validatedData.priority_rating >= 4 ? "high" : "medium",
        });

      if (ticketError) console.error("Error creating ticket:", ticketError);
      
      toast({ 
        title: "Sugestão enviada com sucesso!",
        description: "Vamos analisar sua ideia e entraremos em contato em breve.",
      });
      
      await loadSuggestions();
      
      return { success: true };
    } catch (error) {
      console.error("Error creating suggestion:", error);
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao enviar sugestão",
          variant: "destructive",
        });
      }
      return { success: false };
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  return {
    suggestions,
    loading,
    createSuggestion,
    reloadSuggestions: loadSuggestions,
  };
};
