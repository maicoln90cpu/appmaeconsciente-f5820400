/**
 * @fileoverview Card de metas semanais
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useWeeklyGoal } from "@/hooks/useWeeklyGoal";
import { Target, Gift, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const WeeklyGoalCard = () => {
  const {
    activeDays,
    targetDays,
    totalXPThisWeek,
    goalCompleted,
    rewardClaimed,
    progressPercentage,
    weekDays,
    claimReward,
    isClaiming,
    isLoading,
    WEEKLY_GOAL_REWARD_XP,
  } = useWeeklyGoal();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden min-w-0">
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Meta Semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
        {/* Week days visualization */}
        <div className="flex justify-between gap-0.5 sm:gap-1">
          {weekDays.map((day) => (
            <div
              key={day.date}
              className={cn(
                "flex flex-col items-center gap-0.5 min-w-0 flex-1",
                day.isToday && "font-semibold"
              )}
            >
              <span className="text-[8px] sm:text-xs text-muted-foreground capitalize truncate">
                {day.dayName.substring(0, 3)}
              </span>
              <div
                className={cn(
                  "h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center transition-colors",
                  day.hasActivity
                    ? "bg-primary text-primary-foreground"
                    : day.isFuture
                    ? "bg-muted/50"
                    : "bg-muted",
                  day.isToday && !day.hasActivity && "ring-1 sm:ring-2 ring-primary ring-offset-1 sm:ring-offset-2"
                )}
              >
                {day.hasActivity ? (
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Circle className="h-3 w-3 sm:h-4 sm:w-4 opacity-30" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">
              {activeDays}/{targetDays} dias
            </span>
            <span className="font-medium text-primary">
              +{totalXPThisWeek} XP
            </span>
          </div>
          <Progress value={progressPercentage} className="h-1.5 sm:h-2" />
        </div>

        {/* Reward section */}
        <div
          className={cn(
            "flex items-center justify-between p-2 sm:p-3 rounded-lg transition-colors gap-2",
            goalCompleted
              ? rewardClaimed
                ? "bg-muted"
                : "bg-primary/10"
              : "bg-muted/50"
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Gift
              className={cn(
                "h-4 w-4 sm:h-5 sm:w-5 shrink-0",
                goalCompleted && !rewardClaimed
                  ? "text-primary animate-bounce"
                  : "text-muted-foreground"
              )}
            />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium truncate">
                {rewardClaimed
                  ? "Resgatada!"
                  : `+${WEEKLY_GOAL_REWARD_XP} XP`}
              </p>
              {!goalCompleted && (
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  Faltam {targetDays - activeDays} dias
                </p>
              )}
            </div>
          </div>
          {goalCompleted && !rewardClaimed && (
            <Button
              size="sm"
              onClick={() => claimReward()}
              disabled={isClaiming}
              className="h-7 px-2 text-xs shrink-0"
            >
              {isClaiming ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Resgatar"
              )}
            </Button>
          )}
          {rewardClaimed && (
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
