import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Trophy, 
  Medal, 
  Crown, 
  Flame, 
  Star,
  TrendingUp,
  Shield,
  Eye,
  EyeOff
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const getRankIcon = (position: number) => {
  switch (position) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-muted-foreground">{position}</span>;
  }
};

const getRankBg = (position: number) => {
  switch (position) {
    case 1:
      return 'bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-yellow-500/20';
    case 2:
      return 'bg-gradient-to-r from-gray-400/10 to-gray-400/5 border-gray-400/20';
    case 3:
      return 'bg-gradient-to-r from-amber-600/10 to-amber-600/5 border-amber-600/20';
    default:
      return 'bg-card border-border';
  }
};

interface LeaderboardProps {
  limit?: number;
  showPrivacyToggle?: boolean;
}

export const Leaderboard = memo(({ limit = 10, showPrivacyToggle = true }: LeaderboardProps) => {
  const { user } = useAuth();
  const { 
    leaderboard, 
    leaderboardOptIn, 
    toggleLeaderboardOptIn, 
    userRank,
    isLoading 
  } = useGamification();

  const displayedEntries = leaderboard.slice(0, limit);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Carregando ranking...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Ranking Semanal
            </CardTitle>
            <CardDescription>
              Top {limit} mamães mais ativas
            </CardDescription>
          </div>
          {userRank && (
            <Badge variant="secondary" className="text-sm">
              Sua posição: #{userRank}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Privacy Toggle */}
        {showPrivacyToggle && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2">
              {leaderboardOptIn ? (
                <Eye className="h-4 w-4 text-primary" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="leaderboard-opt-in" className="text-sm font-medium cursor-pointer">
                  Participar do ranking
                </Label>
                <p className="text-xs text-muted-foreground">
                  Seu nome será exibido de forma anônima (ex: M***)
                </p>
              </div>
            </div>
            <Switch
              id="leaderboard-opt-in"
              checked={leaderboardOptIn}
              onCheckedChange={toggleLeaderboardOptIn}
            />
          </div>
        )}

        {/* Leaderboard List */}
        {displayedEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum participante ainda</p>
            <p className="text-sm">
              Ative sua participação para aparecer no ranking!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {displayedEntries.map((entry, idx) => {
                const isCurrentUser = entry.user_id === user?.id;
                
                return (
                  <div
                    key={entry.user_id}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border transition-all
                      ${getRankBg(entry.rank_position)}
                      ${isCurrentUser ? 'ring-2 ring-primary ring-offset-2' : ''}
                    `}
                  >
                    {/* Rank */}
                    <div className="w-8 flex justify-center">
                      {getRankIcon(entry.rank_position)}
                    </div>
                    
                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {entry.display_name}
                          {isCurrentUser && (
                            <span className="ml-1 text-xs text-primary">(você)</span>
                          )}
                        </p>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          Nível {entry.level}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {entry.xp_total} XP
                        </span>
                        {entry.max_streak > 0 && (
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-orange-500" />
                            {entry.max_streak} dias
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3 text-yellow-500" />
                          {entry.badges_count} badges
                        </span>
                      </div>
                    </div>
                    
                    {/* Weekly XP */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-primary flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +{entry.weekly_xp}
                      </p>
                      <p className="text-xs text-muted-foreground">esta semana</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
});

Leaderboard.displayName = 'Leaderboard';
