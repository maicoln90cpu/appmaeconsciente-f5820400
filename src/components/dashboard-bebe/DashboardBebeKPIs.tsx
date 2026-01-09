import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Milk, Moon, Clock, ArrowRightLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { FeedingLog, SleepLog } from "@/hooks/useDashboardBebe";
import { useCrossModuleAnalytics } from "@/hooks/useCrossModuleAnalytics";
import { cn } from "@/lib/utils";

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

    if (hoursSinceFeeding >= 3) return { label: "Mamada", urgent: hoursSinceFeeding >= 4 };
    if (hoursSinceWakeup >= 2) return { label: "Soneca", urgent: hoursSinceWakeup >= 3 };
    return { label: "Brincadeira", urgent: false };
  };

  const nextActivity = getNextActivity();
  const urgentInsights = insights.filter(i => i.priority === "high");

  // Status de tempo desde última ação
  const getTimeStatus = (startTime: string) => {
    const hours = differenceInHours(new Date(), new Date(startTime));
    if (hours >= 4) return "warning";
    if (hours >= 3) return "attention";
    return "normal";
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Alertas urgentes */}
      {urgentInsights.length > 0 && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{urgentInsights[0].icon}</span>
            <span className="font-medium text-destructive">{urgentInsights[0].title}</span>
          </div>
          <p className="text-sm text-destructive/80">{urgentInsights[0].description}</p>
        </div>
      )}

      {/* KPIs Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* Última Mamada */}
        <Card className={cn(
          lastFeeding && getTimeStatus(lastFeeding.start_time) === "warning" && "border-destructive/50"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Milk className="h-4 w-4 text-primary" />
              Última Mamada
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastFeeding ? (
              <>
                <p className="text-2xl font-bold">
                  {formatDistanceToNow(new Date(lastFeeding.start_time), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
                <div className="mt-2 space-y-1">
                  <Badge variant="outline" className="text-xs">
                    {lastFeeding.feeding_type === 'breastfeeding' ? 'Peito' : 
                     lastFeeding.feeding_type === 'bottle' ? 'Mamadeira' : 'Fórmula'}
                  </Badge>
                  {lastFeeding.breast_side && (
                    <p className="text-xs text-muted-foreground">
                      Lado: {lastFeeding.breast_side === 'left' ? 'Esquerdo' : 'Direito'}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum registro ainda</p>
            )}
          </CardContent>
        </Card>

        {/* Última Soneca */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Moon className="h-4 w-4 text-primary" />
              Última Soneca
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastSleep ? (
              <>
                <p className="text-2xl font-bold">
                  {lastSleep.sleep_end 
                    ? formatDistanceToNow(new Date(lastSleep.sleep_end), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })
                    : 'Dormindo agora'
                  }
                </p>
                <div className="mt-2 space-y-1">
                  <Badge variant="outline" className="text-xs">
                    {lastSleep.sleep_type === 'night' ? 'Noturno' : 'Soneca'}
                  </Badge>
                  {lastSleep.duration_minutes && (
                    <p className="text-xs text-muted-foreground">
                      {Math.floor(lastSleep.duration_minutes / 60)}h {lastSleep.duration_minutes % 60}min
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum registro ainda</p>
            )}
          </CardContent>
        </Card>

        {/* Próxima Atividade - Aprimorado */}
        <Card className={cn(nextActivity?.urgent && "border-amber-500/50")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Próxima Atividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextActivity ? (
              <>
                <p className={cn(
                  "text-2xl font-bold",
                  nextActivity.urgent && "text-amber-600"
                )}>
                  {nextActivity.label}
                </p>
                {nextActivity.urgent && (
                  <Badge variant="secondary" className="mt-2 text-xs bg-amber-500/20 text-amber-700">
                    Em breve
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Baseado no padrão das últimas 24h
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Registre mais eventos para previsões
              </p>
            )}
          </CardContent>
        </Card>

        {/* Novo: Tendência Cross-Module */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              Tendência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats.sleepTrendLastWeek === "improving" ? (
                <TrendingUp className="h-6 w-6 text-green-500" />
              ) : stats.sleepTrendLastWeek === "declining" ? (
                <TrendingDown className="h-6 w-6 text-red-500" />
              ) : (
                <Minus className="h-6 w-6 text-muted-foreground" />
              )}
              <span className="text-lg font-bold">
                {stats.sleepTrendLastWeek === "improving" ? "Melhorando" : 
                 stats.sleepTrendLastWeek === "declining" ? "Diminuindo" : "Estável"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Sono na última semana
            </p>
            {stats.bestFeedingTimeForSleep && (
              <p className="text-xs text-primary mt-1">
                💡 Melhor: alimentar {stats.bestFeedingTimeForSleep} antes
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
