-- Criar tabela de planos alimentares por trimestre
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trimester INTEGER NOT NULL CHECK (trimester IN (1, 2, 3)),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('cafe_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia')),
  title TEXT NOT NULL,
  description TEXT,
  calories INTEGER,
  proteins NUMERIC,
  carbs NUMERIC,
  fats NUMERIC,
  fiber NUMERIC,
  iron NUMERIC,
  calcium NUMERIC,
  folic_acid NUMERIC,
  ingredients TEXT[],
  preparation TEXT,
  tips TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de receitas
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('cafe_manha', 'almoco', 'jantar', 'lanche', 'sobremesa')),
  prep_time INTEGER, -- em minutos
  servings INTEGER DEFAULT 1,
  calories INTEGER,
  nutrients JSONB, -- {proteins: 20, carbs: 30, fats: 10, fiber: 5, iron: 2, calcium: 100}
  ingredients TEXT[] NOT NULL,
  preparation TEXT[] NOT NULL,
  tips TEXT,
  tags TEXT[],
  image_url TEXT,
  trimester_focus INTEGER[], -- [1,2,3] quais trimestres essa receita é ideal
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de suplementos do usuário
CREATE TABLE public.user_supplements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplement_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('diario', 'dia_alternado', 'semanal')),
  times_per_day INTEGER DEFAULT 1,
  time_of_day TEXT[], -- ['08:00', '20:00']
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de registro de suplementos tomados
CREATE TABLE public.supplement_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplement_id UUID NOT NULL REFERENCES public.user_supplements(id) ON DELETE CASCADE,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_time TEXT, -- '08:00'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de monitoramento de peso
CREATE TABLE public.weight_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  week_of_pregnancy INTEGER,
  belly_measurement NUMERIC, -- medida da barriga em cm
  date DATE NOT NULL,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de alertas de alimentos
CREATE TABLE public.food_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  food_name TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('evitar_totalmente', 'consumir_moderacao', 'cuidado_preparo')),
  reason TEXT NOT NULL,
  trimester_specific INTEGER[], -- [1,2,3] se o alerta é específico para algum trimestre
  alternatives TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de alergias/restrições do usuário
CREATE TABLE public.user_food_restrictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('alergia', 'intolerancia', 'restricao_religiosa', 'preferencia')),
  food_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_food_restrictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies para meal_plans (público para leitura)
CREATE POLICY "Anyone authenticated can view meal plans"
ON public.meal_plans
FOR SELECT
TO authenticated
USING (true);

-- RLS Policies para recipes
CREATE POLICY "Anyone authenticated can view public recipes"
ON public.recipes
FOR SELECT
TO authenticated
USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own recipes"
ON public.recipes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own recipes"
ON public.recipes
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own recipes"
ON public.recipes
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- RLS Policies para user_supplements
CREATE POLICY "Users can view their own supplements"
ON public.user_supplements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own supplements"
ON public.user_supplements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own supplements"
ON public.user_supplements
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own supplements"
ON public.user_supplements
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies para supplement_logs
CREATE POLICY "Users can view their own supplement logs"
ON public.supplement_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own supplement logs"
ON public.supplement_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies para weight_tracking
CREATE POLICY "Users can view their own weight tracking"
ON public.weight_tracking
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own weight tracking"
ON public.weight_tracking
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight tracking"
ON public.weight_tracking
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight tracking"
ON public.weight_tracking
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies para food_alerts (público para leitura)
CREATE POLICY "Anyone authenticated can view food alerts"
ON public.food_alerts
FOR SELECT
TO authenticated
USING (is_active = true);

-- RLS Policies para user_food_restrictions
CREATE POLICY "Users can view their own food restrictions"
ON public.user_food_restrictions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own food restrictions"
ON public.user_food_restrictions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food restrictions"
ON public.user_food_restrictions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food restrictions"
ON public.user_food_restrictions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins podem gerenciar tudo
CREATE POLICY "Admins can manage all meal plans"
ON public.meal_plans
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all recipes"
ON public.recipes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all food alerts"
ON public.food_alerts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_meal_plans_updated_at
BEFORE UPDATE ON public.meal_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
BEFORE UPDATE ON public.recipes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_supplements_updated_at
BEFORE UPDATE ON public.user_supplements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weight_tracking_updated_at
BEFORE UPDATE ON public.weight_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();