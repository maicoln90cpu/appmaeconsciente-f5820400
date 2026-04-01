
CREATE OR REPLACE FUNCTION public.sync_cron_schedule()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $fn$
DECLARE
  v_config jsonb;
  v_cron_config jsonb;
  v_enabled boolean;
  v_frequency text;
  v_cron_expr text;
  v_sql text;
BEGIN
  SELECT automation_config INTO v_config
  FROM site_settings
  LIMIT 1;

  IF v_config IS NULL THEN RETURN; END IF;

  v_cron_config := v_config->'cron';
  IF v_cron_config IS NULL THEN RETURN; END IF;

  v_enabled := COALESCE((v_cron_config->>'enabled')::boolean, true);
  v_frequency := COALESCE(v_cron_config->>'frequency', '2x');

  v_cron_expr := CASE v_frequency
    WHEN '1x' THEN '0 10 * * *'
    WHEN '2x' THEN '0 8,20 * * *'
    WHEN '3x' THEN '0 8,14,21 * * *'
    WHEN '4x' THEN '0 7,11,16,21 * * *'
    WHEN '6x' THEN '0 7,10,13,16,19,22 * * *'
    WHEN '8x' THEN '0 6,9,11,13,15,17,20,22 * * *'
    ELSE '0 8,20 * * *'
  END;

  -- Remove existing job
  BEGIN
    PERFORM cron.unschedule('auto-engage-community');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Create new job if enabled
  IF v_enabled THEN
    v_sql := 'SELECT net.http_post(url := ''https://tiyumtsvuqxolxngdfhz.supabase.co/functions/v1/auto-engage-community'', headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpeXVtdHN2dXF4b2x4bmdkZmh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDMwNjYsImV4cCI6MjA3NTUxOTA2Nn0.FkHN-pCOEgih9GvazNnr3rUOyqPb2YM4CJlMnARPXtA"}''::jsonb, body := concat(''{"time": "'', now(), ''"}'')::jsonb) AS request_id';
    
    PERFORM cron.schedule('auto-engage-community', v_cron_expr, v_sql);
  END IF;
END;
$fn$;
