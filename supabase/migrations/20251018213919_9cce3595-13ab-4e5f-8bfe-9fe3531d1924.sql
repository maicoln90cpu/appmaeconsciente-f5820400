-- Criar tabela de registro de hidratação
CREATE TABLE public.water_intake (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de metas de hidratação
CREATE TABLE public.water_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_goal_ml INTEGER NOT NULL DEFAULT 2000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Criar tabela de exercícios por trimestre
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  trimester INTEGER[] NOT NULL, -- [1,2,3]
  category TEXT NOT NULL CHECK (category IN ('cardio', 'forca', 'flexibilidade', 'respiracao', 'relaxamento')),
  duration_minutes INTEGER,
  intensity TEXT CHECK (intensity IN ('leve', 'moderado', 'intenso')),
  instructions TEXT[],
  benefits TEXT[],
  precautions TEXT[],
  video_url TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de registro de exercícios do usuário
CREATE TABLE public.user_exercise_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de conversas com IA nutricional
CREATE TABLE public.nutrition_chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de mensagens do chat nutricional
CREATE TABLE public.nutrition_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.nutrition_chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies para water_intake
CREATE POLICY "Users can view their own water intake"
ON public.water_intake
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own water intake"
ON public.water_intake
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water intake"
ON public.water_intake
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies para water_goals
CREATE POLICY "Users can view their own water goals"
ON public.water_goals
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own water goals"
ON public.water_goals
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water goals"
ON public.water_goals
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies para exercises (público para leitura)
CREATE POLICY "Anyone authenticated can view active exercises"
ON public.exercises
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage exercises"
ON public.exercises
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para user_exercise_logs
CREATE POLICY "Users can view their own exercise logs"
ON public.user_exercise_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercise logs"
ON public.user_exercise_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise logs"
ON public.user_exercise_logs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies para nutrition_chat_conversations
CREATE POLICY "Users can view their own conversations"
ON public.nutrition_chat_conversations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
ON public.nutrition_chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.nutrition_chat_conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
ON public.nutrition_chat_conversations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies para nutrition_chat_messages
CREATE POLICY "Users can view messages from their conversations"
ON public.nutrition_chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.nutrition_chat_conversations
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations"
ON public.nutrition_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.nutrition_chat_conversations
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);

-- Triggers para updated_at
CREATE TRIGGER update_water_goals_updated_at
BEFORE UPDATE ON public.water_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
BEFORE UPDATE ON public.exercises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nutrition_chat_conversations_updated_at
BEFORE UPDATE ON public.nutrition_chat_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();