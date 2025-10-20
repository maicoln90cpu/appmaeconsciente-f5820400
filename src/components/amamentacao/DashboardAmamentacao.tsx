import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Baby, Droplets, Timer, TrendingUp } from "lucide-react";
import { differenceInMinutes, format, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { BabyFeedingLog } from "@/types/babyFeeding";

interface DashboardAmamentacaoProps {
  feedingLogs: BabyFeedingLog[];
}

export const DashboardAmamentacao = ({ feedingLogs }: DashboardAmamentacaoProps) => {
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const last7Days = subDays(today, 7);
    
    const todayLogs = feedingLogs.filter(log => 
      new Date(log.start_time) >= today
    );
    
    const weekLogs = feedingLogs.filter(log => 
      new Date(log.start_time) >= last7Days
    );

    // KPIs
    const feedingsToday = todayLogs.length;
    const avgDuration = todayLogs.filter(l => l.duration_minutes).length > 0
      ? Math.round(todayLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) / todayLogs.filter(l => l.duration_minutes).length)
      : 0;
    const totalVolume = todayLogs.reduce((sum, l) => sum + (l.volume_ml || 0), 0);
    
    // Tempo entre mamadas
    const intervals = [];
    for (let i = 0; i < todayLogs.length - 1; i++) {
      const diff = differenceInMinutes(
        new Date(todayLogs[i].start_time),
        new Date(todayLogs[i + 1].start_time)
      );
      intervals.push(Math.abs(diff));
    }
    const avgInterval = intervals.length > 0
      ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
      : 0;

    // Gráfico de barras - mamadas por dia (últimos 7 dias)
    const feedingsByDay = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dayLogs = feedingLogs.filter(log => {
        const logDate = startOfDay(new Date(log.start_time));
        return logDate.getTime() === day.getTime();
      });
      feedingsByDay.push({
        day: format(day, "dd/MM", { locale: ptBR }),
        mamadas: dayLogs.length,
      });
    }

    // Gráfico de pizza - proporção tipo de leite
    const bottleLogs = weekLogs.filter(l => l.feeding_type === "bottle");
    const breastMilk = bottleLogs.filter(l => l.milk_type === "breast_milk").length;
    const formula = bottleLogs.filter(l => l.milk_type === "formula").length;
    const mixed = bottleLogs.filter(l => l.milk_type === "mixed").length;
    
    const milkTypeData = [
      { name: "Leite Materno", value: breastMilk, color: "#F8D7DA" },
      { name: "Fórmula", value: formula, color: "#BACBD2" },
      { name: "Misto", value: mixed, color: "#FFF8F3" },
    ].filter(item => item.value > 0);

    // Gráfico de linha - volume total por dia
    const volumeByDay = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dayLogs = feedingLogs.filter(log => {
        const logDate = startOfDay(new Date(log.start_time));
        return logDate.getTime() === day.getTime();
      });
      const totalVol = dayLogs.reduce((sum, l) => sum + (l.volume_ml || 0), 0);
      volumeByDay.push({
        day: format(day, "dd/MM", { locale: ptBR }),
        volume: totalVol,
      });
    }

    return {
      feedingsToday,
      avgDuration,
      totalVolume,
      avgInterval,
      feedingsByDay,
      milkTypeData,
      volumeByDay,
    };
  }, [feedingLogs]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Baby className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Mamadas Hoje</p>
              <p className="text-2xl font-bold">{stats.feedingsToday}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Timer className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Duração Média</p>
              <p className="text-2xl font-bold">{stats.avgDuration} min</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Droplets className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Volume Total</p>
              <p className="text-2xl font-bold">{stats.totalVolume} ml</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Intervalo Médio</p>
              <p className="text-2xl font-bold">{stats.avgInterval} min</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Mamadas por Dia (Últimos 7 dias)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.feedingsByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="mamadas" fill="#F8D7DA" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfico de Pizza */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Proporção Tipo de Leite (Última Semana)</h3>
          {stats.milkTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.milkTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.milkTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhuma mamadeira registrada na última semana
            </div>
          )}
        </Card>

        {/* Gráfico de Linha */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Volume Total por Dia (ml)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.volumeByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="volume" stroke="#BACBD2" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Mensagem Motivacional */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <p className="text-center italic">
          ✨ Confie no seu instinto, você está indo muito bem!
        </p>
      </Card>
    </div>
  );
};
