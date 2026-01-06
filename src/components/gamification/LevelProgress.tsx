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
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg">
                {level}
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 animate-pulse" />
            </div>
            <div>
              <p className="font-semibold">Nível {level}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {xp_total} XP total
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Próximo nível</p>
            <p className="font-medium">{xp_for_next_level} XP</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(progress_percentage)}%</span>
            <span>{xp_for_next_level - xp_total} XP restantes</span>
          </div>
          <Progress 
            value={progress_percentage} 
            className="h-2 bg-primary/20"
          />
        </div>
      </CardContent>
    </Card>
  );
});

LevelProgress.displayName = "LevelProgress";
