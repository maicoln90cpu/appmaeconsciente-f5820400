
ALTER TABLE public.blog_settings ADD COLUMN IF NOT EXISTS cron_days integer[] DEFAULT '{0,1,2,3,4,5,6}';

CREATE OR REPLACE FUNCTION public.sync_blog_cron_schedule()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_schedule text;
  v_is_active boolean;
  v_days integer[];
  v_cron_hours text;
  v_cron_dow text;
  v_cron_expr text;
  v_sql text;
BEGIN
  SELECT cron_schedule, is_active, COALESCE(cron_days, '{0,1,2,3,4,5,6}')
  INTO v_schedule, v_is_active, v_days
  FROM blog_settings
  LIMIT 1;

  v_schedule := COALESCE(v_schedule, '1x');
  v_is_active := COALESCE(v_is_active, true);

  v_cron_hours := CASE v_schedule
    WHEN '1x' THEN '0 6'
    WHEN '2x' THEN '0 6,18'
    WHEN '3x' THEN '0 6,12,18'
    ELSE '0 6'
  END;

  -- Convert days array to cron DOW string
  IF v_days = '{0,1,2,3,4,5,6}' OR array_length(v_days, 1) = 7 THEN
    v_cron_dow := '*';
  ELSE
    v_cron_dow := array_to_string(v_days, ',');
  END IF;

  -- Full cron: minute hour * * dow
  v_cron_expr := v_cron_hours || ' * * ' || v_cron_dow;

  -- Remove existing job
  BEGIN
    PERFORM cron.unschedule('auto-generate-blog-post');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Create new job if active
  IF v_is_active THEN
    v_sql := 'SELECT net.http_post(url := ''https://tiyumtsvuqxolxngdfhz.supabase.co/functions/v1/generate-blog-post'', headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpeXVtdHN2dXF4b2x4bmdkZmh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDMwNjYsImV4cCI6MjA3NTUxOTA2Nn0.FkHN-pCOEgih9GvazNnr3rUOyqPb2YM4CJlMnARPXtA"}''::jsonb, body := ''{"source": "pg_cron"}''::jsonb)';
    
    PERFORM cron.schedule('auto-generate-blog-post', v_cron_expr, v_sql);
  END IF;
END;
$$;
