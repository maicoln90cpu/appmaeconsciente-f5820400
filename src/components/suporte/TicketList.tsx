import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "@/hooks/useTickets";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";

interface TicketListProps {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
}

const statusConfig = {
  open: { label: "Aberto", color: "bg-blue-500", icon: Clock },
  in_progress: { label: "Em Progresso", color: "bg-yellow-500", icon: AlertCircle },
  resolved: { label: "Resolvido", color: "bg-green-500", icon: CheckCircle2 },
  closed: { label: "Fechado", color: "bg-gray-500", icon: XCircle },
};

const priorityConfig = {
  low: { label: "Baixa", color: "secondary" },
  medium: { label: "Média", color: "default" },
  high: { label: "Alta", color: "destructive" },
};

export const TicketList = ({ tickets, onTicketClick }: TicketListProps) => {
  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Você ainda não possui tickets de suporte.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => {
        const StatusIcon = statusConfig[ticket.status].icon;
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
                  <p className="text-sm text-muted-foreground mt-1">
                    Criado {timeAgo}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge
                    variant={priorityConfig[ticket.priority].color as any}
                    className="whitespace-nowrap"
                  >
                    {priorityConfig[ticket.priority].label}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <div className={`h-2 w-2 rounded-full ${statusConfig[ticket.status].color}`} />
                    <span className="text-xs">{statusConfig[ticket.status].label}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {ticket.message}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
