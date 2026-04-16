import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { Database } from '@/integrations/supabase/types';

import { supabase } from '@/integrations/supabase/client';

type PostpartumAchievementRow = Database['public']['Tables']['postpartum_achievements']['Row'];
type DailyWellnessScoreRow = Database['public']['Tables']['daily_wellness_score']['Row'];

export type PostpartumAchievement = PostpartumAchievementRow;
export type DailyWellnessScore = DailyWellnessScoreRow;

// Definição das conquistas disponíveis
export const ACHIEVEMENT_DEFINITIONS = [
  {
    code: 'first_week',
    name: '7 Dias de Cuidado',
    description: 'Completou a primeira semana de recuperação',
    icon: '🌟',
  },
  {
    code: 'hydration_master',
    name: 'Rainha da Hidratação',
    description: '7 dias consecutivos atingindo meta de água',
    icon: '💧',
  },
  {
    code: 'medication_adherent',
    name: 'Disciplina no Autocuidado',
    description: '14 dias seguindo medicamentos corretamente',
    icon: '💊',
  },
  {
    code: 'good_days_streak',
    name: 'Semana Positiva',
    description: '7 "dias bons" consecutivos',
    icon: '🌸',
  },
  {
    code: 'self_love_journey',
    name: 'Jornada de Autoestima',
    description: '10 registros no diário de autoestima',
    icon: '💕',
  },
  {
    code: 'exercise_starter',
    name: 'Movimento é Cura',
    description: 'Completou primeiro exercício de recuperação',
    icon: '🧘‍♀️',
  },
  {
    code: 'six_week_milestone',
    name: 'Marco de 6 Semanas',
    description: 'Chegou na reavaliação médica de 6 semanas',
    icon: '🎉',
  },
];

export const usePostpartumAchievements = () => {
  const queryClient = useQueryClient();

  const { data: achievements, isLoading: loadingAchievements } = useQuery({
    queryKey: ['postpartum-achievements'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('postpartum_achievements')
        .select('id, user_id, achievement_code, unlocked_at')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: wellnessScores, isLoading: loadingScores } = useQuery({
    queryKey: ['daily-wellness-scores'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('daily_wellness_score')
        .select(
          'id, user_id, date, physical_score, emotional_score, energy_score, pain_score, total_score, is_good_day, notes, created_at'
        )
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data;
    },
  });

  const unlockAchievement = useMutation({
    mutationFn: async ({
      achievement_code,
    }: {
      achievement_code: string;
      achievement_name?: string;
      achievement_description?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('postpartum_achievements')
        .insert({
          user_id: user.id,
          achievement_code,
        })
        .select()
        .single();

      if (error) {
        // Ignora erro de duplicata (conquista já desbloqueada)
        if (error.code === '23505') return null;
        throw error;
      }
      return data;
    },
    onSuccess: data => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['postpartum-achievements'] });
        const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.code === data.achievement_code);
        toast.success(`🎉 Conquista desbloqueada: ${achievement?.icon} ${achievement?.name}`, {
          duration: 5000,
        });
      }
    },
  });

  const recordDailyScore = useMutation({
    mutationFn: async (scores: {
      date: string;
      physical_score?: number;
      emotional_score?: number;
      energy_score?: number;
      pain_score?: number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const total_score =
        (scores.physical_score ?? 0) +
        (scores.emotional_score ?? 0) +
        (scores.energy_score ?? 0) +
        (100 - (scores.pain_score ?? 0));
      const is_good_day = total_score >= 280; // 70% de 400

      const { data, error } = await supabase
        .from('daily_wellness_score')
        .upsert(
          {
            user_id: user.id,
            date: scores.date,
            physical_score: scores.physical_score,
            emotional_score: scores.emotional_score,
            energy_score: scores.energy_score,
            pain_score: scores.pain_score,
            total_score,
            is_good_day,
          },
          {
            onConflict: 'user_id,date',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-wellness-scores'] });
    },
  });

  // Calcular streak de "dias bons"
  const getGoodDaysStreak = () => {
    if (!wellnessScores) return 0;

    let streak = 0;
    for (const score of wellnessScores) {
      if (score.is_good_day) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  return {
    achievements,
    wellnessScores,
    isLoading: loadingAchievements || loadingScores,
    unlockAchievement: unlockAchievement.mutate,
    recordDailyScore: recordDailyScore.mutate,
    getGoodDaysStreak,
  };
};
