import { useState, useEffect } from 'react';

import { Trophy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/page-loader';
import { Progress } from '@/components/ui/progress';


import { AchievementBadge, Achievement } from '@/components/AchievementBadge';


import { supabase } from '@/integrations/supabase/client';

interface AchievementProgress {
  user_id: string;
  sleep_logs_count: number;
  has_sleep_master: boolean;
  feeding_logs_count: number;
  has_feeding_queen: boolean;
  total_savings: number;
  has_savings_master: boolean;
  enxoval_items_count: number;
  has_organizer_expert: boolean;
  long_sleep_count: number;
  has_peaceful_nights: boolean;
  days_using_app: number;
  has_first_week: boolean;
  mala_categories: number;
  has_complete_bag: boolean;
}

const MinhasConquistas = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<AchievementProgress | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar progresso
      const { data: progressData } = await supabase
        .from('user_achievement_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setProgress(progressData);

      // Buscar conquistas desbloqueadas
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select('achievement_code')
        .eq('user_id', user.id);

      setUnlockedAchievements(achievements?.map(a => a.achievement_code) || []);
    } catch (error) {
      console.error('Error loading achievements:', error);
      toast.error('Erro ao carregar conquistas', { description: 'Tente novamente mais tarde.' });
    } finally {
      setLoading(false);
    }
  };

  const achievements: Achievement[] = [
    {
      code: 'sleep_master',
      name: 'Mestre do Sono',
      description: 'Registre 7 ou mais sonecas do bebê',
      icon: 'moon',
      unlocked: progress?.has_sleep_master || false,
      progress: progress?.sleep_logs_count || 0,
      total: 7,
    },
    {
      code: 'feeding_queen',
      name: 'Rainha da Amamentação',
      description: 'Registre 30 ou mais mamadas',
      icon: 'heart',
      unlocked: progress?.has_feeding_queen || false,
      progress: progress?.feeding_logs_count || 0,
      total: 30,
    },
    {
      code: 'savings_master',
      name: 'Economista Consciente',
      description: 'Economize R$ 200 ou mais no enxoval',
      icon: 'trending-up',
      unlocked: progress?.has_savings_master || false,
      progress: Math.round(progress?.total_savings || 0),
      total: 200,
    },
    {
      code: 'organizer_expert',
      name: 'Organizadora Expert',
      description: 'Adicione 50 ou mais itens ao enxoval',
      icon: 'award',
      unlocked: progress?.has_organizer_expert || false,
      progress: progress?.enxoval_items_count || 0,
      total: 50,
    },
    {
      code: 'peaceful_nights',
      name: 'Noites Tranquilas',
      description: 'Bebê dormiu 6h ou mais consecutivas (3 vezes)',
      icon: 'sparkles',
      unlocked: progress?.has_peaceful_nights || false,
      progress: progress?.long_sleep_count || 0,
      total: 3,
    },
    {
      code: 'first_week',
      name: 'Primeira Semana',
      description: 'Use o app por 7 dias consecutivos',
      icon: 'star',
      unlocked: progress?.has_first_week || false,
      progress: Math.round(progress?.days_using_app || 0),
      total: 7,
    },
    {
      code: 'complete_bag',
      name: 'Mala Completa',
      description: 'Complete 10 ou mais itens da mala da maternidade',
      icon: 'trophy',
      unlocked: progress?.has_complete_bag || false,
      progress: progress?.mala_categories || 0,
      total: 10,
    },
  ];

  const totalAchievements = achievements.length;
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const progressPercentage = (unlockedCount / totalAchievements) * 100;

  const shareAllAchievements = () => {
    const message =
      `🏆 Minhas Conquistas no Mãe Consciente!\n\n` +
      `${unlockedCount} de ${totalAchievements} conquistas desbloqueadas!\n\n` +
      achievements
        .filter(a => a.unlocked)
        .map(a => `✅ ${a.name}`)
        .join('\n') +
      `\n\nEstou organizando minha maternidade com o app Mãe Consciente! 💜`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="container py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Trophy className="h-10 w-10 text-yellow-500" />
          Minhas Conquistas
        </h1>
        <p className="text-muted-foreground">
          Continue usando o app para desbloquear todas as conquistas!
        </p>
      </div>

      {/* Progresso Geral */}
      <Card className="mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-center">Progresso Geral</CardTitle>
          <CardDescription className="text-center">
            {unlockedCount} de {totalAchievements} conquistas desbloqueadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="h-4 mb-4" />
          <div className="flex justify-between items-center">
            <p className="text-2xl font-bold text-primary">{Math.round(progressPercentage)}%</p>
            {unlockedCount > 0 && (
              <Button onClick={shareAllAchievements} variant="outline">
                Compartilhar Conquistas
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid de Conquistas */}
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
        {achievements.map(achievement => (
          <AchievementBadge key={achievement.code} achievement={achievement} />
        ))}
      </div>

      {/* Dica */}
      {unlockedCount < totalAchievements && (
        <Card className="mt-8 bg-muted/50">
          <CardContent className="p-6 text-center">
            <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              💡 Dica: Continue registrando eventos e organizando seu enxoval para desbloquear mais
              conquistas!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MinhasConquistas;
