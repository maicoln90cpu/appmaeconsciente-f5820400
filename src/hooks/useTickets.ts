import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { z } from "zod";
import { analytics } from "@/lib/analytics";

export interface Ticket {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string | null;
  is_admin_reply: boolean;
  message: string;
  created_at: string;
}

const ticketSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços"),
  email: z.string()
    .trim()
    .email("Email inválido")
    .max(255, "Email muito longo")
    .toLowerCase(),
  subject: z.string()
    .trim()
    .min(5, "Assunto deve ter pelo menos 5 caracteres")
    .max(200, "Assunto muito longo"),
  message: z.string()
    .trim()
    .min(20, "Mensagem deve ter pelo menos 20 caracteres")
    .max(2000, "Mensagem muito longa")
    .refine(
      (val) => {
        const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i];
        return !dangerousPatterns.some(pattern => pattern.test(val));
      },
      { message: "Mensagem contém código potencialmente perigoso" }
    ),
});

export type TicketFormData = z.infer<typeof ticketSchema>;

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadTickets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTickets((data || []) as Ticket[]);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast({
        title: "Erro ao carregar tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (formData: TicketFormData) => {
    try {
      // Rate limiting: verificar se usuário criou ticket recentemente
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from("support_tickets")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", fiveMinutesAgo);

        if (count && count >= 3) {
          toast({
            title: "Aguarde um momento",
            description: "Você atingiu o limite de 3 tickets em 5 minutos. Tente novamente mais tarde.",
            variant: "destructive",
          });
          return { success: false };
        }
      }

      const validatedData = ticketSchema.parse(formData);

      const ticketData: any = {
        ...validatedData,
      };

      if (user?.id) {
        ticketData.user_id = user.id;
      }

      const { data, error } = await supabase
        .from("support_tickets")
        .insert(ticketData)
        .select()
        .single();

      if (error) throw error;

      // Call edge function to send notification email
      await supabase.functions.invoke("notify-ticket-created", {
        body: { ticketId: data.id },
      });

      analytics.ticketCreated(data.id);
      toast({ title: "Ticket criado com sucesso!" });
      await loadTickets();
      
      return { success: true };
    } catch (error) {
      console.error("Error creating ticket:", error);
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar ticket",
          variant: "destructive",
        });
      }
      return { success: false };
    }
  };

  const addMessage = async (ticketId: string, message: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: ticketId,
        user_id: user.id,
        is_admin_reply: false,
        message,
      });

      if (error) throw error;

      toast({ title: "Mensagem enviada!" });
    } catch (error) {
      console.error("Error adding message:", error);
      toast({
        title: "Erro ao enviar mensagem",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  return {
    tickets,
    loading,
    createTicket,
    addMessage,
    reloadTickets: loadTickets,
  };
};
