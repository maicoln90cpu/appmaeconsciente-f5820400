import { useState, useMemo } from 'react';

import {
  format,
  subDays,
  differenceInHours,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Clock,
  Moon,
  Sun,
  Baby,
  Lightbulb,
  Target,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


import { BabySleepLog, BabySleepMilestone } from '@/types/babySleep';


import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';

interface SleepAIInsightsProps {
  sleepLogs: BabySleepLog[];
  milestones: BabySleepMilestone[];
  babyName?: string;
  babyAgeMonths?: number;
}

interface SleepPattern {
  averageDuration: number;
  averageBedtime: string;
  averageWakeTime: string;
  consistency: number;
  totalDailyHours: number;
  napsPerDay: number;
  nightWakings: number;
}

interface SleepInsight {
  type: 'positive' | 'warning' | 'suggestion';
  title: string;
  description: string;
  icon: typeof TrendingUp;
}

export const SleepAIInsights = ({
  sleepLogs,
  milestones,
  babyName = 'seu bebê',
  babyAgeMonths,
}: SleepAIInsightsProps) => {
  const { aiInsightsEnabled } = useFeatureFlags();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Análise dos últimos 7 dias
  const last7DaysLogs = useMemo(() => {
    const cutoff = subDays(new Date(), 7);
    return sleepLogs.filter(log => new Date(log.sleep_start) >= cutoff);
  }, [sleepLogs]);

  // Análise dos 7 dias anteriores (para comparação)
  const previous7DaysLogs = useMemo(() => {
    const start = subDays(new Date(), 14);
    const end = subDays(new Date(), 7);
    return sleepLogs.filter(log => {
      const date = new Date(log.sleep_start);
      return date >= start && date < end;
    });
  }, [sleepLogs]);

  // Calcular padrões de sono
  const sleepPatterns = useMemo((): SleepPattern | null => {
    if (last7DaysLogs.length < 3) return null;

    const nightLogs = last7DaysLogs.filter(log => log.sleep_type === 'noturno');
    const dayLogs = last7DaysLogs.filter(log => log.sleep_type === 'diurno');

    // Média de duração
    const validDurations = last7DaysLogs
      .filter(log => log.duration_minutes)
      .map(log => log.duration_minutes!);
    const averageDuration =
      validDurations.length > 0
        ? validDurations.reduce((a, b) => a + b, 0) / validDurations.length
        : 0;

    // Horário médio de dormir (noturno)
    const bedtimes = nightLogs.map(log => {
      const date = new Date(log.sleep_start);
      return date.getHours() + date.getMinutes() / 60;
    });
    const avgBedtimeHour =
      bedtimes.length > 0 ? bedtimes.reduce((a, b) => a + b, 0) / bedtimes.length : 20;
    const avgBedtimeHours = Math.floor(avgBedtimeHour);
    const avgBedtimeMinutes = Math.round((avgBedtimeHour - avgBedtimeHours) * 60);

    // Horário médio de acordar
    const wakeTimes = nightLogs
      .filter(log => log.sleep_end)
      .map(log => {
        const date = new Date(log.sleep_end!);
        return date.getHours() + date.getMinutes() / 60;
      });
    const avgWakeHour =
      wakeTimes.length > 0 ? wakeTimes.reduce((a, b) => a + b, 0) / wakeTimes.length : 7;
    const avgWakeHours = Math.floor(avgWakeHour);
    const avgWakeMinutes = Math.round((avgWakeHour - avgWakeHours) * 60);

    // Consistência (baseado na variação do horário de dormir)
    const bedtimeVariance =
      bedtimes.length > 1
        ? Math.sqrt(
            bedtimes.map(b => Math.pow(b - avgBedtimeHour, 2)).reduce((a, b) => a + b, 0) /
              bedtimes.length
          )
        : 0;
    const consistency = Math.max(0, 100 - bedtimeVariance * 20);

    // Total de horas diárias (média)
    const dailyTotals: { [key: string]: number } = {};
    last7DaysLogs.forEach(log => {
      if (log.duration_minutes) {
        const dateKey = format(new Date(log.sleep_start), 'yyyy-MM-dd');
        dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + log.duration_minutes / 60;
      }
    });
    const totalDays = Object.keys(dailyTotals).length;
    const totalDailyHours =
      totalDays > 0 ? Object.values(dailyTotals).reduce((a, b) => a + b, 0) / totalDays : 0;

    // Média de sonecas por dia
    const napsPerDay = totalDays > 0 ? dayLogs.length / 7 : 0;

    return {
      averageDuration,
      averageBedtime: `${String(avgBedtimeHours).padStart(2, '0')}:${String(avgBedtimeMinutes).padStart(2, '0')}`,
      averageWakeTime: `${String(avgWakeHours).padStart(2, '0')}:${String(avgWakeMinutes).padStart(2, '0')}`,
      consistency,
      totalDailyHours,
      napsPerDay,
      nightWakings: 0, // Could be calculated from multiple night logs
    };
  }, [last7DaysLogs]);

  // Milestone atual baseado na idade
  const currentMilestone = useMemo(() => {
    if (!babyAgeMonths || !milestones.length) return null;
    return milestones.find(
      m => babyAgeMonths >= m.age_range_start && babyAgeMonths <= m.age_range_end
    );
  }, [babyAgeMonths, milestones]);

  // Gerar insights
  const insights = useMemo((): SleepInsight[] => {
    const result: SleepInsight[] = [];

    if (!sleepPatterns) {
      return [
        {
          type: 'suggestion',
          title: 'Registre mais dados',
          description:
            'Precisamos de pelo menos 3 dias de registros para gerar insights personalizados.',
          icon: Lightbulb,
        },
      ];
    }

    // Comparar com semana anterior
    if (previous7DaysLogs.length > 0) {
      const prevAvg =
        previous7DaysLogs
          .filter(l => l.duration_minutes)
          .reduce((a, b) => a + (b.duration_minutes || 0), 0) / previous7DaysLogs.length;
      const currAvg = sleepPatterns.averageDuration;
      const diff = ((currAvg - prevAvg) / prevAvg) * 100;

      if (diff > 10) {
        result.push({
          type: 'positive',
          title: 'Duração do sono melhorou',
          description: `${babyName} está dormindo em média ${Math.abs(diff).toFixed(0)}% mais do que na semana passada!`,
          icon: TrendingUp,
        });
      } else if (diff < -10) {
        result.push({
          type: 'warning',
          title: 'Duração do sono diminuiu',
          description: `A média de sono diminuiu ${Math.abs(diff).toFixed(0)}% em relação à semana passada.`,
          icon: TrendingDown,
        });
      }
    }

    // Verificar consistência
    if (sleepPatterns.consistency >= 80) {
      result.push({
        type: 'positive',
        title: 'Rotina consistente',
        description: 'O horário de dormir está muito regular! Isso ajuda o bebê a dormir melhor.',
        icon: CheckCircle2,
      });
    } else if (sleepPatterns.consistency < 50) {
      result.push({
        type: 'warning',
        title: 'Rotina irregular',
        description: 'Os horários de sono variam muito. Tente estabelecer um horário mais fixo.',
        icon: AlertTriangle,
      });
    }

    // Comparar com recomendação por idade
    if (currentMilestone) {
      const recommendedMin = currentMilestone.recommended_total_hours_min;
      const recommendedMax = currentMilestone.recommended_total_hours_max;
      const actual = sleepPatterns.totalDailyHours;

      if (actual < recommendedMin) {
        result.push({
          type: 'warning',
          title: 'Sono abaixo do recomendado',
          description: `${babyName} está dormindo ${actual.toFixed(1)}h/dia. Para a idade, o recomendado é ${recommendedMin}-${recommendedMax}h.`,
          icon: Clock,
        });
      } else if (actual >= recommendedMin && actual <= recommendedMax) {
        result.push({
          type: 'positive',
          title: 'Quantidade ideal de sono',
          description: `${babyName} está dormindo dentro do recomendado para a idade (${recommendedMin}-${recommendedMax}h).`,
          icon: Target,
        });
      }

      // Verificar sonecas
      if (currentMilestone.recommended_naps) {
        const actualNaps = sleepPatterns.napsPerDay;
        if (Math.abs(actualNaps - currentMilestone.recommended_naps) > 1) {
          result.push({
            type: 'suggestion',
            title: 'Ajustar quantidade de sonecas',
            description: `Para a idade de ${babyName}, são recomendadas ${currentMilestone.recommended_naps} sonecas por dia.`,
            icon: Sun,
          });
        }
      }
    }

    // Verificar humor ao acordar
    const moodLogs = last7DaysLogs.filter(log => log.wakeup_mood);
    const calmWakeups = moodLogs.filter(log => log.wakeup_mood === 'calmo').length;
    if (moodLogs.length > 3) {
      const calmPercent = (calmWakeups / moodLogs.length) * 100;
      if (calmPercent >= 60) {
        result.push({
          type: 'positive',
          title: 'Acordando bem',
          description: `${babyName} acorda calmo(a) na maioria das vezes (${calmPercent.toFixed(0)}%)!`,
          icon: Baby,
        });
      } else if (calmPercent < 30) {
        result.push({
          type: 'suggestion',
          title: 'Qualidade do sono',
          description: 'O bebê acorda agitado frequentemente. Considere revisar a rotina de sono.',
          icon: Lightbulb,
        });
      }
    }

    // Verificar bem-estar da mãe
    const momMoodLogs = last7DaysLogs.filter(log => log.mom_mood);
    const exhaustedCount = momMoodLogs.filter(log => log.mom_mood === 'exausta').length;
    if (momMoodLogs.length > 3 && exhaustedCount / momMoodLogs.length > 0.5) {
      result.push({
        type: 'warning',
        title: 'Cuide de você também',
        description:
          'Você está se sentindo exausta com frequência. Lembre-se de pedir ajuda quando precisar. 💙',
        icon: AlertTriangle,
      });
    }

    return result.length > 0
      ? result
      : [
          {
            type: 'positive',
            title: 'Tudo em ordem',
            description: 'Os padrões de sono estão dentro do esperado. Continue assim!',
            icon: Sparkles,
          },
        ];
  }, [sleepPatterns, previous7DaysLogs, currentMilestone, last7DaysLogs, babyName]);

  // Sugestões personalizadas
  const suggestions = useMemo(() => {
    const result: string[] = [];

    if (!sleepPatterns) return result;

    // Sugestões baseadas no horário de dormir
    const bedtimeHour = parseInt(sleepPatterns.averageBedtime.split(':')[0]);
    if (bedtimeHour >= 22) {
      result.push('Tente antecipar o horário de dormir em 15-30 minutos gradualmente.');
    }
    if (bedtimeHour <= 18 && babyAgeMonths && babyAgeMonths > 6) {
      result.push('O bebê pode estar dormindo muito cedo. Observe se acorda de madrugada.');
    }

    // Sugestões por idade
    if (babyAgeMonths) {
      if (babyAgeMonths <= 3) {
        result.push('Nessa idade, o sono é fragmentado. Isso é normal!');
        result.push('Deixe o ambiente escuro e silencioso para sonecas melhores.');
      } else if (babyAgeMonths <= 6) {
        result.push('Comece a estabelecer uma rotina noturna consistente.');
        result.push('Um banho morno antes de dormir pode ajudar a relaxar.');
      } else if (babyAgeMonths <= 12) {
        result.push('A transição de 3 para 2 sonecas pode acontecer nessa fase.');
        result.push('Mantenha o quarto entre 20-22°C para conforto.');
      } else {
        result.push(
          'Uma rotina previsível (banho, história, música) ajuda a sinalizar hora de dormir.'
        );
        result.push('Evite telas pelo menos 1 hora antes de dormir.');
      }
    }

    // Sugestões baseadas na consistência
    if (sleepPatterns.consistency < 60) {
      result.push('Tente manter horários fixos de dormir e acordar, mesmo nos fins de semana.');
    }

    // Baseado no humor ao acordar
    const agitatedCount = last7DaysLogs.filter(l => l.wakeup_mood === 'agitado').length;
    if (agitatedCount > 2) {
      result.push('Se o bebê acorda agitado, verifique conforto: fralda, temperatura, fome.');
    }

    return result.slice(0, 4); // Máximo 4 sugestões
  }, [sleepPatterns, babyAgeMonths, last7DaysLogs]);

  // Heatmap semanal
  const weeklyHeatmap = useMemo(() => {
    const start = startOfWeek(new Date(), { locale: ptBR });
    const end = endOfWeek(new Date(), { locale: ptBR });
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayLogs = last7DaysLogs.filter(log => isSameDay(new Date(log.sleep_start), day));
      const totalMinutes = dayLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
      const hours = totalMinutes / 60;

      return {
        day: format(day, 'EEE', { locale: ptBR }),
        fullDate: format(day, 'dd/MM'),
        hours,
        intensity: hours > 0 ? Math.min((hours / 14) * 100, 100) : 0,
        logs: dayLogs.length,
      };
    });
  }, [last7DaysLogs]);

  if (!aiInsightsEnabled) return null;

  if (sleepLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Análise Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Comece a registrar</AlertTitle>
            <AlertDescription>
              Adicione registros de sono para receber análises e sugestões personalizadas.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Rápido */}
      {sleepPatterns && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Horário médio de dormir</p>
                  <p className="text-2xl font-bold">{sleepPatterns.averageBedtime}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Horário médio de acordar</p>
                  <p className="text-2xl font-bold">{sleepPatterns.averageWakeTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Média diária</p>
                  <p className="text-2xl font-bold">{sleepPatterns.totalDailyHours.toFixed(1)}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Consistência</p>
                  <p className="text-2xl font-bold">{sleepPatterns.consistency.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Heatmap Semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📅 Sono da Semana</CardTitle>
          <CardDescription>Visualização do total de horas por dia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between gap-2">
            {weeklyHeatmap.map((day, i) => (
              <div key={i} className="flex-1 text-center">
                <div className="text-xs text-muted-foreground mb-1 capitalize">{day.day}</div>
                <div
                  className="h-16 rounded-md flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor:
                      day.hours > 0
                        ? `hsl(var(--primary) / ${0.2 + (day.intensity / 100) * 0.8})`
                        : 'hsl(var(--muted))',
                  }}
                >
                  <span className="text-sm font-medium">
                    {day.hours > 0 ? `${day.hours.toFixed(1)}h` : '-'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{day.fullDate}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Insights Personalizados
          </CardTitle>
          <CardDescription>Análise baseada nos registros dos últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <div
                key={i}
                className={`flex gap-4 p-4 rounded-lg ${
                  insight.type === 'positive'
                    ? 'bg-green-500/10 border border-green-500/20'
                    : insight.type === 'warning'
                      ? 'bg-amber-500/10 border border-amber-500/20'
                      : 'bg-blue-500/10 border border-blue-500/20'
                }`}
              >
                <Icon
                  className={`h-5 w-5 mt-0.5 ${
                    insight.type === 'positive'
                      ? 'text-green-500'
                      : insight.type === 'warning'
                        ? 'text-amber-500'
                        : 'text-blue-500'
                  }`}
                />
                <div>
                  <h4 className="font-medium">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recomendação por idade */}
      {currentMilestone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5" />
              Recomendação para {babyAgeMonths} meses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">
                  {currentMilestone.recommended_total_hours_min}-
                  {currentMilestone.recommended_total_hours_max}h
                </p>
                <p className="text-sm text-muted-foreground">Total diário</p>
              </div>
              {currentMilestone.avg_night_sleep_hours && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold text-primary">
                    {currentMilestone.avg_night_sleep_hours}h
                  </p>
                  <p className="text-sm text-muted-foreground">Sono noturno</p>
                </div>
              )}
              {currentMilestone.recommended_naps && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold text-primary">
                    {currentMilestone.recommended_naps}
                  </p>
                  <p className="text-sm text-muted-foreground">Sonecas/dia</p>
                </div>
              )}
            </div>

            {currentMilestone.tips && currentMilestone.tips.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Dicas para essa idade
                </h4>
                <ul className="space-y-2">
                  {currentMilestone.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sugestões */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Sugestões para Melhorar o Sono
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {suggestions.map((suggestion, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-primary">{i + 1}</span>
                  </div>
                  <p className="text-sm">{suggestion}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
