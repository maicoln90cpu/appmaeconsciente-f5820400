/**
 * @fileoverview Componente para mostrar streak de login diário
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDailyLogin } from "@/hooks/useDailyLogin";
import { Flame, Trophy, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const DailyLoginTracker = () => {
  const { currentStreak, longestStreak, isLoading } = useDailyLogin();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Determine flame intensity based on streak
  const getFlameColor = () => {
    if (currentStreak >= 30) return "text-orange-500";
    if (currentStreak >= 14) return "text-amber-500";
    if (currentStreak >= 7) return "text-yellow-500";
    return "text-muted-foreground";
  };

  const getStreakMessage = () => {
    if (currentStreak >= 30) return "Você está em chamas! 🔥";
    if (currentStreak >= 14) return "Incrível consistência!";
    if (currentStreak >= 7) return "Uma semana inteira!";
    if (currentStreak >= 3) return "Ótimo começo!";
    if (currentStreak === 1) return "Primeiro dia!";
    return "Comece sua sequência!";
  };

  return (
    <Card className="overflow-hidden min-w-0">
      <CardHeader className="pb-2 px-3 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Login Diário
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="flex items-center justify-between gap-2">
          {/* Current Streak */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div
              className={cn(
                "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-muted shrink-0",
                currentStreak >= 7 && "animate-pulse"
              )}
            >
              <Flame className={cn("h-5 w-5 sm:h-6 sm:w-6", getFlameColor())} />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{currentStreak}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">dias seguidos</p>
            </div>
          </div>

          {/* Streak Message */}
          <div className="text-right min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium truncate">{getStreakMessage()}</p>
            <div className="flex items-center justify-end gap-1 text-[10px] sm:text-xs text-muted-foreground">
              <Trophy className="h-3 w-3 shrink-0" />
              <span className="truncate">Recorde: {longestStreak}</span>
            </div>
          </div>
        </div>

        {/* Streak milestones */}
        {currentStreak > 0 && (
          <div className="mt-3 sm:mt-4 flex gap-1.5 sm:gap-2">
            {[7, 14, 30].map((milestone) => (
              <div
                key={milestone}
                className={cn(
                  "flex-1 rounded-lg p-1.5 sm:p-2 text-center transition-colors min-w-0",
                  currentStreak >= milestone
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <p className="text-[10px] sm:text-xs font-medium">{milestone} dias</p>
                <p className="text-[8px] sm:text-[10px] truncate">
                  {currentStreak >= milestone
                    ? "✓ Alcançado"
                    : `${milestone - currentStreak} restantes`}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
