
-- =====================================================
-- FASE 1: CORREÇÕES DE SEGURANÇA CRÍTICAS (CONTINUAÇÃO)
-- =====================================================

-- As políticas para data_deletion_logs, security_audit_logs, support_tickets
-- e hotmart_transactions já foram aplicadas. Falta apenas a view.

-- 6. Criar view segura para dados públicos de perfil (sem dados sensíveis)
-- Usando o nome correto da coluna: foto_perfil_url
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Dar acesso à view para usuários autenticados
GRANT SELECT ON public.public_profiles TO authenticated;

-- 7. Adicionar comentários de segurança nas tabelas sensíveis
COMMENT ON TABLE public.profiles IS 'Dados pessoais do usuário - protegido por RLS. Contém informações sensíveis.';
COMMENT ON TABLE public.hotmart_transactions IS 'Transações financeiras - apenas admins têm acesso. Dados extremamente sensíveis.';
COMMENT ON TABLE public.security_audit_logs IS 'Logs de segurança - cada usuário vê apenas seus próprios logs.';
COMMENT ON TABLE public.data_deletion_logs IS 'Registros de exclusão LGPD - protegido por RLS.';
