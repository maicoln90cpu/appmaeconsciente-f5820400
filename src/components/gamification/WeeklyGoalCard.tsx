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
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          Meta Semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Week days visualization */}
        <div className="flex justify-between gap-1">
          {weekDays.map((day) => (
            <div
              key={day.date}
              className={cn(
                "flex flex-col items-center gap-1",
                day.isToday && "font-semibold"
              )}
            >
              <span className="text-xs text-muted-foreground capitalize">
                {day.dayName}
              </span>
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                  day.hasActivity
                    ? "bg-primary text-primary-foreground"
                    : day.isFuture
                    ? "bg-muted/50"
                    : "bg-muted",
                  day.isToday && !day.hasActivity && "ring-2 ring-primary ring-offset-2"
                )}
              >
                {day.hasActivity ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4 opacity-30" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {activeDays} de {targetDays} dias
            </span>
            <span className="font-medium text-primary">
              +{totalXPThisWeek} XP
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Reward section */}
        <div
          className={cn(
            "flex items-center justify-between p-3 rounded-lg transition-colors",
            goalCompleted
              ? rewardClaimed
                ? "bg-muted"
                : "bg-primary/10"
              : "bg-muted/50"
          )}
        >
          <div className="flex items-center gap-2">
            <Gift
              className={cn(
                "h-5 w-5",
                goalCompleted && !rewardClaimed
                  ? "text-primary animate-bounce"
                  : "text-muted-foreground"
              )}
            />
            <div>
              <p className="text-sm font-medium">
                {rewardClaimed
                  ? "Recompensa resgatada!"
                  : `Recompensa: +${WEEKLY_GOAL_REWARD_XP} XP`}
              </p>
              {!goalCompleted && (
                <p className="text-xs text-muted-foreground">
                  Faltam {targetDays - activeDays} dias para completar
                </p>
              )}
            </div>
          </div>
          {goalCompleted && !rewardClaimed && (
            <Button
              size="sm"
              onClick={() => claimReward()}
              disabled={isClaiming}
            >
              {isClaiming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Resgatar"
              )}
            </Button>
          )}
          {rewardClaimed && (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
