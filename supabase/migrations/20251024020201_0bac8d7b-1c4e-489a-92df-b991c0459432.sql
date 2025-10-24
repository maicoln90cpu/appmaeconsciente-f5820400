-- Fix meal_plans constraint to accept correct values
ALTER TABLE meal_plans DROP CONSTRAINT IF EXISTS meal_plans_meal_type_check;
ALTER TABLE meal_plans ADD CONSTRAINT meal_plans_meal_type_check 
  CHECK (meal_type IN ('breakfast', 'lunch', 'dinner'));

-- Add exercise_type column to exercises table for filtering
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS exercise_type TEXT;
ALTER TABLE exercises ADD CONSTRAINT exercises_exercise_type_check 
  CHECK (exercise_type IN ('em_casa', 'aerobio', 'academia', 'yoga', 'alongamento'));

-- Add nutrients columns to recipes if they don't exist
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS proteins DECIMAL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS carbs DECIMAL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS fats DECIMAL;