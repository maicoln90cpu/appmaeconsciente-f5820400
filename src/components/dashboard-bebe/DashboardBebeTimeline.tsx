import { useMemo } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Milk, Moon, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import type { FeedingLog, SleepLog } from '@/hooks/useDashboardBebe';

interface DashboardBebeTimelineProps {
  feedingLogs: FeedingLog[];
  sleepLogs: SleepLog[];
}

type TimelineEvent = (FeedingLog & { _type: 'feeding' }) | (SleepLog & { _type: 'sleep' });

export const DashboardBebeTimeline = ({ feedingLogs, sleepLogs }: DashboardBebeTimelineProps) => {
  const sortedEvents = useMemo(() => {
    const feedingEvents: TimelineEvent[] = feedingLogs.map(f => ({
      ...f,
      _type: 'feeding' as const,
    }));
    const sleepEvents: TimelineEvent[] = sleepLogs.map(s => ({ ...s, _type: 'sleep' as const }));

    return [...feedingEvents, ...sleepEvents].sort((a, b) => {
      const timeA = a._type === 'feeding' ? a.start_time : a.sleep_start;
      const timeB = b._type === 'feeding' ? b.start_time : b.sleep_start;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });
  }, [feedingLogs, sleepLogs]);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Timeline das Últimas 24h
        </CardTitle>
        <CardDescription>Cronologia de mamadas e sonecas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedEvents.map((event, index) => {
            const isFeeding = event._type === 'feeding';
            const time = isFeeding ? event.start_time : event.sleep_start;

            return (
              <div
                key={`${event._type}-${event.id}-${index}`}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                {isFeeding ? (
                  <Milk className="h-4 w-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <Moon className="h-4 w-4 text-purple-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {isFeeding
                      ? event.feeding_type === 'breastfeeding'
                        ? 'Mamada no peito'
                        : event.feeding_type === 'bottle'
                          ? 'Mamadeira'
                          : 'Fórmula'
                      : event.sleep_type === 'night'
                        ? 'Sono noturno'
                        : 'Soneca'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(time), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                {isFeeding && event.volume_ml && (
                  <Badge variant="outline">{event.volume_ml}ml</Badge>
                )}
                {!isFeeding && event.duration_minutes && (
                  <Badge variant="outline">
                    {Math.floor(event.duration_minutes / 60)}h {event.duration_minutes % 60}min
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
