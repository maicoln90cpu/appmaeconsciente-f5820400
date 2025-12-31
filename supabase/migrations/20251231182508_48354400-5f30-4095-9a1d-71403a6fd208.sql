-- Melhorar tabela de logs de acesso
ALTER TABLE public.user_access_logs 
ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'page_view',
ADD COLUMN IF NOT EXISTS resource_path TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_access_logs_user_date ON public.user_access_logs(user_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON public.user_access_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_access_logs_date ON public.user_access_logs(accessed_at DESC);

-- Criar tabela de logs de segurança para eventos críticos
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para logs de segurança (apenas admins podem ver)
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security logs"
ON public.security_audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert security logs"
ON public.security_audit_logs FOR INSERT
WITH CHECK (true);

-- Índices para logs de segurança
CREATE INDEX idx_security_logs_user ON public.security_audit_logs(user_id);
CREATE INDEX idx_security_logs_type ON public.security_audit_logs(event_type);
CREATE INDEX idx_security_logs_severity ON public.security_audit_logs(severity);
CREATE INDEX idx_security_logs_date ON public.security_audit_logs(created_at DESC);

-- Função para logging automático de ações sensíveis
CREATE OR REPLACE FUNCTION public.log_sensitive_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    event_type,
    event_description,
    metadata,
    severity
  ) VALUES (
    auth.uid(),
    TG_ARGV[0],
    TG_ARGV[1],
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', now()
    ),
    COALESCE(TG_ARGV[2], 'info')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para logar alterações em roles de usuário
DROP TRIGGER IF EXISTS log_role_changes ON public.user_roles;
CREATE TRIGGER log_role_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.log_sensitive_action('role_change', 'Alteração de permissões de usuário', 'warning');

-- Trigger para logar exclusões de dados
DROP TRIGGER IF EXISTS log_data_deletion ON public.data_deletion_logs;
CREATE TRIGGER log_data_deletion
AFTER INSERT ON public.data_deletion_logs
FOR EACH ROW
EXECUTE FUNCTION public.log_sensitive_action('data_deletion', 'Solicitação de exclusão de dados (LGPD)', 'critical');

-- Trigger para logar alterações em produtos
DROP TRIGGER IF EXISTS log_product_access_changes ON public.user_product_access;
CREATE TRIGGER log_product_access_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_product_access
FOR EACH ROW
EXECUTE FUNCTION public.log_sensitive_action('access_change', 'Alteração de acesso a produtos', 'info');

-- Função para rotação de logs (executar periodicamente)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Limpar logs de acesso antigos
  DELETE FROM public.user_access_logs 
  WHERE accessed_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Limpar logs de segurança antigos (exceto críticos que mantemos por 1 ano)
  DELETE FROM public.security_audit_logs 
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
  AND severity != 'critical';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Limpar logs críticos após 365 dias
  DELETE FROM public.security_audit_logs 
  WHERE created_at < NOW() - INTERVAL '365 days'
  AND severity = 'critical';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;