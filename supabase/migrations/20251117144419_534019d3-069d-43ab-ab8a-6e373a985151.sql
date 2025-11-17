-- Add postpartum fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS delivery_date DATE,
ADD COLUMN IF NOT EXISTS delivery_type TEXT CHECK (delivery_type IN ('normal', 'cesarean', 'forceps', 'vacuum')),
ADD COLUMN IF NOT EXISTS postpartum_notes TEXT;

-- Create postpartum_symptoms table
CREATE TABLE public.postpartum_symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  pain_level INTEGER CHECK (pain_level BETWEEN 0 AND 10),
  bleeding_intensity TEXT CHECK (bleeding_intensity IN ('light', 'moderate', 'heavy', 'very_heavy')),
  cramps_level INTEGER CHECK (cramps_level BETWEEN 0 AND 10),
  swelling TEXT[] DEFAULT '{}',
  healing_status TEXT CHECK (healing_status IN ('normal', 'slow', 'infected', 'concerning')),
  energy_level INTEGER CHECK (energy_level BETWEEN 0 AND 10),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 0 AND 10),
  appetite TEXT CHECK (appetite IN ('normal', 'low', 'high', 'none')),
  bowel_movement TEXT CHECK (bowel_movement IN ('normal', 'constipated', 'diarrhea', 'painful')),
  urination TEXT CHECK (urination IN ('normal', 'painful', 'frequent', 'difficult')),
  fever BOOLEAN DEFAULT FALSE,
  temperature NUMERIC(4,1),
  breast_pain BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.postpartum_symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own symptoms"
  ON public.postpartum_symptoms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own symptoms"
  ON public.postpartum_symptoms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own symptoms"
  ON public.postpartum_symptoms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own symptoms"
  ON public.postpartum_symptoms FOR DELETE
  USING (auth.uid() = user_id);

-- Create postpartum_medications table
CREATE TABLE public.postpartum_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  times_per_day INTEGER DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,
  time_of_day TEXT[] DEFAULT '{}',
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.postpartum_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own medications"
  ON public.postpartum_medications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medications"
  ON public.postpartum_medications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications"
  ON public.postpartum_medications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications"
  ON public.postpartum_medications FOR DELETE
  USING (auth.uid() = user_id);

-- Create medication_logs table
CREATE TABLE public.medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.postpartum_medications(id) ON DELETE CASCADE,
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_time TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own medication logs"
  ON public.medication_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medication logs"
  ON public.medication_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication logs"
  ON public.medication_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create postpartum_appointments table
CREATE TABLE public.postpartum_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('gynecologist', 'pediatrician', 'pelvic_physiotherapist', 'nutritionist', 'psychologist', 'other')),
  title TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT,
  location TEXT,
  doctor_name TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.postpartum_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appointments"
  ON public.postpartum_appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments"
  ON public.postpartum_appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
  ON public.postpartum_appointments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments"
  ON public.postpartum_appointments FOR DELETE
  USING (auth.uid() = user_id);

-- Create recovery_checklist table
CREATE TABLE public.recovery_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 12),
  item TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_number, item)
);

ALTER TABLE public.recovery_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checklist"
  ON public.recovery_checklist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checklist"
  ON public.recovery_checklist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklist"
  ON public.recovery_checklist FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklist"
  ON public.recovery_checklist FOR DELETE
  USING (auth.uid() = user_id);

-- Create emotional_logs table
CREATE TABLE public.emotional_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT NOT NULL CHECK (mood IN ('very_happy', 'happy', 'neutral', 'sad', 'very_sad', 'angry', 'anxious', 'tired')),
  notes TEXT,
  edinburgh_score INTEGER CHECK (edinburgh_score BETWEEN 0 AND 30),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.emotional_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own emotional logs"
  ON public.emotional_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emotional logs"
  ON public.emotional_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emotional logs"
  ON public.emotional_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emotional logs"
  ON public.emotional_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create body_image_log table
CREATE TABLE public.body_image_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT,
  notes TEXT,
  photo_url TEXT,
  mood TEXT CHECK (mood IN ('confident', 'neutral', 'insecure', 'struggling')),
  privacy TEXT NOT NULL DEFAULT 'private' CHECK (privacy IN ('private', 'partner', 'public')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.body_image_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own body image logs"
  ON public.body_image_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own body image logs"
  ON public.body_image_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own body image logs"
  ON public.body_image_log FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own body image logs"
  ON public.body_image_log FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for body image photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('body-image-photos', 'body-image-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for body image photos
CREATE POLICY "Users can view their own body image photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'body-image-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own body image photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'body-image-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own body image photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'body-image-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own body image photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'body-image-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create postpartum achievements table
CREATE TABLE public.postpartum_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_code TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_code)
);

ALTER TABLE public.postpartum_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own postpartum achievements"
  ON public.postpartum_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own postpartum achievements"
  ON public.postpartum_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create daily wellness score table
CREATE TABLE public.daily_wellness_score (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  physical_score INTEGER CHECK (physical_score BETWEEN 0 AND 10),
  emotional_score INTEGER CHECK (emotional_score BETWEEN 0 AND 10),
  energy_score INTEGER CHECK (energy_score BETWEEN 0 AND 10),
  pain_score INTEGER CHECK (pain_score BETWEEN 0 AND 10),
  total_score INTEGER,
  is_good_day BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_wellness_score ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wellness scores"
  ON public.daily_wellness_score FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wellness scores"
  ON public.daily_wellness_score FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wellness scores"
  ON public.daily_wellness_score FOR UPDATE
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_postpartum_symptoms_updated_at
  BEFORE UPDATE ON public.postpartum_symptoms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_postpartum_medications_updated_at
  BEFORE UPDATE ON public.postpartum_medications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_postpartum_appointments_updated_at
  BEFORE UPDATE ON public.postpartum_appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recovery_checklist_updated_at
  BEFORE UPDATE ON public.recovery_checklist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emotional_logs_updated_at
  BEFORE UPDATE ON public.emotional_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_body_image_log_updated_at
  BEFORE UPDATE ON public.body_image_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();