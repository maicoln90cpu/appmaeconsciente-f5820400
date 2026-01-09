
-- =====================================================
-- CORREÇÃO DAS POLÍTICAS PERMISSIVAS RESTANTES
-- =====================================================

-- 1. Remover políticas antigas permissivas que ainda existem
DROP POLICY IF EXISTS "System can insert deletion logs" ON public.data_deletion_logs;
DROP POLICY IF EXISTS "System can insert security logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Anyone can create tickets" ON public.support_tickets;

-- 2. Remover políticas duplicadas que podem ter sido criadas
DROP POLICY IF EXISTS "Users can insert their own deletion logs" ON public.data_deletion_logs;
DROP POLICY IF EXISTS "Admins can view all deletion logs" ON public.data_deletion_logs;
DROP POLICY IF EXISTS "Users can view their own deletion logs" ON public.data_deletion_logs;
DROP POLICY IF EXISTS "Users can insert their own security logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Admins can view all security logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Users can view their own security logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Users can create their own tickets" ON public.support_tickets;

-- 3. Recriar políticas corretas para data_deletion_logs
CREATE POLICY "Users can insert their own deletion logs"
ON public.data_deletion_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deletion logs"
ON public.data_deletion_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own deletion logs"
ON public.data_deletion_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Recriar políticas corretas para security_audit_logs
CREATE POLICY "Users can insert their own security logs"
ON public.security_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all security logs"
ON public.security_audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own security logs"
ON public.security_audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 5. Recriar política correta para support_tickets
CREATE POLICY "Users can create their own tickets"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6. Corrigir a view com SECURITY INVOKER (padrão seguro)
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  COALESCE(SUBSTRING(full_name, 1, 1) || '***', 'Anônimo') as display_name,
  foto_perfil_url,
  created_at,
  xp_total,
  level,
  leaderboard_opt_in
FROM public.profiles
WHERE leaderboard_opt_in = true;

GRANT SELECT ON public.public_profiles TO authenticated;
