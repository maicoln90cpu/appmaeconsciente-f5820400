-- =============================================
-- ETAPA 1: Features de Acompanhamento do Bebê
-- =============================================

-- 1.1 Tabela de medições de crescimento
CREATE TABLE public.growth_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  baby_profile_id UUID REFERENCES public.baby_vaccination_profiles(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg DECIMAL(5,3), -- peso em kg (ex: 3.500)
  height_cm DECIMAL(5,2), -- altura em cm (ex: 50.00)
  head_circumference_cm DECIMAL(5,2), -- perímetro cefálico em cm
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.growth_measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own growth measurements"
  ON public.growth_measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own growth measurements"
  ON public.growth_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own growth measurements"
  ON public.growth_measurements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own growth measurements"
  ON public.growth_measurements FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_growth_measurements_user_baby 
  ON public.growth_measurements(user_id, baby_profile_id, measurement_date DESC);

-- 1.2 Tabela de introdução alimentar
CREATE TABLE public.food_introduction_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  baby_profile_id UUID REFERENCES public.baby_vaccination_profiles(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  food_category TEXT NOT NULL DEFAULT 'outros', -- frutas, vegetais, proteinas, graos, laticinios, outros
  introduction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reaction_type TEXT DEFAULT 'nenhuma', -- nenhuma, leve, moderada, severa
  reaction_symptoms TEXT[], -- array de sintomas
  is_allergenic BOOLEAN DEFAULT false, -- se é alimento alergênico comum
  accepted BOOLEAN DEFAULT true, -- se o bebê aceitou o alimento
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.food_introduction_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own food logs"
  ON public.food_introduction_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own food logs"
  ON public.food_introduction_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food logs"
  ON public.food_introduction_log FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food logs"
  ON public.food_introduction_log FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_food_introduction_user_baby 
  ON public.food_introduction_log(user_id, baby_profile_id, introduction_date DESC);

CREATE INDEX idx_food_introduction_allergenic 
  ON public.food_introduction_log(user_id, is_allergenic) WHERE is_allergenic = true;

-- Trigger para updated_at
CREATE TRIGGER update_growth_measurements_updated_at
  BEFORE UPDATE ON public.growth_measurements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_food_introduction_updated_at
  BEFORE UPDATE ON public.food_introduction_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();