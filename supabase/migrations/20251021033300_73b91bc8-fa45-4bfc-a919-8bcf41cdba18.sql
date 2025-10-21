-- Criar tabela de bundles de produtos
CREATE TABLE public.product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  bonus_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  bonus_duration_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(main_product_id, bonus_product_id)
);

-- Criar índices para melhor performance
CREATE INDEX idx_product_bundles_main_product ON public.product_bundles(main_product_id);
CREATE INDEX idx_product_bundles_active ON public.product_bundles(is_active);

-- Habilitar RLS
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar bundles
CREATE POLICY "Admins can manage bundles"
ON public.product_bundles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Usuários autenticados podem visualizar bundles ativos
CREATE POLICY "Anyone authenticated can view active bundles"
ON public.product_bundles
FOR SELECT
USING (is_active = true);