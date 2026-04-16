import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Ticket } from '@/hooks/useTickets';


import {
  TICKET_STATUS_CONFIG,
  TICKET_PRIORITY_CONFIG,
  type TicketStatus,
  type TicketPriority,
} from '@/lib/ticket-utils';

interface TicketListProps {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
}

export const TicketList = ({ tickets, onTicketClick }: TicketListProps) => {
  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Você ainda não possui tickets de suporte.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map(ticket => {
        const statusCfg = TICKET_STATUS_CONFIG[ticket.status as TicketStatus];
        const priorityCfg = TICKET_PRIORITY_CONFIG[ticket.priority as TicketPriority];
        const StatusIcon = statusCfg?.icon;
        const timeAgo = formatDistanceToNow(new Date(ticket.created_at), {
          addSuffix: true,
          locale: ptBR,
        });

        return (
          <Card
            key={ticket.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onTicketClick(ticket)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Criado {timeAgo}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge
                    variant={priorityCfg?.badgeVariant ?? 'secondary'}
                    className="whitespace-nowrap"
                  >
                    {priorityCfg?.label ?? ticket.priority}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <div
                      className={`h-2 w-2 rounded-full ${statusCfg?.dotColor ?? 'bg-gray-500'}`}
                    />
                    <span className="text-xs">{statusCfg?.label ?? ticket.status}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{ticket.message}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
