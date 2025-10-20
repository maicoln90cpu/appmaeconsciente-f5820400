-- Atualizar descrição do produto Clube Premium para ser genérica
UPDATE public.products
SET short_description = 'Acesso ilimitado a TODOS os materiais em uma única assinatura mensal'
WHERE slug = 'clube-premium';