-- Add RLS policies to baby_sleep_settings table
ALTER TABLE public.baby_sleep_settings ENABLE ROW LEVEL SECURITY;

-- Users can insert their own sleep settings
CREATE POLICY "Users can insert their own sleep settings"
ON public.baby_sleep_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own sleep settings
CREATE POLICY "Users can view their own sleep settings"
ON public.baby_sleep_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own sleep settings
CREATE POLICY "Users can update their own sleep settings"
ON public.baby_sleep_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own sleep settings
CREATE POLICY "Users can delete their own sleep settings"
ON public.baby_sleep_settings
FOR DELETE
USING (auth.uid() = user_id);