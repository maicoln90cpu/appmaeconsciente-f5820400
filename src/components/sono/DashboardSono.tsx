import { useMemo, useEffect, useState } from 'react';

import { format, subDays, startOfDay, differenceInMinutes, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Moon, Sun, Clock, Baby, AlertCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { BabySleepLog, BabySleepMilestone } from '@/types/babySleep';

import { supabase } from '@/integrations/supabase/client';

interface DashboardSonoProps {
  sleepLogs: BabySleepLog[];
  milestones: BabySleepMilestone[];
  babyAgeMonths?: number;
}

export const DashboardSono = ({ sleepLogs, milestones, babyAgeMonths }: DashboardSonoProps) => {
  const navigate = useNavigate();
  const [lastFeeding, setLastFeeding] = useState<{ time: string; type: string } | null>(null);

  useEffect(() => {
    const loadLastFeeding = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('baby_feeding_logs')
        .select('start_time, feeding_type')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setLastFeeding({
          time: data.start_time,
          type:
            data.feeding_type === 'breastfeeding'
              ? 'Amamentação'
              : data.feeding_type === 'bottle'
                ? 'Mamadeira'
                : 'Ordenha',
        });
      }
    };

    loadLastFeeding();
  }, []);

  const last7DaysData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayLogs = sleepLogs.filter(log => {
        const logDate = new Date(log.sleep_start);
        return logDate >= dayStart && logDate <= dayEnd && log.duration_minutes;
      });

      const totalMinutes = dayLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
      const hours = Math.round((totalMinutes / 60) * 10) / 10;

      return {
        date: format(date, 'EEE', { locale: ptBR }),
        hours,
        fullDate: format(date, 'dd/MM'),
      };
    });

    return days;
  }, [sleepLogs]);

  const sleepTypeData = useMemo(() => {
    const last7Days = sleepLogs.filter(log => {
      const logDate = new Date(log.sleep_start);
      return logDate >= subDays(new Date(), 7) && log.duration_minutes;
    });

    const diurno = last7Days
      .filter(log => log.sleep_type === 'diurno')
      .reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

    const noturno = last7Days
      .filter(log => log.sleep_type === 'noturno')
      .reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

    return [
      { name: 'Diurno', value: Math.round((diurno / 60) * 10) / 10, color: '#FFC658' },
      { name: 'Noturno', value: Math.round((noturno / 60) * 10) / 10, color: '#8884d8' },
    ];
  }, [sleepLogs]);

  const stats = useMemo(() => {
    const last24h = sleepLogs.filter(log => {
      const logDate = new Date(log.sleep_start);
      return logDate >= subDays(new Date(), 1) && log.duration_minutes;
    });

    const totalHours = last24h.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / 60;

    const last7Days = sleepLogs.filter(log => {
      const logDate = new Date(log.sleep_start);
      return logDate >= subDays(new Date(), 7);
    });

    const avgNapsPerDay = last7Days.length / 7;

    const nightSleeps = last7Days.filter(
      log => log.sleep_type === 'noturno' && log.duration_minutes
    );
    const avgNightStart =
      nightSleeps.length > 0 ? format(new Date(nightSleeps[0].sleep_start), 'HH:mm') : 'N/A';

    // Calcular tendência
    const firstHalf = sleepLogs.slice(0, Math.floor(sleepLogs.length / 2));
    const secondHalf = sleepLogs.slice(Math.floor(sleepLogs.length / 2));

    const firstHalfAvg =
      firstHalf.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) /
      Math.max(firstHalf.length, 1);
    const secondHalfAvg =
      secondHalf.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) /
      Math.max(secondHalf.length, 1);

    const trend = secondHalfAvg > firstHalfAvg ? 'up' : 'down';

    return {
      totalHours24h: Math.round(totalHours * 10) / 10,
      avgNapsPerDay: Math.round(avgNapsPerDay * 10) / 10,
      avgNightStart,
      trend,
    };
  }, [sleepLogs]);

  const currentMilestone = useMemo(() => {
    if (!babyAgeMonths) return null;
    return milestones.find(
      m => babyAgeMonths >= m.age_range_start && babyAgeMonths <= m.age_range_end
    );
  }, [babyAgeMonths, milestones]);

  const lastAwakeTime = useMemo(() => {
    const lastSleep = sleepLogs.find(log => log.sleep_end);
    if (!lastSleep || !lastSleep.sleep_end) return null;

    const awakeMinutes = differenceInMinutes(new Date(), new Date(lastSleep.sleep_end));
    const hours = Math.floor(awakeMinutes / 60);
    const minutes = awakeMinutes % 60;

    return { hours, minutes, total: awakeMinutes };
  }, [sleepLogs]);

  // Verificar se o sono está abaixo do ideal nos últimos 3 dias
  const sleepBelowIdeal = useMemo(() => {
    if (!currentMilestone) return false;

    const last3Days = sleepLogs.filter(log => {
      const logDate = new Date(log.sleep_start);
      return logDate >= subDays(new Date(), 3) && log.duration_minutes;
    });

    if (last3Days.length === 0) return false;

    const avgHoursLast3Days =
      last3Days.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / 60 / 3;
    return avgHoursLast3Days < currentMilestone.recommended_total_hours_min;
  }, [sleepLogs, currentMilestone]);

  const getStatusColor = () => {
    if (!currentMilestone) return 'text-muted-foreground';
    const totalHours = stats.totalHours24h;
    if (totalHours >= currentMilestone.recommended_total_hours_min) return 'text-green-600';
    if (totalHours >= currentMilestone.recommended_total_hours_min - 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Alerta de Sono Abaixo do Ideal */}
      {sleepBelowIdeal && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-yellow-800 dark:text-yellow-200">
              💡 Sono abaixo do ideal nos últimos 3 dias. A alimentação pode influenciar o sono do
              bebê. Confira dicas de nutrição no Guia de Bem-Estar.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/materiais/guia-alimentacao')}
              className="ml-4 shrink-0"
            >
              Ver Dicas
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {lastFeeding && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Última {lastFeeding.type} há{' '}
              {formatDistanceToNow(new Date(lastFeeding.time), { locale: ptBR })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/materiais/rastreador-amamentacao')}
            >
              Ver Rastreador
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total 24h</CardDescription>
            <CardTitle className="text-3xl">{stats.totalHours24h}h</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className="text-xs text-muted-foreground">
                {stats.trend === 'up' ? 'Dormindo mais' : 'Dormindo menos'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sonecas/Dia (média)</CardDescription>
            <CardTitle className="text-3xl">{stats.avgNapsPerDay}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-yellow-600" />
              <span className="text-xs text-muted-foreground">Últimos 7 dias</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Horário Noturno</CardDescription>
            <CardTitle className="text-3xl">{stats.avgNightStart}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Hora média</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Acordado há</CardDescription>
            <CardTitle className="text-3xl">
              {lastAwakeTime ? `${lastAwakeTime.hours}h${lastAwakeTime.minutes}m` : 'N/A'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              {lastAwakeTime && lastAwakeTime.total > 120 && (
                <span className="text-xs text-yellow-600">Considere uma soneca</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparação com Recomendações */}
      {currentMilestone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5" />
              Recomendações para {babyAgeMonths} meses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Horas recomendadas</span>
              <span className={`text-lg font-bold ${getStatusColor()}`}>
                {currentMilestone.recommended_total_hours_min}-
                {currentMilestone.recommended_total_hours_max}h
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Seu bebê dormiu (24h)</span>
              <span className={`text-lg font-bold ${getStatusColor()}`}>
                {stats.totalHours24h}h
              </span>
            </div>
            {stats.totalHours24h >= currentMilestone.recommended_total_hours_min ? (
              <p className="text-sm text-green-600">
                🟢 Excelente! O padrão de sono está adequado.
              </p>
            ) : stats.totalHours24h >= currentMilestone.recommended_total_hours_min - 2 ? (
              <p className="text-sm text-yellow-600">
                🟡 Atenção: Procure melhorar o sono do bebê.
              </p>
            ) : (
              <p className="text-sm text-red-600">
                🔴 Abaixo do ideal. Considere ajustar a rotina.
              </p>
            )}
            {currentMilestone.tips && currentMilestone.tips.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">💡 Dicas:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {currentMilestone.tips.map((tip, i) => (
                    <li key={i}>• {tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Horas de Sono (7 dias)</CardTitle>
            <CardDescription>Total de horas dormidas por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={last7DaysData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.fullDate;
                    }
                    return label;
                  }}
                />
                <Bar dataKey="hours" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sono Diurno vs Noturno</CardTitle>
            <CardDescription>Proporção dos últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sleepTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}h`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sleepTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Mensagem Motivacional */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <CardContent className="pt-6">
          <p className="text-center italic text-muted-foreground">
            🌸 Rotina leva tempo. Seja gentil consigo mesma. Você está fazendo um ótimo trabalho!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
