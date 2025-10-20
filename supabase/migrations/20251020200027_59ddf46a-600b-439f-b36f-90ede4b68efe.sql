-- Fix security definer views that expose user data
-- This addresses CRITICAL security issues where any authenticated user 
-- can view ALL users' premium status and achievement data

-- Drop existing insecure views
DROP VIEW IF EXISTS public.user_club_access;
DROP VIEW IF EXISTS public.user_achievement_progress;

-- Recreate user_club_access with security_invoker (executes with caller's permissions)
-- This ensures RLS policies on underlying tables are enforced
CREATE VIEW public.user_club_access 
WITH (security_invoker = true) AS
SELECT 
  upa.user_id,
  upa.expires_at,
  (upa.expires_at IS NULL OR upa.expires_at > NOW()) AS has_active_access
FROM user_product_access upa
JOIN products p ON p.id = upa.product_id
WHERE p.slug = 'clube-premium';

-- Recreate user_achievement_progress with security_invoker
-- Removed direct reference to auth.users (security issue)
-- Now uses profiles table which has proper RLS
CREATE VIEW public.user_achievement_progress
WITH (security_invoker = true) AS
SELECT 
  p.id AS user_id,
  COALESCE((SELECT COUNT(*) FROM baby_sleep_logs WHERE user_id = p.id), 0) AS sleep_logs_count,
  COALESCE((SELECT COUNT(*) FROM baby_feeding_logs WHERE user_id = p.id), 0) AS feeding_logs_count,
  COALESCE((SELECT COUNT(*) FROM itens_enxoval WHERE user_id = p.id), 0) AS enxoval_items_count,
  0::bigint AS mala_categories,
  COALESCE((SELECT COUNT(*) FROM baby_sleep_logs WHERE user_id = p.id AND duration_minutes >= 360), 0) AS long_sleep_count,
  COALESCE((SELECT SUM(preco_planejado - preco_unit_pago) FROM itens_enxoval WHERE user_id = p.id AND status = 'Comprado'), 0) AS total_savings,
  EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400 AS days_using_app,
  EXISTS(SELECT 1 FROM baby_feeding_logs WHERE user_id = p.id AND created_at <= p.created_at + INTERVAL '7 days') AS has_first_week,
  EXISTS(SELECT 1 FROM baby_feeding_logs WHERE user_id = p.id GROUP BY DATE(created_at) HAVING COUNT(*) >= 8) AS has_feeding_queen,
  EXISTS(SELECT 1 FROM baby_sleep_logs WHERE user_id = p.id AND duration_minutes >= 360) AS has_peaceful_nights,
  (SELECT COUNT(*) FROM baby_sleep_logs WHERE user_id = p.id) >= 30 AS has_sleep_master,
  (SELECT COUNT(*) FROM itens_enxoval WHERE user_id = p.id) >= 50 AS has_organizer_expert,
  false AS has_complete_bag,
  (SELECT SUM(preco_planejado - preco_unit_pago) FROM itens_enxoval WHERE user_id = p.id AND status = 'Comprado') >= 500 AS has_savings_master
FROM profiles p;

-- Enable RLS on views (this is inherited from underlying tables with security_invoker)
ALTER VIEW public.user_club_access SET (security_barrier = true);
ALTER VIEW public.user_achievement_progress SET (security_barrier = true);

-- Grant select to authenticated users (RLS from underlying tables will restrict access)
GRANT SELECT ON public.user_club_access TO authenticated;
GRANT SELECT ON public.user_achievement_progress TO authenticated;