-- =====================================================
-- TABELA: contraction_logs (Diário de Contrações)
-- =====================================================
CREATE TABLE public.contraction_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10),
  notes TEXT,
  session_id UUID, -- Para agrupar contrações de uma mesma sessão
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contraction_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own contraction logs"
  ON public.contraction_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own contraction logs"
  ON public.contraction_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contraction logs"
  ON public.contraction_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contraction logs"
  ON public.contraction_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Índice para performance
CREATE INDEX idx_contraction_logs_user_date ON public.contraction_logs(user_id, start_time DESC);
CREATE INDEX idx_contraction_logs_session ON public.contraction_logs(session_id);

-- =====================================================
-- TABELA: pregnancy_info (Calculadora DPP + Info Gestação)
-- =====================================================
CREATE TABLE public.pregnancy_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  last_menstrual_period DATE, -- DUM (Data da Última Menstruação)
  conception_date DATE,
  due_date DATE, -- DPP calculada ou definida pelo médico
  due_date_source TEXT DEFAULT 'lmp', -- 'lmp', 'ultrasound', 'manual'
  ultrasound_due_date DATE, -- DPP por ultrassom
  gestational_weeks INTEGER,
  gestational_days INTEGER,
  is_high_risk BOOLEAN DEFAULT false,
  ob_doctor_name TEXT,
  hospital_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pregnancy_info ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own pregnancy info"
  ON public.pregnancy_info FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pregnancy info"
  ON public.pregnancy_info FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pregnancy info"
  ON public.pregnancy_info FOR UPDATE
  USING (auth.uid() = user_id);

-- Índice
CREATE INDEX idx_pregnancy_info_user ON public.pregnancy_info(user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pregnancy_info_updated_at
  BEFORE UPDATE ON public.pregnancy_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Adicionar coluna gender ao baby_vaccination_profiles
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'baby_vaccination_profiles' 
    AND column_name = 'gender'
  ) THEN
    ALTER TABLE public.baby_vaccination_profiles 
    ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female'));
  END IF;
END $$;