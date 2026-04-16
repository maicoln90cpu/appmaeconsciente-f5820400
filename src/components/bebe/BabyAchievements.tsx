import { useMemo } from 'react';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trophy, Star, Heart, Moon, Utensils, Footprints, Calendar, Award } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { useBabyFeeding } from '@/hooks/useBabyFeeding';
import { useBabyAchievements } from '@/hooks/useBabyGamification';
import { useBabyFirstTimes } from '@/hooks/useBabyGamification';
import { useBabySleep } from '@/hooks/useBabySleep';

interface BabyAchievementsProps {
  babyProfileId?: string;
}

const achievementDefinitions = [
  {
    type: 'first_sleep_log',
    title: 'Primeira Soneca',
    description: 'Registrou a primeira soneca do bebê',
    icon: '🌙',
    requirement: { type: 'sleep_logs', count: 1 },
  },
  {
    type: 'sleep_master_7',
    title: 'Mestre do Sono',
    description: 'Registrou 7 dias seguidos de sono',
    icon: '😴',
    requirement: { type: 'sleep_logs', count: 7 },
  },
  {
    type: 'first_feeding',
    title: 'Primeira Mamada',
    description: 'Registrou a primeira mamada',
    icon: '🍼',
    requirement: { type: 'feeding_logs', count: 1 },
  },
  {
    type: 'feeding_pro',
    title: 'Alimentação em Dia',
    description: '50 mamadas registradas',
    icon: '⭐',
    requirement: { type: 'feeding_logs', count: 50 },
  },
  {
    type: 'first_times_collector',
    title: 'Colecionador de Primeiras Vezes',
    description: 'Registrou 5 primeiras vezes',
    icon: '📸',
    requirement: { type: 'first_times', count: 5 },
  },
  {
    type: 'memory_keeper',
    title: 'Guardião de Memórias',
    description: 'Registrou 10 primeiras vezes',
    icon: '🏆',
    requirement: { type: 'first_times', count: 10 },
  },
  {
    type: 'super_parent',
    title: 'Super Papai/Mamãe',
    description: '100 registros no total',
    icon: '🦸',
    requirement: { type: 'total_logs', count: 100 },
  },
];

export const BabyAchievements = ({ babyProfileId }: BabyAchievementsProps) => {
  const { achievements } = useBabyAchievements(babyProfileId);
  const { sleepLogs } = useBabySleep();
  const { feedingLogs } = useBabyFeeding();
  const { firstTimes } = useBabyFirstTimes(babyProfileId);

  const progress = useMemo(() => {
    const sleepCount = sleepLogs?.length || 0;
    const feedingCount = feedingLogs?.length || 0;
    const firstTimesCount = firstTimes?.length || 0;
    const totalCount = sleepCount + feedingCount + firstTimesCount;

    return achievementDefinitions.map(def => {
      let currentCount = 0;
      switch (def.requirement.type) {
        case 'sleep_logs':
          currentCount = sleepCount;
          break;
        case 'feeding_logs':
          currentCount = feedingCount;
          break;
        case 'first_times':
          currentCount = firstTimesCount;
          break;
        case 'total_logs':
          currentCount = totalCount;
          break;
      }

      const isUnlocked = achievements?.some(a => a.achievement_type === def.type);
      const percentage = Math.min(100, (currentCount / def.requirement.count) * 100);

      return {
        ...def,
        currentCount,
        isUnlocked,
        percentage,
      };
    });
  }, [achievements, sleepLogs, feedingLogs, firstTimes]);

  const unlockedCount = progress.filter(p => p.isUnlocked).length;
  const totalAchievements = progress.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Conquistas do Bebê
            </CardTitle>
            <CardDescription>Desbloqueie conquistas acompanhando a rotina</CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {unlockedCount}/{totalAchievements}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {progress.map(achievement => (
            <div
              key={achievement.type}
              className={`relative p-4 rounded-lg border transition-all ${
                achievement.isUnlocked
                  ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
                  : 'bg-muted/30 border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`text-3xl ${achievement.isUnlocked ? '' : 'grayscale opacity-50'}`}>
                  {achievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm truncate">{achievement.title}</h4>
                    {achievement.isUnlocked && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                  {!achievement.isUnlocked && (
                    <div className="mt-2 space-y-1">
                      <Progress value={achievement.percentage} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">
                        {achievement.currentCount}/{achievement.requirement.count}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Unlocked achievements list */}
        {achievements && achievements.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Conquistas Desbloqueadas
            </h4>
            <div className="space-y-2">
              {achievements.slice(0, 5).map(achievement => (
                <div
                  key={achievement.id}
                  className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <span>{achievement.icon}</span>
                    <span>{achievement.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(achievement.achieved_at), 'dd/MM/yyyy', {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
