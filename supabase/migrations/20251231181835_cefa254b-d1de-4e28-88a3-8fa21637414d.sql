-- Criar tabela de consentimentos do usuário (LGPD/GDPR)
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  accepted BOOLEAN NOT NULL DEFAULT false,
  accepted_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own consents"
ON public.user_consents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents"
ON public.user_consents FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX idx_user_consents_type ON public.user_consents(consent_type);

-- Corrigir políticas de site_settings - remover emails hardcoded
DROP POLICY IF EXISTS "Only admins can insert site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Only admins can update site settings" ON public.site_settings;

CREATE POLICY "Only admins can insert site settings"
ON public.site_settings FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update site settings"
ON public.site_settings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar tabela de logs de exclusão para auditoria
CREATE TABLE IF NOT EXISTS public.data_deletion_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  tables_deleted TEXT[],
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT
);

-- RLS para logs de exclusão (apenas admins podem ver)
ALTER TABLE public.data_deletion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view deletion logs"
ON public.data_deletion_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert deletion logs"
ON public.data_deletion_logs FOR INSERT
WITH CHECK (true);