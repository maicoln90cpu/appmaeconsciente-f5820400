-- Corrigir problemas de segurança detectados

-- 1. Corrigir funções sem search_path definido
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN 1 + FLOOR(SQRT(xp::FLOAT / 50));
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.xp_for_next_level(current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN (current_level * current_level) * 50;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.add_user_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_action_type TEXT DEFAULT NULL
)
RETURNS TABLE(new_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN) AS $$
DECLARE
  v_old_xp INTEGER;
  v_old_level INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  SELECT xp_total, level INTO v_old_xp, v_old_level
  FROM profiles
  WHERE id = p_user_id;

  IF v_old_xp IS NULL THEN
    v_old_xp := 0;
    v_old_level := 1;
  END IF;

  v_new_xp := v_old_xp + p_xp_amount;
  v_new_level := calculate_level(v_new_xp);

  UPDATE profiles
  SET xp_total = v_new_xp,
      level = v_new_level,
      updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO xp_logs (user_id, xp_amount, action_type, created_at)
  VALUES (p_user_id, p_xp_amount, p_action_type, NOW());

  RETURN QUERY SELECT v_new_xp, v_new_level, (v_new_level > v_old_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Habilitar RLS na tabela badges (era pública por design, mas vamos adicionar política)
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone"
  ON public.badges FOR SELECT
  USING (true);

-- 3. Remover a view com SECURITY DEFINER e recriar como regular
DROP VIEW IF EXISTS public.leaderboard_weekly;

-- Criar tabela materializada para leaderboard (mais segura)
CREATE TABLE IF NOT EXISTS public.leaderboard_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Anônimo',
  xp_total INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  max_streak INTEGER DEFAULT 0,
  badges_count INTEGER DEFAULT 0,
  weekly_xp INTEGER DEFAULT 0,
  rank_position INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ver o leaderboard (é público por design)
CREATE POLICY "Leaderboard is viewable by everyone"
  ON public.leaderboard_cache FOR SELECT
  USING (true);

-- Apenas o sistema pode atualizar (via funções)
CREATE POLICY "Only system can update leaderboard"
  ON public.leaderboard_cache FOR ALL
  USING (false)
  WITH CHECK (false);

-- Função para atualizar leaderboard cache (chamada periodicamente)
CREATE OR REPLACE FUNCTION public.refresh_leaderboard()
RETURNS void AS $$
BEGIN
  -- Limpar cache antigo
  DELETE FROM leaderboard_cache;
  
  -- Inserir dados atualizados apenas de usuários com opt-in
  INSERT INTO leaderboard_cache (user_id, display_name, xp_total, level, max_streak, badges_count, weekly_xp, rank_position, updated_at)
  SELECT 
    p.id,
    COALESCE(SUBSTRING(p.full_name, 1, 1) || '***', 'Anônimo'),
    p.xp_total,
    p.level,
    COALESCE((SELECT MAX(current_streak) FROM user_streaks us WHERE us.user_id = p.id), 0),
    (SELECT COUNT(*) FROM user_badges ub WHERE ub.user_id = p.id)::INTEGER,
    COALESCE((SELECT SUM(total_xp_earned) FROM daily_activity da 
     WHERE da.user_id = p.id 
     AND da.activity_date >= CURRENT_DATE - INTERVAL '7 days'), 0)::INTEGER,
    ROW_NUMBER() OVER (ORDER BY 
      COALESCE((SELECT SUM(total_xp_earned) FROM daily_activity da 
       WHERE da.user_id = p.id 
       AND da.activity_date >= CURRENT_DATE - INTERVAL '7 days'), 0) DESC NULLS LAST, 
      p.xp_total DESC
    )::INTEGER,
    NOW()
  FROM profiles p
  WHERE p.leaderboard_opt_in = true
    AND p.xp_total > 0
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;