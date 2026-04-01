import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { useSortableTable } from "@/hooks/useSortableTable";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState } from "react";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { getTicketStatusBadgeVariant, getTicketStatusLabel, getTicketPriorityBadgeVariant } from "@/lib/ticket-utils";

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

  const { sortedData, sortKey, sortDirection, handleSort } = useSortableTable(tickets, {
    key: "created_at" as any,
    direction: "desc",
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open": return "Aberto";
      case "in_progress": return "Em progresso";
      case "resolved": return "Resolvido";
      default: return status;
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

  const sortHandler = (key: string) => handleSort(key as any);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Gerenciamento de Tickets</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead sortKey="subject" currentSortKey={sortKey as string} sortDirection={sortDirection} onSort={sortHandler}>
              Assunto
            </SortableTableHead>
            <SortableTableHead sortKey="name" currentSortKey={sortKey as string} sortDirection={sortDirection} onSort={sortHandler}>
              Nome
            </SortableTableHead>
            <SortableTableHead sortKey="email" currentSortKey={sortKey as string} sortDirection={sortDirection} onSort={sortHandler}>
              Email
            </SortableTableHead>
            <SortableTableHead sortKey="created_at" currentSortKey={sortKey as string} sortDirection={sortDirection} onSort={sortHandler}>
              Data
            </SortableTableHead>
            <SortableTableHead sortKey="priority" currentSortKey={sortKey as string} sortDirection={sortDirection} onSort={sortHandler}>
              Prioridade
            </SortableTableHead>
            <SortableTableHead sortKey="status" currentSortKey={sortKey as string} sortDirection={sortDirection} onSort={sortHandler}>
              Status
            </SortableTableHead>
            <SortableTableHead>Ações</SortableTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData?.map((ticket) => (
            <React.Fragment key={ticket.id}>
              <TableRow>
                <TableCell className="font-medium max-w-[200px] truncate">{ticket.subject}</TableCell>
                <TableCell>{ticket.name}</TableCell>
                <TableCell className="max-w-[180px] truncate">{ticket.email}</TableCell>
                <TableCell className="whitespace-nowrap">{format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                <TableCell>
                  <Badge variant={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={ticket.status}
                    onValueChange={(value) => updateStatusMutation.mutate({ id: ticket.id, status: value })}
                  >
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em progresso</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {selectedTicket === ticket.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </TableCell>
              </TableRow>
              {selectedTicket === ticket.id && (
                <TableRow key={`${ticket.id}-reply`}>
                  <TableCell colSpan={7} className="bg-muted/30">
                    <div className="space-y-3 p-2">
                      <p className="text-sm text-muted-foreground">{ticket.message}</p>
                      <Textarea
                        placeholder="Digite sua resposta..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedTicket(null); setReplyMessage(""); }}>
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={() => handleReply(ticket.id)} disabled={!replyMessage.trim() || replyMutation.isPending}>
                          Enviar Resposta
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
