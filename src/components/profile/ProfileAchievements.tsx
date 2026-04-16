import { useState, useEffect } from 'react';

import { Trophy, Star, TrendingUp, Heart, Award, Sparkles, Moon, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { LevelProgress } from '@/components/gamification/LevelProgress';

import { supabase } from '@/integrations/supabase/client';

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  star: Star,
  'trending-up': TrendingUp,
  heart: Heart,
  award: Award,
  sparkles: Sparkles,
  moon: Moon,
};

interface AchievementMini {
  code: string;
  name: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  total: number;
}

export const ProfileAchievements = () => {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<AchievementMini[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: progress } = await supabase
        .from('user_achievement_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!progress) {
        setLoading(false);
        return;
      }

      setAchievements([
        {
          code: 'sleep_master',
          name: 'Mestre do Sono',
          icon: 'moon',
          unlocked: progress.has_sleep_master,
          progress: progress.sleep_logs_count,
          total: 7,
        },
        {
          code: 'feeding_queen',
          name: 'Rainha Amamentação',
          icon: 'heart',
          unlocked: progress.has_feeding_queen,
          progress: progress.feeding_logs_count,
          total: 30,
        },
        {
          code: 'savings_master',
          name: 'Economista',
          icon: 'trending-up',
          unlocked: progress.has_savings_master,
          progress: Math.round(progress.total_savings || 0),
          total: 200,
        },
        {
          code: 'organizer_expert',
          name: 'Organizadora',
          icon: 'award',
          unlocked: progress.has_organizer_expert,
          progress: progress.enxoval_items_count,
          total: 50,
        },
        {
          code: 'peaceful_nights',
          name: 'Noites Tranquilas',
          icon: 'sparkles',
          unlocked: progress.has_peaceful_nights,
          progress: progress.long_sleep_count,
          total: 3,
        },
        {
          code: 'first_week',
          name: 'Primeira Semana',
          icon: 'star',
          unlocked: progress.has_first_week,
          progress: Math.round(progress.days_using_app || 0),
          total: 7,
        },
        {
          code: 'complete_bag',
          name: 'Mala Completa',
          icon: 'trophy',
          unlocked: progress.has_complete_bag,
          progress: progress.mala_categories,
          total: 10,
        },
      ]);
    } catch (e) {
      console.error('Error loading achievements:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;
  const pct = total > 0 ? (unlockedCount / total) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Conquistas & Nível
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/conquistas')}
            className="gap-1 text-xs"
          >
            Ver todas <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level compact */}
        <LevelProgress compact />

        {/* Overall progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {unlockedCount} de {total} conquistas
            </span>
            <span>{Math.round(pct)}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>

        {/* Mini badge grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {achievements.map(a => {
            const Icon = iconMap[a.icon] || Trophy;
            return (
              <div
                key={a.code}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all ${
                  a.unlocked ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'opacity-40 grayscale'
                }`}
                title={`${a.name}: ${a.progress}/${a.total}`}
              >
                <Icon
                  className={`h-5 w-5 ${a.unlocked ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`}
                />
                <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                  {a.name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
