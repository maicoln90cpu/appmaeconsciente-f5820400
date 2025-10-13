import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState } from "react";
import { MessageSquare } from "lucide-react";

export const TicketManagement = () => {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      toast.success("Status atualizado");
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: ticketId,
        user_id: user.id,
        message,
        is_admin_reply: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      setReplyMessage("");
      setSelectedTicket(null);
      toast.success("Resposta enviada");
    },
  });

  const handleReply = (ticketId: string) => {
    if (!replyMessage.trim()) return;
    replyMutation.mutate({ ticketId, message: replyMessage });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "destructive";
      case "in_progress": return "default";
      case "resolved": return "secondary";
      default: return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  if (isLoading) {
    return <div>Carregando tickets...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Gerenciamento de Tickets</h2>
      <div className="grid gap-4">
        {tickets?.map((ticket) => (
          <Card key={ticket.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                  <div className="flex gap-2 items-center text-sm text-muted-foreground">
                    <span>{ticket.name}</span>
                    <span>•</span>
                    <span>{ticket.email}</span>
                    <span>•</span>
                    <span>{format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                  <Badge variant={getStatusColor(ticket.status)}>
                    {ticket.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{ticket.message}</p>
              
              <div className="flex gap-2 items-center">
                <Select
                  value={ticket.status}
                  onValueChange={(value) =>
                    updateStatusMutation.mutate({ id: ticket.id, status: value })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="in_progress">Em progresso</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Responder
                </Button>
              </div>

              {selectedTicket === ticket.id && (
                <div className="space-y-2 pt-4 border-t">
                  <Textarea
                    placeholder="Digite sua resposta..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTicket(null);
                        setReplyMessage("");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReply(ticket.id)}
                      disabled={!replyMessage.trim() || replyMutation.isPending}
                    >
                      Enviar Resposta
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
