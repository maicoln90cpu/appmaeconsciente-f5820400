import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { usePostpartumAchievements, ACHIEVEMENT_DEFINITIONS } from '@/hooks/postpartum';
import { Trophy, Star, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ConquistasRecuperacao = () => {
  const { achievements, wellnessScores, isLoading, getGoodDaysStreak } =
    usePostpartumAchievements();

  const unlockedCodes = new Set(achievements?.map(a => a.achievement_code) || []);
  const goodDaysStreak = getGoodDaysStreak();
  const totalAchievements = ACHIEVEMENT_DEFINITIONS.length;
  const unlockedCount = unlockedCodes.size;
  const progressPercent = (unlockedCount / totalAchievements) * 100;

  if (isLoading) {
    return <div className="text-center py-8">Carregando conquistas...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com progresso geral */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            Conquistas de Recuperação
          </CardTitle>
          <CardDescription className="text-base">
            🌟 Cada passo da sua jornada merece ser celebrado!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Progresso: {unlockedCount} de {totalAchievements}
              </span>
              <span className="font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{goodDaysStreak}</p>
              <p className="text-xs text-muted-foreground">Dias Bons Seguidos</p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{unlockedCount}</p>
              <p className="text-xs text-muted-foreground">Conquistas Desbloqueadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de conquistas */}
      <div className="grid gap-4 sm:grid-cols-2">
        {ACHIEVEMENT_DEFINITIONS.map(achievement => {
          const isUnlocked = unlockedCodes.has(achievement.code);
          const unlockedData = achievements?.find(a => a.achievement_code === achievement.code);

          return (
            <Card
              key={achievement.code}
              className={`transition-all ${
                isUnlocked
                  ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30'
                  : 'opacity-60 grayscale'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`text-4xl ${isUnlocked ? 'animate-bounce' : ''}`}>
                      {isUnlocked ? (
                        achievement.icon
                      ) : (
                        <Lock className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{achievement.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {achievement.description}
                      </CardDescription>
                    </div>
                  </div>
                  {isUnlocked && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
                </div>
              </CardHeader>
              {isUnlocked && unlockedData && (
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Desbloqueada em{' '}
                    {format(new Date(unlockedData.unlocked_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Mensagens motivacionais baseadas no progresso */}
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-pink-200">
        <CardContent className="py-6">
          <p className="text-center text-sm font-medium">
            {unlockedCount === 0 && '💕 Comece sua jornada — cada pequeno passo conta!'}
            {unlockedCount > 0 &&
              unlockedCount < 3 &&
              '🌸 Você está indo muito bem! Continue assim.'}
            {unlockedCount >= 3 && unlockedCount < 5 && '✨ Que orgulho da sua dedicação!'}
            {unlockedCount >= 5 &&
              unlockedCount < totalAchievements &&
              '🌟 Você é inspiração! Quase lá.'}
            {unlockedCount === totalAchievements &&
              '🎉 INCRÍVEL! Todas as conquistas desbloqueadas!'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
