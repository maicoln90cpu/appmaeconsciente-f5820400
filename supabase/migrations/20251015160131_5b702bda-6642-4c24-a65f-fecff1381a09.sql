-- Adicionar coluna de tags nos itens do enxoval
ALTER TABLE public.itens_enxoval
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Criar tabela para links de compartilhamento público
CREATE TABLE IF NOT EXISTS public.shared_enxoval_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  views_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.shared_enxoval_links ENABLE ROW LEVEL SECURITY;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_shared_links_token ON public.shared_enxoval_links(token);
CREATE INDEX IF NOT EXISTS idx_shared_links_user_id ON public.shared_enxoval_links(user_id);

-- RLS Policies para shared_enxoval_links
CREATE POLICY "Users can create their own share links"
ON public.shared_enxoval_links
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own share links"
ON public.shared_enxoval_links
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own share links"
ON public.shared_enxoval_links
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own share links"
ON public.shared_enxoval_links
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Policy para acesso público (anônimo) via token válido
CREATE POLICY "Anyone can view valid shared links"
ON public.shared_enxoval_links
FOR SELECT
TO anon
USING (is_active = true AND expires_at > now());