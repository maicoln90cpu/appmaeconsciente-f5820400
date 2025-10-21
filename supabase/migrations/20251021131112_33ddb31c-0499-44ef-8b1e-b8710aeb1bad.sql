-- Add fields to track AI-generated content and user-created content
ALTER TABLE public.meal_plans 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;

ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;

ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can create their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can update their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can delete their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can update their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can delete their own exercises" ON public.exercises;

-- Create policies for meal_plans
CREATE POLICY "Users can create their own meal plans"
ON public.meal_plans FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own meal plans"
ON public.meal_plans FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own meal plans"
ON public.meal_plans FOR DELETE
USING (auth.uid() = created_by);

-- Create policies for exercises
CREATE POLICY "Users can update their own exercises"
ON public.exercises FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own exercises"
ON public.exercises FOR DELETE
USING (auth.uid() = created_by);