import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Bell, Syringe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, differenceInDays, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  type: "vaccine" | "appointment";
  urgent?: boolean;
}

export const DashboardBebeUpcomingEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<UpcomingEvent[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const today = new Date().toISOString().split("T")[0];
      const [{ data: appointments }, { data: vaccines }] = await Promise.all([
        supabase
          .from("baby_appointments")
          .select("id, title, scheduled_date")
          .eq("user_id", user.id)
          .eq("completed", false)
          .gte("scheduled_date", today)
          .order("scheduled_date")
          .limit(3),
        supabase
          .from("baby_vaccinations")
          .select("vaccine_name, application_date")
          .eq("user_id", user.id)
          .gte("application_date", today)
          .order("application_date")
          .limit(3),
      ]);

      const mapped: UpcomingEvent[] = [];
      appointments?.forEach((a) => {
        mapped.push({
          id: a.id,
          title: a.title,
          date: a.scheduled_date,
          type: "appointment",
          urgent: differenceInDays(parseISO(a.scheduled_date), new Date()) <= 2,
        });
      });
      vaccines?.forEach((v, i) => {
        mapped.push({
          id: `vax-${i}`,
          title: v.vaccine_name,
          date: v.application_date,
          type: "vaccine",
        });
      });
      setEvents(mapped.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5));
    };
    load();
  }, [user]);

  const formatDate = (d: string) => {
    const date = parseISO(d);
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    return format(date, "dd/MM", { locale: ptBR });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Próximos Eventos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  event.type === "vaccine" ? "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" : "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
                }`}>
                  {event.type === "vaccine" ? <Syringe className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                </div>
                {event.urgent && <Badge variant="destructive" className="text-[10px] px-1.5">Urgente</Badge>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum evento próximo</p>
            <Button variant="link" size="sm" asChild>
              <Link to="/materiais/cartao-vacinacao">Adicionar vacinas</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
