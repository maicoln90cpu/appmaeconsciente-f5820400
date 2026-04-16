import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Milk, Moon, Clock, ArrowRightLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useCrossModuleAnalytics } from '@/hooks/useCrossModuleAnalytics';
import type { FeedingLog, SleepLog } from '@/hooks/useDashboardBebe';

import { cn } from '@/lib/utils';

interface DashboardBebeKPIsProps {
  lastFeeding: FeedingLog | null;
  lastSleep: SleepLog | null;
}

export const DashboardBebeKPIs = ({ lastFeeding, lastSleep }: DashboardBebeKPIsProps) => {
  const { stats, insights } = useCrossModuleAnalytics();

  const getNextActivity = () => {
    if (!lastFeeding || !lastSleep?.sleep_end) return null;

    const now = new Date();
    const timeSinceFeeding = now.getTime() - new Date(lastFeeding.start_time).getTime();
    const hoursSinceFeeding = timeSinceFeeding / (1000 * 60 * 60);

    const timeSinceWakeup = now.getTime() - new Date(lastSleep.sleep_end).getTime();
    const hoursSinceWakeup = timeSinceWakeup / (1000 * 60 * 60);

    if (hoursSinceFeeding >= 3) return { label: 'Mamada', urgent: hoursSinceFeeding >= 4 };
    if (hoursSinceWakeup >= 2) return { label: 'Soneca', urgent: hoursSinceWakeup >= 3 };
    return { label: 'Brincadeira', urgent: false };
  };

  const nextActivity = getNextActivity();
  const urgentInsights = insights.filter(i => i.priority === 'high');

  // Status de tempo desde última ação
  const getTimeStatus = (startTime: string) => {
    const hours = differenceInHours(new Date(), new Date(startTime));
    if (hours >= 4) return 'warning';
    if (hours >= 3) return 'attention';
    return 'normal';
  };

  return (
    <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
      {/* Alertas urgentes */}
      {urgentInsights.length > 0 && (
        <div className="p-3 sm:p-4 rounded-lg bg-destructive/10 border border-destructive/30">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <span className="text-lg sm:text-xl">{urgentInsights[0].icon}</span>
            <span className="font-medium text-destructive text-sm sm:text-base truncate">
              {urgentInsights[0].title}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-destructive/80 line-clamp-2">
            {urgentInsights[0].description}
          </p>
        </div>
      )}

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {/* Última Mamada */}
        <Card
          className={cn(
            'min-w-0',
            lastFeeding &&
              getTimeStatus(lastFeeding.start_time) === 'warning' &&
              'border-destructive/50'
          )}
        >
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
              <Milk className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span className="truncate">Última Mamada</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            {lastFeeding ? (
              <>
                <p className="text-lg sm:text-2xl font-bold truncate">
                  {formatDistanceToNow(new Date(lastFeeding.start_time), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
                <div className="mt-1.5 sm:mt-2 space-y-1">
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {lastFeeding.feeding_type === 'breastfeeding'
                      ? 'Peito'
                      : lastFeeding.feeding_type === 'bottle'
                        ? 'Mamadeira'
                        : 'Fórmula'}
                  </Badge>
                  {lastFeeding.breast_side && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Lado: {lastFeeding.breast_side === 'left' ? 'Esq.' : 'Dir.'}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">Nenhum registro</p>
            )}
          </CardContent>
        </Card>

        {/* Última Soneca */}
        <Card className="min-w-0">
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
              <Moon className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span className="truncate">Última Soneca</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            {lastSleep ? (
              <>
                <p className="text-lg sm:text-2xl font-bold truncate">
                  {lastSleep.sleep_end
                    ? formatDistanceToNow(new Date(lastSleep.sleep_end), {
                        addSuffix: true,
                        locale: ptBR,
                      })
                    : 'Dormindo'}
                </p>
                <div className="mt-1.5 sm:mt-2 space-y-1">
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {lastSleep.sleep_type === 'night' ? 'Noturno' : 'Soneca'}
                  </Badge>
                  {lastSleep.duration_minutes && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {Math.floor(lastSleep.duration_minutes / 60)}h{' '}
                      {lastSleep.duration_minutes % 60}min
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">Nenhum registro</p>
            )}
          </CardContent>
        </Card>

        {/* Próxima Atividade */}
        <Card className={cn('min-w-0', nextActivity?.urgent && 'border-amber-500/50')}>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span className="truncate">Próxima</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            {nextActivity ? (
              <>
                <p
                  className={cn(
                    'text-lg sm:text-2xl font-bold truncate',
                    nextActivity.urgent && 'text-amber-600'
                  )}
                >
                  {nextActivity.label}
                </p>
                {nextActivity.urgent && (
                  <Badge
                    variant="secondary"
                    className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs bg-amber-500/20 text-amber-700"
                  >
                    Em breve
                  </Badge>
                )}
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 line-clamp-2">
                  Baseado nas últimas 24h
                </p>
              </>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">Registre mais eventos</p>
            )}
          </CardContent>
        </Card>

        {/* Tendência Cross-Module */}
        <Card className="min-w-0">
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
              <ArrowRightLeft className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span className="truncate">Tendência</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {stats.sleepTrendLastWeek === 'improving' ? (
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 shrink-0" />
              ) : stats.sleepTrendLastWeek === 'declining' ? (
                <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 shrink-0" />
              ) : (
                <Minus className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm sm:text-lg font-bold truncate">
                {stats.sleepTrendLastWeek === 'improving'
                  ? 'Melhor'
                  : stats.sleepTrendLastWeek === 'declining'
                    ? 'Menos'
                    : 'Estável'}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 line-clamp-1">
              Sono última semana
            </p>
            {stats.bestFeedingTimeForSleep && (
              <p className="text-[10px] sm:text-xs text-primary mt-1 line-clamp-1">
                💡 {stats.bestFeedingTimeForSleep} antes
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
