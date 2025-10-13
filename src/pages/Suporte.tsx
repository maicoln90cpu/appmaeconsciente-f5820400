import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketForm } from "@/components/suporte/TicketForm";
import { TicketList } from "@/components/suporte/TicketList";
import { TicketDetail } from "@/components/suporte/TicketDetail";
import { useTickets, Ticket } from "@/hooks/useTickets";
import { Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const Suporte = () => {
  const { tickets, loading } = useTickets();
  const { profile } = useProfile();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Suporte</h1>
          <p className="text-muted-foreground">
            Precisa de ajuda? Abra um ticket e nossa equipe responderá em breve
          </p>
        </div>

        <Tabs defaultValue="criar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="criar">Criar Ticket</TabsTrigger>
            <TabsTrigger value="meus">Meus Tickets ({tickets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="criar" className="mt-6">
            <TicketForm />
          </TabsContent>

          <TabsContent value="meus" className="mt-6">
            {profile ? (
              <TicketList tickets={tickets} onTicketClick={handleTicketClick} />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Faça login para ver seus tickets de suporte.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <TicketDetail
          ticket={selectedTicket}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
        />
      </div>
    </div>
  );
};

export default Suporte;
