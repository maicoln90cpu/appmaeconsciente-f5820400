import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";

export interface UserStreak {
  id: string;
  user_id: string;
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_count: number;
  reward_points: number;
  icon: string | null;
  duration_days: number | null;
  is_active: boolean;
  created_at: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  started_at: string;
  expires_at: string | null;
  challenge?: Challenge;
}

export const STREAK_TYPES = {
  sleep_log: { label: 'Diário do Sono', icon: 'Moon' },
  feeding_log: { label: 'Amamentação', icon: 'Baby' },
  community: { label: 'Comunidade', icon: 'Users' },
  wellness: { label: 'Bem-estar', icon: 'Heart' },
} as const;

export const useStreaksAndChallenges = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch user streaks
  const { data: streaks = [], isLoading: loadingStreaks } = useQuery({
    queryKey: ['user-streaks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserStreak[];
    },
    enabled: !!user,
  });

  // Fetch available challenges
  const { data: challenges = [], isLoading: loadingChallenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data as Challenge[];
    },
  });

  // Fetch user challenges
  const { data: userChallenges = [], isLoading: loadingUserChallenges } = useQuery({
    queryKey: ['user-challenges', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenge:challenges(*)
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as UserChallenge[];
    },
    enabled: !!user,
  });

  // Update streak
  const updateStreak = useMutation({
    mutationFn: async (streakType: string) => {
      if (!user) throw new Error('Not authenticated');

      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Get current streak
      const { data: existing } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .eq('streak_type', streakType)
        .maybeSingle();

      let newStreak = 1;
      let longestStreak = 1;

      if (existing) {
        const lastDate = existing.last_activity_date;
        
        if (lastDate === today) {
          // Already logged today
          return existing;
        }
        
        const daysDiff = lastDate 
          ? differenceInDays(new Date(today), parseISO(lastDate))
          : 999;

        if (daysDiff === 1) {
          // Consecutive day
          newStreak = existing.current_streak + 1;
        } else {
          // Streak broken
          newStreak = 1;
        }
        
        longestStreak = Math.max(newStreak, existing.longest_streak);
      }

      const { data, error } = await supabase
        .from('user_streaks')
        .upsert({
          user_id: user.id,
          streak_type: streakType,
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_activity_date: today,
        }, {
          onConflict: 'user_id,streak_type'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Check for streak milestones
      if (newStreak === 7) {
        toast.success(`🔥 ${STREAK_TYPES[streakType as keyof typeof STREAK_TYPES]?.label || streakType}: 7 dias consecutivos!`);
      } else if (newStreak === 14) {
        toast.success(`🔥🔥 ${STREAK_TYPES[streakType as keyof typeof STREAK_TYPES]?.label || streakType}: 14 dias consecutivos!`);
      } else if (newStreak === 30) {
        toast.success(`🔥🔥🔥 ${STREAK_TYPES[streakType as keyof typeof STREAK_TYPES]?.label || streakType}: 30 dias consecutivos! Incrível!`);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-streaks'] });
    },
  });

  // Start a challenge
  const startChallenge = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user) throw new Error('Not authenticated');

      const challenge = challenges.find(c => c.id === challengeId);
      const expiresAt = challenge?.duration_days 
        ? new Date(Date.now() + challenge.duration_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('user_challenges')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Você já está participando deste desafio');
        }
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
      toast.success('Desafio iniciado! Boa sorte! 🎯');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update challenge progress
  const updateChallengeProgress = useMutation({
    mutationFn: async ({ 
      challengeType, 
      increment = 1 
    }: { 
      challengeType: string; 
      increment?: number;
    }) => {
      if (!user) return;

      // Find matching user challenges
      const matchingChallenges = userChallenges.filter(uc => 
        uc.challenge?.challenge_type === challengeType && 
        !uc.completed &&
        (!uc.expires_at || new Date(uc.expires_at) > new Date())
      );

      for (const uc of matchingChallenges) {
        const newProgress = Math.min(uc.progress + increment, uc.challenge?.target_count || 999);
        const completed = newProgress >= (uc.challenge?.target_count || 999);

        await supabase
          .from('user_challenges')
          .update({
            progress: newProgress,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
          })
          .eq('id', uc.id);

        if (completed) {
          toast.success(`🎉 Desafio completado: ${uc.challenge?.title}! +${uc.challenge?.reward_points} pontos`);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
    },
  });

  // Get streak by type
  const getStreak = (type: string) => {
    return streaks.find(s => s.streak_type === type);
  };

  // Get total points from completed challenges
  const totalPoints = userChallenges
    .filter(uc => uc.completed)
    .reduce((acc, uc) => acc + (uc.challenge?.reward_points || 0), 0);

  // Get active challenges
  const activeChallenges = userChallenges.filter(uc => 
    !uc.completed && 
    (!uc.expires_at || new Date(uc.expires_at) > new Date())
  );

  // Get completed challenges
  const completedChallenges = userChallenges.filter(uc => uc.completed);

  // Get available challenges (not started yet)
  const availableChallenges = challenges.filter(c => 
    !userChallenges.some(uc => uc.challenge_id === c.id)
  );

  return {
    streaks,
    challenges,
    userChallenges,
    activeChallenges,
    completedChallenges,
    availableChallenges,
    totalPoints,
    isLoading: loadingStreaks || loadingChallenges || loadingUserChallenges,
    updateStreak: updateStreak.mutate,
    startChallenge: startChallenge.mutate,
    updateChallengeProgress: updateChallengeProgress.mutate,
    getStreak,
    STREAK_TYPES,
  };
};
