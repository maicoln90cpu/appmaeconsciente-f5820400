import { useState, useEffect } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Ticket, TicketMessage, useTickets } from '@/hooks/useTickets';

import { TICKET_STATUS_CONFIG, type TicketStatus } from '@/lib/ticket-utils';

import { supabase } from '@/integrations/supabase/client';

interface TicketDetailProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
}

export const TicketDetail = ({ ticket, open, onClose }: TicketDetailProps) => {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { addMessage } = useTickets();

  useEffect(() => {
    if (ticket) {
      loadMessages();
    }
  }, [ticket]);

  const loadMessages = async () => {
    if (!ticket) return;

    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const handleSendMessage = async () => {
    if (!ticket || !newMessage.trim()) return;

    await addMessage(ticket.id, newMessage);
    setNewMessage('');
    loadMessages();
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle>{ticket.subject}</DialogTitle>
            <div className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${TICKET_STATUS_CONFIG[ticket.status as TicketStatus]?.dotColor ?? 'bg-gray-500'}`}
              />
              <span className="text-xs">
                {TICKET_STATUS_CONFIG[ticket.status as TicketStatus]?.label ?? ticket.status}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-semibold mb-1">Mensagem Inicial</p>
            <p className="text-sm">{ticket.message}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(ticket.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>

          {messages.length > 0 && (
            <ScrollArea className="h-64">
              <div className="space-y-3 pr-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.is_admin_reply ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-semibold">
                        {message.is_admin_reply ? 'Suporte' : 'Você'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {ticket.status !== 'closed' && (
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                maxLength={1000}
              />
              <Button size="icon" onClick={handleSendMessage} aria-label="Enviar mensagem">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
