CREATE OR REPLACE FUNCTION public.cleanup_monitoring_logs(days_to_keep integer DEFAULT 90)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
  error_spike_count INTEGER;
  admin_user_id UUID;
  new_notification_id UUID;
BEGIN
  DELETE FROM public.client_error_logs WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  DELETE FROM public.performance_logs WHERE created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  DELETE FROM public.feature_usage_logs WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  DELETE FROM public.system_health_logs WHERE recorded_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  DELETE FROM public.admin_audit_log WHERE created_at < NOW() - INTERVAL '365 days';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  DELETE FROM public.cron_job_logs WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  SELECT COUNT(*) INTO error_spike_count
  FROM public.client_error_logs
  WHERE created_at > NOW() - INTERVAL '1 hour';

  IF error_spike_count > 20 THEN
    SELECT user_id INTO admin_user_id
    FROM public.user_roles
    WHERE role = 'admin'
    LIMIT 1;

    IF admin_user_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE title = '⚠️ Spike de Erros Detectado'
        AND created_at > NOW() - INTERVAL '2 hours'
      ) THEN
        INSERT INTO public.notifications (title, message, type, is_global, created_by)
        VALUES (
          '⚠️ Spike de Erros Detectado',
          'Foram detectados ' || error_spike_count || ' erros na última hora. Verifique o painel de Observabilidade para mais detalhes.',
          'system',
          false,
          admin_user_id
        )
        RETURNING id INTO new_notification_id;

        INSERT INTO public.user_notifications (user_id, notification_id)
        SELECT ur.user_id, new_notification_id
        FROM public.user_roles ur
        WHERE ur.role = 'admin';
      END IF;
    END IF;
  END IF;

  RETURN deleted_count;
END;
$function$;