import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRightLeft,
  Clock,
  Moon,
  Utensils,
} from 'lucide-react';
import { useCrossModuleAnalytics, type CrossModuleStats } from '@/hooks/useCrossModuleAnalytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const CrossModuleInsights = () => {
  const { loading, stats, dailyPatterns, correlations } = useCrossModuleAnalytics();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: CrossModuleStats['sleepTrendLastWeek']) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendText = (trend: CrossModuleStats['sleepTrendLastWeek']) => {
    switch (trend) {
      case 'improving':
        return 'Melhorando';
      case 'declining':
        return 'Diminuindo';
      default:
        return 'Estável';
    }
  };

  const chartData = dailyPatterns.map(p => ({
    ...p,
    date: format(parseISO(p.date), 'EEE', { locale: ptBR }),
    sleepHours: Math.round((p.totalSleepMinutes / 60) * 10) / 10,
  }));

  const hasEnoughData = correlations.length >= 3;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
          Correlação Alimentação × Sono
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Indicadores Principais */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Tempo Médio</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.avgTimeBetweenFeedingAndSleep > 0
                ? `${stats.avgTimeBetweenFeedingAndSleep}min`
                : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Entre mamada e sono</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Moon className="h-4 w-4" />
              <span>Tendência de Sono</span>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(stats.sleepTrendLastWeek)}
              <span className="text-lg font-semibold">
                {getTrendText(stats.sleepTrendLastWeek)}
              </span>
            </div>
          </div>
        </div>

        {/* Padrão Descoberto */}
        {stats.bestFeedingTimeForSleep && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔍</span>
              <div>
                <p className="font-medium text-sm">Padrão Descoberto</p>
                <p className="text-sm text-muted-foreground">
                  Seu bebê tende a dormir melhor quando alimentado{' '}
                  <strong>{stats.bestFeedingTimeForSleep}</strong> antes da soneca.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Força da Correlação */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Força dos dados</span>
            <span className="font-medium">{stats.correlationStrength}%</span>
          </div>
          <Progress value={stats.correlationStrength} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {stats.correlationStrength < 30
              ? 'Continue registrando para insights mais precisos'
              : stats.correlationStrength < 70
                ? 'Dados suficientes para padrões básicos'
                : 'Excelente! Padrões claros identificados'}
          </p>
        </div>

        {/* Gráfico de Padrões */}
        {hasEnoughData && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Últimos 7 dias</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="totalFeedings"
                    name="Mamadas"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="sleepHours"
                    name="Sono (h)"
                    fill="hsl(var(--secondary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Status do Padrão de Alimentação */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Utensils className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Padrão de alimentação</span>
          </div>
          <Badge variant={stats.feedingPattern === 'regular' ? 'default' : 'secondary'}>
            {stats.feedingPattern === 'regular' ? 'Regular' : 'Variado'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
