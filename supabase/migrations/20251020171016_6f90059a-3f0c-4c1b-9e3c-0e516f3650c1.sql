-- =============================================
-- PACOTE 2: INTEGRAÇÕES + GAMIFICAÇÃO
-- FASE 2.2: Sistema de Gamificação e Conquistas
-- =============================================

-- 1️⃣ Tabela de conquistas dos usuários
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_code TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, achievement_code)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_code ON user_achievements(achievement_code);

-- RLS policies
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2️⃣ View com progresso de conquistas
CREATE OR REPLACE VIEW user_achievement_progress AS
SELECT 
  u.id AS user_id,
  
  -- Conquista: Mestre do Sono (7 registros de sono)
  (SELECT COUNT(*) FROM baby_sleep_logs WHERE user_id = u.id) AS sleep_logs_count,
  CASE WHEN (SELECT COUNT(*) FROM baby_sleep_logs WHERE user_id = u.id) >= 7 
    THEN true ELSE false END AS has_sleep_master,
  
  -- Conquista: Rainha da Amamentação (30 registros de mamadas)
  (SELECT COUNT(*) FROM baby_feeding_logs WHERE user_id = u.id) AS feeding_logs_count,
  CASE WHEN (SELECT COUNT(*) FROM baby_feeding_logs WHERE user_id = u.id) >= 30 
    THEN true ELSE false END AS has_feeding_queen,
  
  -- Conquista: Economista Consciente (economizou R$ 200+)
  (SELECT 
     COALESCE(SUM(
       (qtd_planejada * preco_planejado) - (qtd_comprada * preco_unit_pago)
     ), 0) 
   FROM itens_enxoval WHERE user_id = u.id
  ) AS total_savings,
  CASE WHEN (
    SELECT COALESCE(SUM((qtd_planejada * preco_planejado) - (qtd_comprada * preco_unit_pago)), 0)
    FROM itens_enxoval WHERE user_id = u.id
  ) >= 200 THEN true ELSE false END AS has_savings_master,
  
  -- Conquista: Organizadora Expert (50+ itens no enxoval)
  (SELECT COUNT(*) FROM itens_enxoval WHERE user_id = u.id) AS enxoval_items_count,
  CASE WHEN (SELECT COUNT(*) FROM itens_enxoval WHERE user_id = u.id) >= 50 
    THEN true ELSE false END AS has_organizer_expert,
  
  -- Conquista: Noites Tranquilas (bebê dormiu 6h+ consecutivas)
  (SELECT COUNT(*) FROM baby_sleep_logs 
   WHERE user_id = u.id AND duration_minutes >= 360
  ) AS long_sleep_count,
  CASE WHEN (SELECT COUNT(*) FROM baby_sleep_logs 
             WHERE user_id = u.id AND duration_minutes >= 360) >= 3
    THEN true ELSE false END AS has_peaceful_nights,
  
  -- Conquista: Primeira Semana (7 dias usando o app)
  (SELECT DATE_PART('day', NOW() - MIN(created_at)) 
   FROM baby_feeding_logs WHERE user_id = u.id
  ) AS days_using_app,
  CASE WHEN (
    SELECT DATE_PART('day', NOW() - MIN(created_at)) 
    FROM baby_feeding_logs WHERE user_id = u.id
  ) >= 7 THEN true ELSE false END AS has_first_week,
  
  -- Conquista: Mala Completa (todos itens da mala marcados)
  (SELECT COUNT(*) FROM (
    SELECT DISTINCT categoria FROM itens_enxoval 
    WHERE user_id = u.id AND categoria LIKE '%mala%'
  ) t) AS mala_categories,
  CASE WHEN (SELECT COUNT(*) FROM itens_enxoval 
             WHERE user_id = u.id AND categoria LIKE '%mala%') >= 10
    THEN true ELSE false END AS has_complete_bag

FROM auth.users u;