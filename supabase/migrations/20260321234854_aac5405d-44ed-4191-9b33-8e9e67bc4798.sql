
-- =============================================
-- FASE 2 (Pacote G): Icterícia + Bem-estar Mãe
-- =============================================

-- 1. Tabela de registros de icterícia
CREATE TABLE public.jaundice_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baby_profile_id UUID REFERENCES public.baby_vaccination_profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  kramer_zone INTEGER NOT NULL CHECK (kramer_zone BETWEEN 1 AND 5),
  skin_color TEXT,
  sclera_color TEXT,
  feeding_well BOOLEAN DEFAULT true,
  alert_signs TEXT[] DEFAULT '{}',
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jaundice_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own jaundice logs"
  ON public.jaundice_logs FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_jaundice_logs_updated_at
  BEFORE UPDATE ON public.jaundice_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Tabela de bem-estar da mãe
CREATE TABLE public.mom_wellness_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  energy INTEGER NOT NULL CHECK (energy BETWEEN 1 AND 5),
  pain INTEGER NOT NULL DEFAULT 0 CHECK (pain BETWEEN 0 AND 10),
  sleep_hours NUMERIC(3,1) DEFAULT 0,
  appetite TEXT DEFAULT 'normal' CHECK (appetite IN ('none', 'low', 'normal', 'high')),
  anxiety INTEGER DEFAULT 1 CHECK (anxiety BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);

ALTER TABLE public.mom_wellness_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wellness logs"
  ON public.mom_wellness_logs FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_mom_wellness_logs_updated_at
  BEFORE UPDATE ON public.mom_wellness_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
