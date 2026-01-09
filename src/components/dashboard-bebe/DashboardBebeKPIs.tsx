import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Milk, Moon, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { FeedingLog, SleepLog } from "@/hooks/useDashboardBebe";

interface DashboardBebeKPIsProps {
  lastFeeding: FeedingLog | null;
  lastSleep: SleepLog | null;
}

export const DashboardBebeKPIs = ({ lastFeeding, lastSleep }: DashboardBebeKPIsProps) => {
  const getNextActivity = () => {
    if (!lastFeeding || !lastSleep?.sleep_end) return null;

    const now = new Date();
    const timeSinceFeeding = now.getTime() - new Date(lastFeeding.start_time).getTime();
    const hoursSinceFeeding = timeSinceFeeding / (1000 * 60 * 60);
    
    const timeSinceWakeup = now.getTime() - new Date(lastSleep.sleep_end).getTime();
    const hoursSinceWakeup = timeSinceWakeup / (1000 * 60 * 60);

    if (hoursSinceFeeding >= 3) return "Mamada";
    if (hoursSinceWakeup >= 2) return "Soneca";
    return "Brincadeira";
  };

  return (
    <div className="grid md:grid-cols-3 gap-4 mb-8">
      {/* Última Mamada */}
      <Card>
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
                {lastFeeding.volume_ml && (
                  <p className="text-xs text-muted-foreground">{lastFeeding.volume_ml}ml</p>
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
                {lastSleep.wakeup_mood && (
                  <p className="text-xs text-muted-foreground">
                    Humor: {lastSleep.wakeup_mood === 'happy' ? '😊' : 
                            lastSleep.wakeup_mood === 'crying' ? '😭' : '😐'}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum registro ainda</p>
          )}
        </CardContent>
      </Card>

      {/* Próxima Atividade */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Próxima Atividade
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lastFeeding && lastSleep?.sleep_end ? (
            <>
              <p className="text-2xl font-bold">{getNextActivity()}</p>
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
    </div>
  );
};
