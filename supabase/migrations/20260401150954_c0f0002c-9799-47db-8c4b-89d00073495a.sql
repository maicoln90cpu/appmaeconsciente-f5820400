
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS personality text,
ADD COLUMN IF NOT EXISTS personality_style text;
