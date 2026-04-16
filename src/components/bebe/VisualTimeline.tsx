import { useMemo } from 'react';

import { format, parseISO, isToday, isYesterday, startOfDay, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Moon, Heart, Utensils, Pill, Calendar, Star, Baby, Milestone } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useBabyAppointments } from '@/hooks/useBabyAppointments';
import { useBabyColic } from '@/hooks/useBabyColic';
import { useBabyFeeding } from '@/hooks/useBabyFeeding';
import { useBabyFirstTimes } from '@/hooks/useBabyGamification';
import { useBabyMedications } from '@/hooks/useBabyMedications';
import { useBabySleep } from '@/hooks/useBabySleep';
import { useDevelopmentMilestones } from '@/hooks/useDevelopmentMilestones';

interface VisualTimelineProps {
  babyProfileId?: string;
}

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  date: Date;
  icon: string;
  color: string;
  isMilestone?: boolean;
}

export const VisualTimeline = ({ babyProfileId }: VisualTimelineProps) => {
  const { sleepLogs } = useBabySleep();
  const { feedingLogs } = useBabyFeeding();
  const { colicLogs } = useBabyColic();
  const { medications } = useBabyMedications();
  const { appointments } = useBabyAppointments();
  const { firstTimes } = useBabyFirstTimes(babyProfileId);
  const { records: milestones } = useDevelopmentMilestones(babyProfileId);

  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Add sleep logs
    sleepLogs?.slice(0, 20).forEach(log => {
      events.push({
        id: `sleep-${log.id}`,
        type: 'sleep',
        title: log.sleep_type === 'noturno' ? 'Sono noturno' : 'Soneca',
        description: log.duration_minutes
          ? `${Math.floor(log.duration_minutes / 60)}h ${log.duration_minutes % 60}min`
          : 'Em andamento',
        date: new Date(log.sleep_start),
        icon: '🌙',
        color: 'bg-indigo-500',
      });
    });

    // Add feeding logs
    feedingLogs?.slice(0, 20).forEach(log => {
      const feedingTypeLabel =
        log.feeding_type === 'breastfeeding'
          ? 'Amamentação'
          : log.feeding_type === 'bottle'
            ? 'Mamadeira'
            : 'Fórmula';
      events.push({
        id: `feeding-${log.id}`,
        type: 'feeding',
        title: feedingTypeLabel,
        description: log.volume_ml
          ? `${log.volume_ml}ml`
          : log.duration_minutes
            ? `${log.duration_minutes}min`
            : undefined,
        date: new Date(log.start_time),
        icon: '🍼',
        color: 'bg-pink-500',
      });
    });

    // Add colic logs
    colicLogs?.slice(0, 10).forEach(log => {
      events.push({
        id: `colic-${log.id}`,
        type: 'colic',
        title: 'Episódio de Cólica',
        description: log.intensity ? `Intensidade: ${log.intensity}/5` : undefined,
        date: new Date(log.start_time),
        icon: '😢',
        color: 'bg-amber-500',
      });
    });

    // Add appointments
    appointments?.forEach(apt => {
      events.push({
        id: `apt-${apt.id}`,
        type: 'appointment',
        title: apt.title,
        description: apt.doctor_name || apt.location || undefined,
        date: new Date(apt.scheduled_date),
        icon: '📅',
        color: 'bg-blue-500',
        isMilestone: true,
      });
    });

    // Add first times (these are milestones)
    firstTimes?.forEach(ft => {
      events.push({
        id: `first-${ft.id}`,
        type: 'first_time',
        title: ft.title,
        description: ft.description || undefined,
        date: new Date(ft.event_date),
        icon: '⭐',
        color: 'bg-yellow-500',
        isMilestone: true,
      });
    });

    // Add development milestones
    milestones
      ?.filter(m => m.status === 'achieved')
      .slice(0, 10)
      .forEach(m => {
        events.push({
          id: `milestone-${m.id}`,
          type: 'milestone',
          title: 'Marco do Desenvolvimento',
          description: m.mother_notes || undefined,
          date: m.achieved_date ? new Date(m.achieved_date) : new Date(m.created_at || ''),
          icon: '🏆',
          color: 'bg-green-500',
          isMilestone: true,
        });
      });

    // Sort by date descending
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [sleepLogs, feedingLogs, colicLogs, appointments, firstTimes, milestones]);

  // Group events by day
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: TimelineEvent[] } = {};

    timelineEvents.forEach(event => {
      const dayKey = startOfDay(event.date).toISOString();
      if (!groups[dayKey]) {
        groups[dayKey] = [];
      }
      groups[dayKey].push(event);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 7); // Show last 7 days with events
  }, [timelineEvents]);

  const formatDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';

    const daysAgo = differenceInDays(new Date(), date);
    if (daysAgo < 7) return format(date, 'EEEE', { locale: ptBR });

    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Linha do Tempo
        </CardTitle>
        <CardDescription>Visualize todos os eventos e marcos do bebê</CardDescription>
      </CardHeader>
      <CardContent>
        {groupedEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Nenhum evento registrado</p>
            <p className="text-sm mt-1">Os registros de sono, mamadas e marcos aparecerão aqui</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {groupedEvents.map(([dayKey, events]) => (
                <div key={dayKey}>
                  <div className="sticky top-0 bg-background z-10 py-2">
                    <Badge variant="outline" className="capitalize">
                      {formatDayLabel(dayKey)}
                    </Badge>
                  </div>
                  <div className="relative pl-6 space-y-4">
                    {/* Vertical line */}
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />

                    {events.map(event => (
                      <div key={event.id} className="relative">
                        {/* Dot */}
                        <div
                          className={`absolute -left-4 top-1 w-4 h-4 rounded-full ${event.color} flex items-center justify-center text-[10px] ${
                            event.isMilestone ? 'ring-2 ring-offset-2 ring-yellow-500' : ''
                          }`}
                        >
                          {event.isMilestone && '★'}
                        </div>

                        <div
                          className={`p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow ${
                            event.isMilestone ? 'border-yellow-500/30 bg-yellow-500/5' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2">
                              <span className="text-xl">{event.icon}</span>
                              <div>
                                <p className="font-medium text-sm">{event.title}</p>
                                {event.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(event.date, 'HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">Legenda:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              🌙 Sono
            </Badge>
            <Badge variant="outline" className="text-xs">
              🍼 Mamada
            </Badge>
            <Badge variant="outline" className="text-xs">
              😢 Cólica
            </Badge>
            <Badge variant="outline" className="text-xs">
              📅 Consulta
            </Badge>
            <Badge variant="outline" className="text-xs border-yellow-500/50">
              ⭐ Primeira Vez
            </Badge>
            <Badge variant="outline" className="text-xs border-yellow-500/50">
              🏆 Marco
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
