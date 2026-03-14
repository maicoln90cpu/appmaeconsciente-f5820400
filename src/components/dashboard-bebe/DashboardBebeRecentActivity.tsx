import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Activity {
  id: string;
  type: string;
  description: string;
  time: string;
}

export const DashboardBebeRecentActivity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: feedings }, { data: sleeps }] = await Promise.all([
        supabase
          .from("baby_feeding_logs")
          .select("id, feeding_type, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("baby_sleep_logs")
          .select("id, sleep_type, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(2),
      ]);

      const mapped: Activity[] = [];
      feedings?.forEach((f) => mapped.push({
        id: f.id, type: "feeding",
        description: f.feeding_type === "breast" ? "Amamentação registrada" : "Mamadeira registrada",
        time: f.created_at,
      }));
      sleeps?.forEach((s) => mapped.push({
        id: s.id, type: "sleep",
        description: s.sleep_type === "nap" ? "Soneca registrada" : "Sono noturno registrado",
        time: s.created_at,
      }));
      setActivities(mapped.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5));
    };
    load();
  }, [user]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-2">
            {activities.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${a.type === "feeding" ? "bg-pink-500" : "bg-indigo-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{a.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(a.time), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente</p>
        )}
      </CardContent>
    </Card>
  );
};
