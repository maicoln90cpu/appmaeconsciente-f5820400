import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGamification } from "@/hooks/useGamification";
import { format, parseISO, getDay, startOfWeek, endOfWeek, eachWeekOfInterval, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Flame } from "lucide-react";

const LEVEL_COLORS = [
  "bg-muted",              // 0 - sem atividade
  "bg-emerald-200 dark:bg-emerald-900",  // 1 - baixa
  "bg-emerald-400 dark:bg-emerald-700",  // 2 - média
  "bg-emerald-500 dark:bg-emerald-600",  // 3 - alta
  "bg-emerald-600 dark:bg-emerald-500",  // 4 - muito alta
];

interface ActivityCalendarProps {
  showLegend?: boolean;
}

export const ActivityCalendar = memo(({ showLegend = true }: ActivityCalendarProps) => {
  const { activityCalendar, isLoading } = useGamification();

  // Organizar dados por semana
  const weeks = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 90);
    
    // Criar mapa de atividades por data
    const activityMap = new Map(
      activityCalendar.map(a => [a.date, a])
    );
    
    // Gerar semanas
    const weekStarts = eachWeekOfInterval(
      { start, end },
      { weekStartsOn: 0 }
    );
    
    return weekStarts.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
      const days = [];
      
      for (let d = weekStart; d <= weekEnd && d <= end; d = new Date(d.getTime() + 86400000)) {
        const dateStr = format(d, 'yyyy-MM-dd');
        const activity = activityMap.get(dateStr);
        
        days.push({
          date: d,
          dateStr,
          level: activity?.level || 0,
          xp: activity?.totalXP || 0,
          dayOfWeek: getDay(d),
        });
      }
      
      return { weekStart, days };
    });
  }, [activityCalendar]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const activeDays = activityCalendar.filter(a => a.hasActivity).length;
    const totalXP = activityCalendar.reduce((sum, a) => sum + a.totalXP, 0);
    
    // Calcular streak atual
    let currentStreak = 0;
    const sortedDays = [...activityCalendar].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    for (const day of sortedDays) {
      if (day.hasActivity) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return { activeDays, totalXP, currentStreak };
  }, [activityCalendar]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden min-w-0">
      <CardHeader className="pb-2 px-3 sm:px-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="truncate">Calendário</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        {/* Estatísticas - layout vertical em mobile */}
        <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 mb-3 sm:mb-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-muted-foreground">{stats.activeDays} ativos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
            <span className="text-muted-foreground">{stats.currentStreak} seguidos</span>
          </div>
          <div className="text-muted-foreground hidden sm:block">
            {stats.totalXP} XP
          </div>
        </div>

        {/* Calendário */}
        <TooltipProvider delayDuration={100}>
          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
            <div className="flex gap-0.5 min-w-max">
              {/* Labels dos dias - escondidos em mobile pequeno */}
              <div className="hidden xs:flex flex-col gap-0.5 text-[8px] sm:text-[10px] text-muted-foreground pr-1">
                <div className="h-2.5 sm:h-3" /> {/* Espaço para mês */}
                <span className="h-2.5 sm:h-3 leading-3">D</span>
                <span className="h-2.5 sm:h-3 leading-3">S</span>
                <span className="h-2.5 sm:h-3 leading-3">T</span>
                <span className="h-2.5 sm:h-3 leading-3">Q</span>
                <span className="h-2.5 sm:h-3 leading-3">Q</span>
                <span className="h-2.5 sm:h-3 leading-3">S</span>
                <span className="h-2.5 sm:h-3 leading-3">S</span>
              </div>
              
              {/* Semanas */}
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-0.5">
                  {/* Label do mês */}
                  <div className="h-2.5 sm:h-3 text-[8px] sm:text-[10px] text-muted-foreground">
                    {weekIdx === 0 || format(week.weekStart, 'MM') !== format(weeks[weekIdx - 1]?.weekStart || week.weekStart, 'MM')
                      ? format(week.weekStart, 'MMM', { locale: ptBR })
                      : ''
                    }
                  </div>
                  
                  {/* Dias */}
                  {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
                    const day = week.days.find(d => d.dayOfWeek === dayIdx);
                    
                    if (!day) {
                      return <div key={dayIdx} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />;
                    }
                    
                    return (
                      <Tooltip key={dayIdx}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm ${LEVEL_COLORS[day.level]} cursor-pointer transition-transform hover:scale-125`}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">
                            {format(day.date, "d 'de' MMMM", { locale: ptBR })}
                          </p>
                          <p className="text-muted-foreground">
                            {day.xp > 0 ? `${day.xp} XP ganhos` : 'Sem atividade'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </TooltipProvider>

        {/* Legenda - simplificada em mobile */}
        {showLegend && (
          <div className="flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 text-[10px] sm:text-xs text-muted-foreground">
            <span>Menos</span>
            {LEVEL_COLORS.map((color, idx) => (
              <div key={idx} className={`w-2 h-2 sm:w-3 sm:h-3 rounded-sm ${color}`} />
            ))}
            <span>Mais</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ActivityCalendar.displayName = "ActivityCalendar";
