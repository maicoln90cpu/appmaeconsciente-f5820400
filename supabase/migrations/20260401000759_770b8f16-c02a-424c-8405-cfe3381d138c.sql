
-- Add cron_schedule and moderation settings to automation_config
-- The automation_config JSONB column already exists in site_settings
-- We need a table for moderation logs

CREATE TABLE IF NOT EXISTS public.post_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  sentiment_score NUMERIC,
  flagged_categories TEXT[],
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.post_moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage moderation logs"
  ON public.post_moderation_logs
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add is_hidden column to posts for auto-moderation
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved';
