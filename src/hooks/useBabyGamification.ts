import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BabyAchievement {
  id: string;
  user_id: string;
  baby_profile_id: string | null;
  achievement_type: string;
  title: string;
  description: string | null;
  icon: string;
  achieved_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface BabyFirstTime {
  id: string;
  user_id: string;
  baby_profile_id: string | null;
  event_type: string;
  title: string;
  description: string | null;
  event_date: string;
  photo_url: string | null;
  video_url: string | null;
  location: string | null;
  witnesses: string[] | null;
  mood: string | null;
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface BabyTimelineEvent {
  id: string;
  user_id: string;
  baby_profile_id: string | null;
  event_type: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  icon: string | null;
  color: string | null;
  photo_url: string | null;
  related_record_id: string | null;
  related_record_type: string | null;
  is_milestone: boolean;
  created_at: string;
}

export const useBabyAchievements = (babyProfileId?: string) => {
  const queryClient = useQueryClient();

  const { data: achievements, isLoading } = useQuery({
    queryKey: ['baby-achievements', babyProfileId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('baby_achievements')
        .select(
          'id, user_id, baby_profile_id, achievement_type, title, description, icon, achieved_at, metadata, created_at'
        )
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false });

      if (babyProfileId) {
        query = query.eq('baby_profile_id', babyProfileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BabyAchievement[];
    },
  });

  const addAchievement = useMutation({
    mutationFn: async (achievement: {
      baby_profile_id?: string | null;
      achievement_type: string;
      title: string;
      description?: string | null;
      icon?: string;
      achieved_at?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('baby_achievements')
        .insert([
          {
            user_id: user.id,
            baby_profile_id: achievement.baby_profile_id || null,
            achievement_type: achievement.achievement_type,
            title: achievement.title,
            description: achievement.description || null,
            icon: achievement.icon || '🏆',
            achieved_at: achievement.achieved_at || new Date().toISOString(),
            metadata: (achievement.metadata || {}) as unknown as null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-achievements'] });
      toast.success('Conquista desbloqueada! 🏆');
    },
  });

  return { achievements, isLoading, addAchievement: addAchievement.mutate };
};

export const useBabyFirstTimes = (babyProfileId?: string) => {
  const queryClient = useQueryClient();

  const { data: firstTimes, isLoading } = useQuery({
    queryKey: ['baby-first-times', babyProfileId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('baby_first_times')
        .select(
          'id, user_id, baby_profile_id, event_type, title, description, event_date, photo_url, video_url, location, witnesses, mood, notes, is_favorite, created_at, updated_at'
        )
        .eq('user_id', user.id)
        .order('event_date', { ascending: false });

      if (babyProfileId) {
        query = query.eq('baby_profile_id', babyProfileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BabyFirstTime[];
    },
  });

  const addFirstTime = useMutation({
    mutationFn: async (
      firstTime: Omit<BabyFirstTime, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    ) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('baby_first_times')
        .insert({ ...firstTime, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-first-times'] });
      toast.success('Momento registrado! 📸');
    },
  });

  const updateFirstTime = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BabyFirstTime> & { id: string }) => {
      const { data, error } = await supabase
        .from('baby_first_times')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-first-times'] });
    },
  });

  const deleteFirstTime = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('baby_first_times').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-first-times'] });
      toast.success('Registro removido');
    },
  });

  return {
    firstTimes,
    isLoading,
    addFirstTime: addFirstTime.mutate,
    updateFirstTime: updateFirstTime.mutate,
    deleteFirstTime: deleteFirstTime.mutate,
  };
};

export const useBabyTimeline = (babyProfileId?: string) => {
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ['baby-timeline', babyProfileId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('baby_timeline_events')
        .select(
          'id, user_id, baby_profile_id, event_type, title, description, event_date, event_time, icon, color, photo_url, related_record_id, related_record_type, is_milestone, created_at'
        )
        .eq('user_id', user.id)
        .order('event_date', { ascending: false });

      if (babyProfileId) {
        query = query.eq('baby_profile_id', babyProfileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BabyTimelineEvent[];
    },
  });

  const addEvent = useMutation({
    mutationFn: async (event: Omit<BabyTimelineEvent, 'id' | 'user_id' | 'created_at'>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('baby_timeline_events')
        .insert({ ...event, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-timeline'] });
    },
  });

  return { events, isLoading, addEvent: addEvent.mutate };
};
