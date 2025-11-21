-- First, clean up any duplicate records (keep only the first one)
DELETE FROM public.site_settings
WHERE id NOT IN (
  SELECT id FROM public.site_settings
  ORDER BY created_at ASC
  LIMIT 1
);

-- Add a singleton column with unique constraint to ensure only one record exists
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS singleton_guard INTEGER DEFAULT 1;

-- Add unique constraint on the singleton guard
ALTER TABLE public.site_settings
ADD CONSTRAINT site_settings_only_one_row UNIQUE (singleton_guard);

-- Ensure there's exactly one record
INSERT INTO public.site_settings (gtm_id, singleton_guard) 
VALUES ('GTM-K9TPFGCJ', 1)
ON CONFLICT (singleton_guard) DO NOTHING;