import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, Legend, PieChart, Pie, Cell } from "recharts";
import { BabySleepLog } from "@/types/babySleep";
import { format, subDays, eachDayOfInterval, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SleepPatternChartProps {
  sleepLogs: BabySleepLog[];
  period?: number;
}

export const SleepPatternChart = ({ sleepLogs, period = 14 }: SleepPatternChartProps) => {
  // Dados para gráfico de tendência de duração
  const durationTrend = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), period - 1),
      end: new Date(),
    });

    return days.map(day => {
      const dayLogs = sleepLogs.filter(log => 
        isSameDay(new Date(log.sleep_start), day)
      );

      const nightLogs = dayLogs.filter(l => l.sleep_type === 'noturno');
      const dayNaps = dayLogs.filter(l => l.sleep_type === 'diurno');

      const nightHours = nightLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / 60;
      const napHours = dayNaps.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / 60;

      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        noturno: parseFloat(nightHours.toFixed(1)),
        diurno: parseFloat(napHours.toFixed(1)),
        total: parseFloat((nightHours + napHours).toFixed(1)),
      };
    });
  }, [sleepLogs, period]);

  // Dados para gráfico de horário de dormir
  const bedtimeTrend = useMemo(() => {
    const nightLogs = sleepLogs
      .filter(log => log.sleep_type === 'noturno')
      .slice(0, period)
      .reverse();

    return nightLogs.map(log => {
      const date = new Date(log.sleep_start);
      const hours = date.getHours() + date.getMinutes() / 60;
      // Ajustar para visualização (horários após meia-noite)
      const adjustedHours = hours < 12 ? hours + 24 : hours;

      return {
        date: format(date, 'dd/MM', { locale: ptBR }),
        horario: parseFloat(adjustedHours.toFixed(2)),
        display: format(date, 'HH:mm'),
      };
    });
  }, [sleepLogs, period]);

  // Distribuição por local
  const locationDistribution = useMemo(() => {
    const locations: { [key: string]: number } = {};
    sleepLogs.slice(0, 50).forEach(log => {
      const loc = log.location || 'outro';
      locations[loc] = (locations[loc] || 0) + 1;
    });

    const locationLabels: { [key: string]: string } = {
      berco: 'Berço',
      colo: 'Colo',
      carrinho: 'Carrinho',
      cama_compartilhada: 'Cama Compartilhada',
      outro: 'Outro',
    };

    return Object.entries(locations).map(([key, value]) => ({
      name: locationLabels[key] || key,
      value,
    }));
  }, [sleepLogs]);

  // Distribuição de humor ao acordar
  const moodDistribution = useMemo(() => {
    const moods: { [key: string]: number } = {};
    sleepLogs.slice(0, 50).forEach(log => {
      const mood = log.wakeup_mood || 'neutro';
      moods[mood] = (moods[mood] || 0) + 1;
    });

    const moodLabels: { [key: string]: string } = {
      calmo: '😌 Calmo',
      chorando: '😢 Chorando',
      agitado: '😫 Agitado',
      neutro: '😐 Neutro',
    };

    return Object.entries(moods).map(([key, value]) => ({
      name: moodLabels[key] || key,
      value,
    }));
  }, [sleepLogs]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}h
          </p>
        ))}
      </div>
    );
  };

  if (sleepLogs.length < 3) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Registre mais dados de sono para ver gráficos de padrões.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico de Tendência de Duração */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📈 Tendência de Horas de Sono</CardTitle>
          <CardDescription>Distribuição diária entre sono noturno e sonecas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={durationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="noturno"
                  name="Noturno"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="diurno"
                  name="Sonecas"
                  stackId="1"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Horário de Dormir */}
        {bedtimeTrend.length > 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🌙 Horário de Dormir</CardTitle>
              <CardDescription>Variação do horário ao longo dos dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bedtimeTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis 
                      domain={[18, 26]} 
                      tickFormatter={(value) => {
                        const h = value >= 24 ? value - 24 : value;
                        return `${Math.floor(h)}:00`;
                      }}
                      className="text-xs"
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        const v = value as number;
                        const h = v >= 24 ? v - 24 : v;
                        const hours = Math.floor(h);
                        const mins = Math.round((h - hours) * 60);
                        return [`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`, 'Horário'];
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="horario"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Distribuição por Local */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📍 Onde Dorme</CardTitle>
            <CardDescription>Distribuição dos locais de sono</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={locationDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {locationDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de Humor ao Acordar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">😊 Como Acorda</CardTitle>
          <CardDescription>Distribuição do humor ao acordar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moodDistribution} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" className="text-xs" />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
