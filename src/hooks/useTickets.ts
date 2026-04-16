import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';
import { analytics } from '@/lib/analytics';
import { QueryKeys, QueryCacheConfig } from '@/lib/query-config';
import { toast } from 'sonner';

export interface Ticket {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
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
  name: z
    .string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo').toLowerCase(),
  subject: z
    .string()
    .trim()
    .min(5, 'Assunto deve ter pelo menos 5 caracteres')
    .max(200, 'Assunto muito longo'),
  message: z
    .string()
    .trim()
    .min(20, 'Mensagem deve ter pelo menos 20 caracteres')
    .max(2000, 'Mensagem muito longa')
    .refine(
      val => {
        const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i];
        return !dangerousPatterns.some(pattern => pattern.test(val));
      },
      { message: 'Mensagem contém código potencialmente perigoso' }
    ),
});

export type TicketFormData = z.infer<typeof ticketSchema>;

export const useTickets = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = QueryKeys.tickets(user?.id ?? '');

  const {
    data: tickets = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<Ticket[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('support_tickets')
        .select(
          'id, user_id, name, email, subject, message, status, priority, created_at, updated_at'
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tickets:', error);
        throw error;
      }

      return (data || []) as Ticket[];
    },
    enabled: !!user,
    staleTime: QueryCacheConfig.realtime.staleTime,
    gcTime: QueryCacheConfig.realtime.gcTime,
  });

  const createTicketMutation = useMutation({
    mutationFn: async (formData: TicketFormData) => {
      // Rate limiting: verificar se usuário criou ticket recentemente
      if (user) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from('support_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', fiveMinutesAgo);

        if (count && count >= 3) {
          throw new Error('RATE_LIMIT');
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
        .from('support_tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) throw error;

      // Call edge function to send notification email
      await supabase.functions.invoke('notify-ticket-created', {
        body: { ticketId: data.id },
      });

      analytics.ticketCreated(data.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast('Ticket criado com sucesso!');
    },
    onError: error => {
      console.error('Error creating ticket:', error);

      if (error.message === 'RATE_LIMIT') {
        toast.error('Aguarde um momento', {
          description:
            'Você atingiu o limite de 3 tickets em 5 minutos. Tente novamente mais tarde.',
        });
        return;
      }

      if (error instanceof z.ZodError) {
        toast.error('Erro de validação', { description: error.errors[0].message });
      } else {
        toast.error('Erro ao criar ticket');
      }
    },
  });

  const addMessageMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('ticket_messages').insert({
        ticket_id: ticketId,
        user_id: user.id,
        is_admin_reply: false,
        message,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast('Mensagem enviada!');
    },
    onError: error => {
      console.error('Error adding message:', error);
      toast.error('Erro ao enviar mensagem');
    },
  });

  const createTicket = async (formData: TicketFormData) => {
    try {
      await createTicketMutation.mutateAsync(formData);
      return { success: true };
    } catch {
      return { success: false };
    }
  };

  const addMessage = async (ticketId: string, message: string) => {
    await addMessageMutation.mutateAsync({ ticketId, message });
  };

  return {
    tickets,
    loading,
    createTicket,
    addMessage,
    reloadTickets: refetch,
  };
};
