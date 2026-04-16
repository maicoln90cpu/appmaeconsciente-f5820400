import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Milk,
  Moon,
  Pill,
  Calendar,
  Apple,
  Frown,
  CalendarClock,
} from 'lucide-react';
import { useVaccination } from '@/hooks/useVaccination';
import { useBabyAppointments } from '@/hooks/useBabyAppointments';
import { useBabyMedications } from '@/hooks/useBabyMedications';
import { useBabyRoutines } from '@/hooks/useBabyRoutines';
import { useBabyColic } from '@/hooks/useBabyColic';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UnifiedCalendarProps {
  babyProfileId?: string;
}

type EventType = 'appointment' | 'medication' | 'routine' | 'colic' | 'feeding' | 'sleep';

interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  time?: string;
  date: Date;
  icon: typeof Milk;
  color: string;
}

export const UnifiedCalendar = ({ babyProfileId }: UnifiedCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');

  const { appointments } = useBabyAppointments(babyProfileId);
  const { medications, todayLogs } = useBabyMedications(babyProfileId);
  const { todaysRoutines } = useBabyRoutines(babyProfileId);
  const { colicLogs } = useBabyColic(babyProfileId);

  // Build events from all sources
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    // Appointments
    appointments?.forEach(apt => {
      allEvents.push({
        id: apt.id,
        type: 'appointment',
        title: apt.title,
        time: apt.scheduled_time?.slice(0, 5),
        date: new Date(apt.scheduled_date + 'T00:00:00'),
        icon: Calendar,
        color: 'bg-blue-100 text-blue-700 border-blue-300',
      });
    });

    // Colic logs
    colicLogs?.forEach(log => {
      allEvents.push({
        id: log.id,
        type: 'colic',
        title: `Cólica - ${log.duration_minutes || '?'}min`,
        time: format(new Date(log.start_time), 'HH:mm'),
        date: new Date(log.start_time),
        icon: Frown,
        color: 'bg-rose-100 text-rose-700 border-rose-300',
      });
    });

    return allEvents;
  }, [appointments, colicLogs]);

  // Get days of current month
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.date, day));
  };

  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  // Filter events
  const filteredEvents =
    filterType === 'all'
      ? selectedDateEvents
      : selectedDateEvents.filter(e => e.type === filterType);

  // Navigation
  const goToPreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Get first day of week offset
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Calendário Unificado
              </CardTitle>
              <CardDescription>Visualize todas as atividades em um só lugar</CardDescription>
            </div>
            <Select value={filterType} onValueChange={v => setFilterType(v as EventType | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="appointment">Consultas</SelectItem>
                <SelectItem value="medication">Medicamentos</SelectItem>
                <SelectItem value="colic">Cólicas</SelectItem>
                <SelectItem value="routine">Rotinas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h3>
              <Button variant="ghost" size="sm" onClick={goToToday}>
                Hoje
              </Button>
            </div>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {/* Week days header */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}

            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12" />
            ))}

            {/* Days */}
            {monthDays.map(day => {
              const dayEvents = getEventsForDay(day);
              const hasEvents = dayEvents.length > 0;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'h-12 rounded-lg flex flex-col items-center justify-center relative transition-colors',
                    isSelected && 'bg-primary text-primary-foreground',
                    !isSelected && isTodayDate && 'bg-accent',
                    !isSelected && !isTodayDate && 'hover:bg-muted'
                  )}
                >
                  <span className={cn('text-sm', isTodayDate && !isSelected && 'font-bold')}>
                    {format(day, 'd')}
                  </span>
                  {hasEvents && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div
                          key={i}
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            event.type === 'appointment' && 'bg-blue-500',
                            event.type === 'colic' && 'bg-rose-500',
                            event.type === 'medication' && 'bg-green-500',
                            event.type === 'routine' && 'bg-violet-500'
                          )}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Events */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {selectedDate
                ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
                : 'Selecione um dia'}
            </h4>

            <ScrollArea className="h-[200px]">
              {filteredEvents.length > 0 ? (
                <div className="space-y-2">
                  {filteredEvents.map(event => (
                    <div
                      key={event.id}
                      className={cn('flex items-center gap-3 p-3 rounded-lg border', event.color)}
                    >
                      <event.icon className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        {event.time && <p className="text-xs opacity-80">{event.time}</p>}
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {event.type === 'appointment'
                          ? 'Consulta'
                          : event.type === 'colic'
                            ? 'Cólica'
                            : event.type === 'medication'
                              ? 'Medicamento'
                              : event.type === 'routine'
                                ? 'Rotina'
                                : event.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum evento neste dia</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
