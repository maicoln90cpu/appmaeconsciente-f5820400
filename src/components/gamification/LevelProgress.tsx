import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useGamification } from "@/hooks/useGamification";
import { Sparkles, Star, TrendingUp } from "lucide-react";

interface LevelProgressProps {
  compact?: boolean;
}

export const LevelProgress = memo(({ compact = false }: LevelProgressProps) => {
  const { levelData, isLoading } = useGamification();

  if (isLoading || !levelData) {
    return null;
  }

  const { level, xp_total, xp_for_next_level, progress_percentage } = levelData;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold">
          <Star className="h-3 w-3 mr-1 fill-current" />
          Nível {level}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {xp_total} XP
        </span>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 overflow-hidden min-w-0">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-base sm:text-lg shadow-lg">
                {level}
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base">Nível {level}</p>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 truncate">
                <TrendingUp className="h-3 w-3 shrink-0" />
                <span className="truncate">{xp_total} XP total</span>
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Próximo</p>
            <p className="font-medium text-xs sm:text-sm">{xp_for_next_level} XP</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
            <span>{Math.round(progress_percentage)}%</span>
            <span className="truncate ml-2">{xp_for_next_level - xp_total} XP restantes</span>
          </div>
          <Progress 
            value={progress_percentage} 
            className="h-1.5 sm:h-2 bg-primary/20"
          />
        </div>
      </CardContent>
    </Card>
  );
});

LevelProgress.displayName = "LevelProgress";
