-- Criar tabela para logs de engajamento por IA
CREATE TABLE public.ai_engagement_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('comment', 'like')),
  virtual_user_id UUID NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_ai_engagement_logs_post_id ON public.ai_engagement_logs(post_id);
CREATE INDEX idx_ai_engagement_logs_action_type ON public.ai_engagement_logs(action_type);
CREATE INDEX idx_ai_engagement_logs_created_at ON public.ai_engagement_logs(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.ai_engagement_logs ENABLE ROW LEVEL SECURITY;

-- Política para admins lerem todos os logs
CREATE POLICY "Admins can read all engagement logs"
ON public.ai_engagement_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
);

-- Política para service role inserir (usado por edge functions)
CREATE POLICY "Service role can insert engagement logs"
ON public.ai_engagement_logs
FOR INSERT
WITH CHECK (true);