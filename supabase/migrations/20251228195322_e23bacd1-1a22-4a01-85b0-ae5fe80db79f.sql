-- Sistema de Moderação: Denúncias de Posts
CREATE TABLE public.post_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sistema de Moderação: Usuários Bloqueados
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Sistema de Streaks e Desafios
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  streak_type TEXT NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, streak_type)
);

-- Desafios disponíveis
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 1,
  reward_points INTEGER NOT NULL DEFAULT 10,
  icon TEXT,
  duration_days INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Progresso do usuário em desafios
CREATE TABLE public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, challenge_id)
);

-- Índices para performance
CREATE INDEX idx_post_reports_post_id ON public.post_reports(post_id);
CREATE INDEX idx_post_reports_status ON public.post_reports(status);
CREATE INDEX idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON public.blocked_users(blocked_id);
CREATE INDEX idx_user_streaks_user ON public.user_streaks(user_id);
CREATE INDEX idx_user_challenges_user ON public.user_challenges(user_id);

-- RLS para post_reports
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report posts"
ON public.post_reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
ON public.post_reports FOR SELECT
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON public.post_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update reports"
ON public.post_reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS para blocked_users
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their blocks"
ON public.blocked_users FOR ALL
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can see if blocked"
ON public.blocked_users FOR SELECT
USING (auth.uid() = blocked_id);

-- RLS para user_streaks
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their streaks"
ON public.user_streaks FOR ALL
USING (auth.uid() = user_id);

-- RLS para challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active challenges"
ON public.challenges FOR SELECT
USING (is_active = true);

-- RLS para user_challenges
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their challenges"
ON public.user_challenges FOR ALL
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at em user_streaks
CREATE TRIGGER update_user_streaks_updated_at
BEFORE UPDATE ON public.user_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir desafios iniciais
INSERT INTO public.challenges (title, description, challenge_type, target_count, reward_points, icon, duration_days) VALUES
('Primeira Postagem', 'Faça sua primeira postagem na comunidade', 'first_post', 1, 10, 'MessageSquare', NULL),
('Conectada', 'Curta 5 postagens de outras mães', 'likes_given', 5, 15, 'Heart', 7),
('Apoiadora', 'Comente em 3 postagens diferentes', 'comments_given', 3, 20, 'MessageCircle', 7),
('Diário do Sono', 'Registre o sono do bebê por 7 dias seguidos', 'sleep_streak', 7, 50, 'Moon', NULL),
('Amamentação Dedicada', 'Registre 10 mamadas', 'feeding_logs', 10, 30, 'Baby', 7),
('Organizadora', 'Adicione 10 itens ao enxoval', 'enxoval_items', 10, 25, 'ShoppingBag', NULL),
('Mala Pronta', 'Complete 50% da mala maternidade', 'bag_progress', 50, 40, 'Briefcase', NULL),
('Super Mãe', 'Mantenha streak de 14 dias em qualquer atividade', 'any_streak', 14, 100, 'Trophy', NULL);