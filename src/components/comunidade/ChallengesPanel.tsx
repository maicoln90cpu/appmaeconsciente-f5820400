import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  useStreaksAndChallenges,
  type Challenge,
  type UserChallenge,
} from '@/hooks/useStreaksAndChallenges';
import {
  Trophy,
  Target,
  Flame,
  Star,
  MessageSquare,
  Heart,
  MessageCircle,
  Moon,
  Baby,
  ShoppingBag,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const iconMap: Record<string, React.ElementType> = {
  MessageSquare,
  Heart,
  MessageCircle,
  Moon,
  Baby,
  ShoppingBag,
  Briefcase,
  Trophy,
  Target,
  Star,
};

const ChallengeCard = memo(
  ({
    challenge,
    userChallenge,
    onStart,
  }: {
    challenge: Challenge;
    userChallenge?: UserChallenge;
    onStart: (id: string) => void;
  }) => {
    const Icon = iconMap[challenge.icon || 'Target'] || Target;
    const progress = userChallenge
      ? Math.round((userChallenge.progress / challenge.target_count) * 100)
      : 0;
    const isActive = userChallenge && !userChallenge.completed;
    const isCompleted = userChallenge?.completed;

    const daysLeft = userChallenge?.expires_at
      ? differenceInDays(new Date(userChallenge.expires_at), new Date())
      : null;

    return (
      <Card className={`transition-all ${isCompleted ? 'bg-primary/5 border-primary/20' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium truncate">{challenge.title}</h4>
                {isCompleted && (
                  <Badge variant="default" className="shrink-0">
                    <Trophy className="h-3 w-3 mr-1" />
                    Completo
                  </Badge>
                )}
                {daysLeft !== null && daysLeft >= 0 && !isCompleted && (
                  <Badge variant="outline" className="shrink-0">
                    {daysLeft} dias restantes
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-2">{challenge.description}</p>

              {isActive && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>
                      {userChallenge.progress}/{challenge.target_count}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {!userChallenge && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">
                    +{challenge.reward_points} pontos
                  </span>
                  <Button size="sm" onClick={() => onStart(challenge.id)}>
                    Começar
                  </Button>
                </div>
              )}

              {isCompleted && (
                <p className="text-xs text-muted-foreground mt-1">
                  Completado em{' '}
                  {format(new Date(userChallenge.completed_at!), "dd 'de' MMMM", { locale: ptBR })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

ChallengeCard.displayName = 'ChallengeCard';

const StreakDisplay = memo(
  ({ streaks }: { streaks: ReturnType<typeof useStreaksAndChallenges>['streaks'] }) => {
    if (streaks.length === 0) return null;

    const maxStreak = Math.max(...streaks.map(s => s.current_streak));

    return (
      <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Maior streak ativo</p>
              <p className="text-2xl font-bold">{maxStreak} dias</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {streaks.map(streak => (
              <div key={streak.id} className="flex items-center gap-2 text-sm">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="capitalize">{streak.streak_type.replace('_', ' ')}</span>
                <span className="font-medium">{streak.current_streak}d</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
);

StreakDisplay.displayName = 'StreakDisplay';

export const ChallengesPanel = () => {
  const {
    streaks,
    challenges,
    userChallenges,
    activeChallenges,
    completedChallenges,
    availableChallenges,
    totalPoints,
    isLoading,
    startChallenge,
  } = useStreaksAndChallenges();

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Points Summary */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary text-primary-foreground">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de pontos</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {completedChallenges.length} desafios
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Streaks */}
      {streaks.length > 0 && <StreakDisplay streaks={streaks} />}

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Desafios em Andamento
          </h3>
          {activeChallenges.map(uc => (
            <ChallengeCard
              key={uc.id}
              challenge={uc.challenge!}
              userChallenge={uc}
              onStart={startChallenge}
            />
          ))}
        </div>
      )}

      {/* Available Challenges */}
      {availableChallenges.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Desafios Disponíveis
          </h3>
          {availableChallenges.map(challenge => (
            <ChallengeCard key={challenge.id} challenge={challenge} onStart={startChallenge} />
          ))}
        </div>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
            <Star className="h-5 w-5" />
            Desafios Completados ({completedChallenges.length})
          </h3>
          {completedChallenges.slice(0, 3).map(uc => (
            <ChallengeCard
              key={uc.id}
              challenge={uc.challenge!}
              userChallenge={uc}
              onStart={startChallenge}
            />
          ))}
        </div>
      )}
    </div>
  );
};
