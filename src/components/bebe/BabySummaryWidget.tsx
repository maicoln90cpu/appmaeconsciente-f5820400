import { useMemo } from 'react';

import { format, isToday, isTomorrow, differenceInHours, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Baby, Moon, Pill, Clock, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useBabyAppointments } from '@/hooks/useBabyAppointments';
import { useBabyColic } from '@/hooks/useBabyColic';
import { useBabyFeeding } from '@/hooks/useBabyFeeding';
import { useBabyMedications } from '@/hooks/useBabyMedications';
import { useBabySleep } from '@/hooks/useBabySleep';

export const BabySummaryWidget = () => {
  const { sleepLogs } = useBabySleep();
  const { feedingLogs } = useBabyFeeding();
  const { colicLogs } = useBabyColic();
  const { medications } = useBabyMedications();
  const { appointments } = useBabyAppointments();

  const todayStats = useMemo(() => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // Sleep stats
    const todaySleep =
      sleepLogs?.filter(log => {
        const logDate = new Date(log.sleep_start);
        return logDate >= todayStart && logDate <= todayEnd;
      }) || [];
    const totalSleepMinutes = todaySleep.reduce((acc, log) => acc + (log.duration_minutes || 0), 0);
    const sleepHours = Math.floor(totalSleepMinutes / 60);
    const sleepMins = totalSleepMinutes % 60;

    // Feeding stats
    const todayFeedings =
      feedingLogs?.filter(log => {
        const logDate = new Date(log.start_time);
        return logDate >= todayStart && logDate <= todayEnd;
      }) || [];

    // Colic stats
    const todayColic =
      colicLogs?.filter(log => {
        const logDate = new Date(log.start_time);
        return logDate >= todayStart && logDate <= todayEnd;
      }) || [];

    // Active medications
    const activeMeds = medications?.filter(med => med.is_active) || [];

    // Upcoming appointments (next 7 days)
    const upcomingAppts =
      appointments
        ?.filter(apt => {
          const aptDate = new Date(apt.scheduled_date);
          const diffDays = Math.ceil((aptDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7 && !apt.completed;
        })
        .sort(
          (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
        ) || [];

    // Last feeding time
    const lastFeeding = todayFeedings.length > 0 ? new Date(todayFeedings[0].start_time) : null;
    const hoursSinceFeeding = lastFeeding ? differenceInHours(today, lastFeeding) : null;

    return {
      sleepHours,
      sleepMins,
      totalSleepMinutes,
      feedingCount: todayFeedings.length,
      colicCount: todayColic.length,
      activeMeds: activeMeds.length,
      upcomingAppts,
      lastFeeding,
      hoursSinceFeeding,
    };
  }, [sleepLogs, feedingLogs, colicLogs, medications, appointments]);

  const formatAppointmentDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, 'dd/MM', { locale: ptBR });
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
      <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Baby className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          <span className="truncate">Resumo de Hoje</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {/* Sleep */}
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-full bg-indigo-500/20 shrink-0">
              <Moon className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Sono</p>
              <p className="font-semibold text-xs sm:text-sm truncate">
                {todayStats.sleepHours}h {todayStats.sleepMins}m
              </p>
            </div>
          </div>

          {/* Feedings */}
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-full bg-pink-500/20 shrink-0">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-pink-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Mamadas</p>
              <p className="font-semibold text-xs sm:text-sm">{todayStats.feedingCount}x</p>
            </div>
          </div>

          {/* Medications */}
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-green-500/10 dark:bg-green-500/20 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-full bg-green-500/20 shrink-0">
              <Pill className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Remédios</p>
              <p className="font-semibold text-xs sm:text-sm truncate">
                {todayStats.activeMeds} ativos
              </p>
            </div>
          </div>

          {/* Last feeding */}
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-full bg-orange-500/20 shrink-0">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Última</p>
              <p className="font-semibold text-xs sm:text-sm truncate">
                {todayStats.hoursSinceFeeding !== null
                  ? `${todayStats.hoursSinceFeeding}h atrás`
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Colic Alert */}
        {todayStats.colicCount > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-sm">
              {todayStats.colicCount} episódio{todayStats.colicCount > 1 ? 's' : ''} de cólica hoje
            </span>
          </div>
        )}

        {/* Upcoming Appointments */}
        {todayStats.upcomingAppts.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Próximas Consultas
            </p>
            <div className="flex flex-wrap gap-2">
              {todayStats.upcomingAppts.slice(0, 3).map(apt => (
                <Badge
                  key={apt.id}
                  variant={isToday(new Date(apt.scheduled_date)) ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {formatAppointmentDate(apt.scheduled_date)}: {apt.title}
                </Badge>
              ))}
              {todayStats.upcomingAppts.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{todayStats.upcomingAppts.length - 3} mais
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
