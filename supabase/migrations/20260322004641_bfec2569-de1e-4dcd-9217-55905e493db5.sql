
-- =============================================
-- PACOTE H: Rastreador de Dentes, Banco de Estimulação, Diário de Alergias
-- =============================================

-- 1. Rastreador de Dentes
CREATE TABLE public.baby_teeth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  baby_profile_id UUID REFERENCES public.baby_vaccination_profiles(id) ON DELETE CASCADE,
  tooth_number INTEGER NOT NULL,
  tooth_name TEXT NOT NULL,
  tooth_position TEXT NOT NULL DEFAULT 'lower',
  noticed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  symptoms TEXT[] DEFAULT '{}',
  pain_level INTEGER DEFAULT 0,
  relief_methods TEXT[] DEFAULT '{}',
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.baby_teeth_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own teeth logs" ON public.baby_teeth_logs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Banco de Atividades de Estimulação
CREATE TABLE public.baby_stimulation_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  baby_profile_id UUID REFERENCES public.baby_vaccination_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'motor',
  age_range_start INTEGER NOT NULL DEFAULT 0,
  age_range_end INTEGER NOT NULL DEFAULT 12,
  duration_minutes INTEGER DEFAULT 10,
  materials TEXT[] DEFAULT '{}',
  development_areas TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  completed_count INTEGER DEFAULT 0,
  last_done_at TIMESTAMPTZ,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.baby_stimulation_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own stimulation activities" ON public.baby_stimulation_activities
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Diário de Alergias
CREATE TABLE public.baby_allergy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  baby_profile_id UUID REFERENCES public.baby_vaccination_profiles(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  introduction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reaction_type TEXT DEFAULT 'none',
  reaction_severity TEXT DEFAULT 'none',
  symptoms TEXT[] DEFAULT '{}',
  onset_time_hours NUMERIC,
  photo_url TEXT,
  action_taken TEXT,
  doctor_consulted BOOLEAN DEFAULT false,
  is_confirmed_allergy BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.baby_allergy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own allergy logs" ON public.baby_allergy_logs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
