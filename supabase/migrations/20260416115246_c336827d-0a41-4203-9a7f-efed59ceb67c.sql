-- Add new settings columns to site_settings
ALTER TABLE public.site_settings 
  ADD COLUMN IF NOT EXISTS support_whatsapp text,
  ADD COLUMN IF NOT EXISTS custom_domain text,
  ADD COLUMN IF NOT EXISTS support_email text,
  ADD COLUMN IF NOT EXISTS system_timezone text DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS ai_insights_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS badges_enabled boolean DEFAULT true;