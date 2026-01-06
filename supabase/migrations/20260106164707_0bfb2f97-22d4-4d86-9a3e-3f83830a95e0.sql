-- =====================================================
-- Fase 4: Gamificação Expandida - Schema completo
-- =====================================================

-- Etapa 4.1: Sistema de Níveis e XP
-- Adicionar colunas xp_total e level na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp_total INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS leaderboard_opt_in BOOLEAN NOT NULL DEFAULT false;

-- Função para calcular nível baseado em XP
-- Sistema progressivo: nível 1 = 0-99 XP, nível 2 = 100-299 XP, etc.
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Fórmula: nível = 1 + floor(sqrt(xp / 50))
  -- Nível 1: 0-49, Nível 2: 50-199, Nível 3: 200-449, Nível 4: 450-799, etc.
  RETURN 1 + FLOOR(SQRT(xp::FLOAT / 50));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para calcular XP necessário para próximo nível
CREATE OR REPLACE FUNCTION public.xp_for_next_level(current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- XP necessário = (nível)² * 50
  RETURN (current_level * current_level) * 50;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para adicionar XP ao usuário
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
  -- Obter XP e nível atuais
  SELECT xp_total, level INTO v_old_xp, v_old_level
  FROM profiles
  WHERE id = p_user_id;

  IF v_old_xp IS NULL THEN
    v_old_xp := 0;
    v_old_level := 1;
  END IF;

  -- Calcular novo XP e nível
  v_new_xp := v_old_xp + p_xp_amount;
  v_new_level := calculate_level(v_new_xp);

  -- Atualizar perfil
  UPDATE profiles
  SET xp_total = v_new_xp,
      level = v_new_level,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Registrar log de XP
  INSERT INTO xp_logs (user_id, xp_amount, action_type, created_at)
  VALUES (p_user_id, p_xp_amount, p_action_type, NOW());

  RETURN QUERY SELECT v_new_xp, v_new_level, (v_new_level > v_old_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tabela de logs de XP
CREATE TABLE IF NOT EXISTS public.xp_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  xp_amount INTEGER NOT NULL,
  action_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own XP logs"
  ON public.xp_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert XP logs"
  ON public.xp_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Tabela de atividades diárias (para calendário estilo GitHub)
CREATE TABLE IF NOT EXISTS public.daily_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  posts_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  sleep_logs_count INTEGER NOT NULL DEFAULT 0,
  feeding_logs_count INTEGER NOT NULL DEFAULT 0,
  total_xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily activity"
  ON public.daily_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily activity"
  ON public.daily_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily activity"
  ON public.daily_activity FOR UPDATE
  USING (auth.uid() = user_id);

-- Etapa 4.3: Tabela de badges expandida
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- 'contributor', 'mentor', 'consistent', 'explorer'
  requirement_type TEXT NOT NULL, -- 'count', 'streak', 'milestone'
  requirement_value INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela de badges desbloqueados pelos usuários
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id),
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notified BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert user badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own badges"
  ON public.user_badges FOR UPDATE
  USING (auth.uid() = user_id);

-- Inserir badges iniciais
INSERT INTO public.badges (code, name, description, icon, category, requirement_type, requirement_value, xp_reward, display_order) VALUES
-- Contribuidor
('first_post', 'Primeira Voz', 'Criou seu primeiro post na comunidade', 'MessageSquare', 'contributor', 'count', 1, 25, 1),
('active_poster', 'Voz Ativa', 'Criou 10 posts na comunidade', 'MessageSquarePlus', 'contributor', 'count', 10, 100, 2),
('influencer', 'Influenciadora', 'Criou 50 posts na comunidade', 'Megaphone', 'contributor', 'count', 50, 500, 3),

-- Mentor
('first_comment', 'Apoiadora', 'Comentou em um post pela primeira vez', 'MessageCircle', 'mentor', 'count', 1, 25, 10),
('helpful_mentor', 'Mentora', 'Fez 25 comentários na comunidade', 'Heart', 'mentor', 'count', 25, 150, 11),
('super_mentor', 'Super Mentora', 'Fez 100 comentários na comunidade', 'HeartHandshake', 'mentor', 'count', 100, 500, 12),

-- Consistente
('streak_7', 'Semana de Ouro', '7 dias consecutivos de atividade', 'Flame', 'consistent', 'streak', 7, 100, 20),
('streak_14', 'Duas Semanas Brilhantes', '14 dias consecutivos de atividade', 'Zap', 'consistent', 'streak', 14, 200, 21),
('streak_30', 'Mês de Dedicação', '30 dias consecutivos de atividade', 'Crown', 'consistent', 'streak', 30, 500, 22),
('streak_60', 'Comprometida', '60 dias consecutivos de atividade', 'Award', 'consistent', 'streak', 60, 1000, 23),

-- Explorer
('first_sleep', 'Rastreadora de Sono', 'Registrou o primeiro sono do bebê', 'Moon', 'explorer', 'milestone', 1, 25, 30),
('first_feeding', 'Amamentadora', 'Registrou a primeira mamada', 'Baby', 'explorer', 'milestone', 1, 25, 31),
('first_vaccine', 'Protetora', 'Registrou a primeira vacina', 'Syringe', 'explorer', 'milestone', 1, 25, 32),
('first_milestone', 'Observadora', 'Registrou o primeiro marco de desenvolvimento', 'Eye', 'explorer', 'milestone', 1, 25, 33),
('all_tools', 'Exploradora Completa', 'Usou todas as ferramentas do app', 'Compass', 'explorer', 'milestone', 1, 300, 34),
('welcome_badge', 'Bem-vinda!', 'Completou o onboarding', 'Sparkles', 'explorer', 'milestone', 1, 50, 35)
ON CONFLICT (code) DO NOTHING;

-- Etapa 4.4: View para Leaderboard (apenas usuários com opt-in)
CREATE OR REPLACE VIEW public.leaderboard_weekly AS
SELECT 
  p.id as user_id,
  COALESCE(SUBSTRING(p.full_name, 1, 1) || '***', 'Anônimo') as display_name,
  p.xp_total,
  p.level,
  (SELECT MAX(current_streak) FROM user_streaks us WHERE us.user_id = p.id) as max_streak,
  (SELECT COUNT(*) FROM user_badges ub WHERE ub.user_id = p.id) as badges_count,
  (SELECT SUM(total_xp_earned) FROM daily_activity da 
   WHERE da.user_id = p.id 
   AND da.activity_date >= CURRENT_DATE - INTERVAL '7 days') as weekly_xp
FROM profiles p
WHERE p.leaderboard_opt_in = true
  AND p.xp_total > 0
ORDER BY weekly_xp DESC NULLS LAST, p.xp_total DESC
LIMIT 50;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON public.daily_activity(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_xp_logs_user_id ON public.xp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_leaderboard ON public.profiles(leaderboard_opt_in, xp_total DESC) WHERE leaderboard_opt_in = true;