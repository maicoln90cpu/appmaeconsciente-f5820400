
-- =============================================
-- FASE 1 — Pacote F: Ferramentas de Gestantes
-- =============================================

-- 1. Contador de Movimentos Fetais
CREATE TABLE public.kick_count_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  kick_count INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  target_kicks INTEGER NOT NULL DEFAULT 10,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kick_count_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own kick sessions" ON public.kick_count_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kick sessions" ON public.kick_count_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kick sessions" ON public.kick_count_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own kick sessions" ON public.kick_count_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_kick_count_sessions_updated_at
  BEFORE UPDATE ON public.kick_count_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Checklist de Exames por Trimestre
CREATE TABLE public.pregnancy_exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_name TEXT NOT NULL,
  trimester INTEGER NOT NULL CHECK (trimester BETWEEN 1 AND 3),
  category TEXT NOT NULL DEFAULT 'ambos' CHECK (category IN ('sus', 'particular', 'ambos')),
  scheduled_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_date DATE,
  result_notes TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pregnancy_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exams" ON public.pregnancy_exams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exams" ON public.pregnancy_exams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exams" ON public.pregnancy_exams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exams" ON public.pregnancy_exams FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_pregnancy_exams_updated_at
  BEFORE UPDATE ON public.pregnancy_exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Planejador de Parto
CREATE TABLE public.birth_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivery_type TEXT DEFAULT 'normal' CHECK (delivery_type IN ('normal', 'cesarea', 'humanizado', 'agua', 'indecisa')),
  anesthesia TEXT DEFAULT 'indecisa' CHECK (anesthesia IN ('epidural', 'raquidiana', 'combinada', 'nenhuma', 'indecisa')),
  companion_name TEXT,
  companion_backup TEXT,
  skin_to_skin BOOLEAN DEFAULT true,
  delayed_cord_clamping BOOLEAN DEFAULT true,
  breastfeed_first_hour BOOLEAN DEFAULT true,
  music_playlist TEXT,
  lighting_preference TEXT DEFAULT 'meia_luz' CHECK (lighting_preference IN ('natural', 'meia_luz', 'escuro', 'indiferente')),
  photos_video BOOLEAN DEFAULT true,
  episiotomy_preference TEXT DEFAULT 'evitar' CHECK (episiotomy_preference IN ('sim', 'evitar', 'somente_emergencia', 'indiferente')),
  placenta_preference TEXT DEFAULT 'hospital' CHECK (placenta_preference IN ('hospital', 'levar', 'encapsular', 'indiferente')),
  special_requests TEXT,
  emergency_notes TEXT,
  pediatrician_name TEXT,
  hospital_name TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.birth_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own birth plan" ON public.birth_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own birth plan" ON public.birth_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own birth plan" ON public.birth_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own birth plan" ON public.birth_plans FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_birth_plans_updated_at
  BEFORE UPDATE ON public.birth_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
