import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

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
  name: z.string().trim().min(1, "Nome é obrigatório").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  subject: z.string().trim().min(1, "Assunto é obrigatório").max(200),
  message: z.string().trim().min(10, "Mensagem deve ter pelo menos 10 caracteres").max(2000),
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
      const validatedData = ticketSchema.parse(formData);
      
      const { data: { user } } = await supabase.auth.getUser();

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
