
-- 1. system_health_status - Score de saúde por módulo
CREATE TABLE public.system_health_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'healthy',
  score INTEGER NOT NULL DEFAULT 100,
  metrics JSONB DEFAULT '{}',
  issues JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(module_name)
);

ALTER TABLE public.system_health_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system health status"
  ON public.system_health_status FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. system_health_logs - Histórico de scores
CREATE TABLE public.system_health_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  status TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system health logs"
  ON public.system_health_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_health_logs_recorded ON public.system_health_logs(recorded_at DESC);
CREATE INDEX idx_health_logs_module ON public.system_health_logs(module_name);

-- 3. client_error_logs - Erros do frontend
CREATE TABLE public.client_error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  component_name TEXT,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  url TEXT,
  user_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.client_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert error logs"
  ON public.client_error_logs FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read error logs"
  ON public.client_error_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_error_logs_created ON public.client_error_logs(created_at DESC);
CREATE INDEX idx_error_logs_component ON public.client_error_logs(component_name);

-- 4. performance_logs - Latência de operações
CREATE TABLE public.performance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_name TEXT NOT NULL,
  operation_type TEXT NOT NULL DEFAULT 'query',
  duration_ms NUMERIC NOT NULL,
  is_slow BOOLEAN DEFAULT false,
  user_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert performance logs"
  ON public.performance_logs FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read performance logs"
  ON public.performance_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_perf_logs_created ON public.performance_logs(created_at DESC);
CREATE INDEX idx_perf_logs_operation ON public.performance_logs(operation_name);
CREATE INDEX idx_perf_logs_slow ON public.performance_logs(is_slow) WHERE is_slow = true;

-- 5. feature_usage_logs - Uso de funcionalidades
CREATE TABLE public.feature_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_name TEXT NOT NULL,
  user_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert feature usage"
  ON public.feature_usage_logs FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read feature usage"
  ON public.feature_usage_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_feature_usage_created ON public.feature_usage_logs(created_at DESC);
CREATE INDEX idx_feature_usage_feature ON public.feature_usage_logs(feature_name);

-- 6. admin_audit_log - Log de ações administrativas
CREATE TABLE public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage audit logs"
  ON public.admin_audit_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_audit_log_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX idx_audit_log_admin ON public.admin_audit_log(admin_id);

-- 7. cron_job_logs - Logs de tarefas agendadas
CREATE TABLE public.cron_job_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  schedule TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  duration_ms NUMERIC,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cron job logs"
  ON public.cron_job_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_cron_logs_executed ON public.cron_job_logs(executed_at DESC);
CREATE INDEX idx_cron_logs_job ON public.cron_job_logs(job_name);

-- Trigger updated_at para system_health_status
CREATE TRIGGER update_system_health_status_updated_at
  BEFORE UPDATE ON public.system_health_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função de limpeza ampliada para incluir novas tabelas
CREATE OR REPLACE FUNCTION public.cleanup_monitoring_logs(days_to_keep integer DEFAULT 90)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- client_error_logs: manter 90 dias
  DELETE FROM public.client_error_logs WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  -- performance_logs: manter 30 dias
  DELETE FROM public.performance_logs WHERE created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  -- feature_usage_logs: manter 90 dias
  DELETE FROM public.feature_usage_logs WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  -- system_health_logs: manter 90 dias
  DELETE FROM public.system_health_logs WHERE recorded_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  -- admin_audit_log: manter 365 dias
  DELETE FROM public.admin_audit_log WHERE created_at < NOW() - INTERVAL '365 days';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  -- cron_job_logs: manter 90 dias
  DELETE FROM public.cron_job_logs WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  RETURN deleted_count;
END;
$$;
