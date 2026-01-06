-- Create baby_achievements table
CREATE TABLE IF NOT EXISTS public.baby_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  baby_profile_id UUID REFERENCES public.baby_vaccination_profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.baby_achievements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own baby achievements"
  ON public.baby_achievements FOR ALL
  USING (auth.uid() = user_id);

-- Create baby_first_times table for "Album of First Times"
CREATE TABLE IF NOT EXISTS public.baby_first_times (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  baby_profile_id UUID REFERENCES public.baby_vaccination_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  photo_url TEXT,
  video_url TEXT,
  location TEXT,
  witnesses TEXT[],
  mood TEXT,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.baby_first_times ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own baby first times"
  ON public.baby_first_times FOR ALL
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_baby_first_times_updated_at
  BEFORE UPDATE ON public.baby_first_times
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create baby_timeline_events for visual timeline
CREATE TABLE IF NOT EXISTS public.baby_timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  baby_profile_id UUID REFERENCES public.baby_vaccination_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  icon TEXT,
  color TEXT,
  photo_url TEXT,
  related_record_id UUID,
  related_record_type TEXT,
  is_milestone BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.baby_timeline_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own baby timeline events"
  ON public.baby_timeline_events FOR ALL
  USING (auth.uid() = user_id);