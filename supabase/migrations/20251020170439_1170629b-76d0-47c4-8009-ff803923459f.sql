-- =============================================
-- PACOTE 1: MONETIZAÇÃO + SEGURANÇA
-- FASE 1.1: Sistema de Assinatura Clube Premium
-- =============================================

-- 1️⃣ Inserir produto "Clube M.A.E.S. Premium"
INSERT INTO products (
  slug,
  title,
  category,
  is_free,
  price,
  access_duration_days,
  description,
  short_description,
  is_active,
  display_order,
  thumbnail_url
) VALUES (
  'clube-premium',
  '🌟 Clube M.A.E.S. Premium - Acesso Total',
  'Assinatura',
  false,
  59.90,
  30,
  'Acesso ilimitado a TODOS os 7 materiais de maternidade + Dashboard unificado + Suporte prioritário + Novos materiais incluídos automaticamente. Renove mensalmente e tenha acesso completo a todas as ferramentas e conteúdos exclusivos.',
  'Todos os materiais por R$ 59,90/mês',
  true,
  0,
  null
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  short_description = EXCLUDED.short_description;

-- 2️⃣ Criar view para facilitar verificação de acesso ao clube
CREATE OR REPLACE VIEW user_club_access AS
SELECT 
  upa.user_id,
  upa.expires_at,
  (upa.expires_at IS NULL OR upa.expires_at > NOW()) AS has_active_access
FROM user_product_access upa
JOIN products p ON p.id = upa.product_id
WHERE p.slug = 'clube-premium';

-- =============================================
-- FASE 1.2: Correções de Segurança
-- =============================================

-- 3️⃣ Rate limiting para feeding logs (10 segundos entre registros)
CREATE OR REPLACE FUNCTION check_feeding_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM baby_feeding_logs
    WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '10 seconds'
  ) THEN
    RAISE EXCEPTION 'Aguarde 10 segundos antes de registrar outra mamada';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER feeding_rate_limit
  BEFORE INSERT ON baby_feeding_logs
  FOR EACH ROW EXECUTE FUNCTION check_feeding_rate_limit();

-- 4️⃣ Rate limiting para sleep logs (10 segundos entre registros)
CREATE OR REPLACE FUNCTION check_sleep_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM baby_sleep_logs
    WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '10 seconds'
  ) THEN
    RAISE EXCEPTION 'Aguarde 10 segundos antes de registrar outro sono';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sleep_rate_limit
  BEFORE INSERT ON baby_sleep_logs
  FOR EACH ROW EXECUTE FUNCTION check_sleep_rate_limit();

-- 5️⃣ Tabela de auditoria de acessos
CREATE TABLE IF NOT EXISTS user_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON user_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_product ON user_access_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_time ON user_access_logs(accessed_at DESC);

-- RLS policies para user_access_logs
ALTER TABLE user_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all access logs"
  ON user_access_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own access logs"
  ON user_access_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Sistema pode inserir logs (usado pelo ProductRoute)
CREATE POLICY "System can insert access logs"
  ON user_access_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);