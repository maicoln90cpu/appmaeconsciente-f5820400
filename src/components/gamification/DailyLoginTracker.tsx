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
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Login Diário
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {/* Current Streak */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full bg-muted",
                currentStreak >= 7 && "animate-pulse"
              )}
            >
              <Flame className={cn("h-6 w-6", getFlameColor())} />
            </div>
            <div>
              <p className="text-2xl font-bold">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">dias seguidos</p>
            </div>
          </div>

          {/* Streak Message */}
          <div className="text-right">
            <p className="text-sm font-medium">{getStreakMessage()}</p>
            <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              <Trophy className="h-3 w-3" />
              <span>Recorde: {longestStreak} dias</span>
            </div>
          </div>
        </div>

        {/* Streak milestones */}
        {currentStreak > 0 && (
          <div className="mt-4 flex gap-2">
            {[7, 14, 30].map((milestone) => (
              <div
                key={milestone}
                className={cn(
                  "flex-1 rounded-lg p-2 text-center transition-colors",
                  currentStreak >= milestone
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <p className="text-xs font-medium">{milestone} dias</p>
                <p className="text-[10px]">
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
