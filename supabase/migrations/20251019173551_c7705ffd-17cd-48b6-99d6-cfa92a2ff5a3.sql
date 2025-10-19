-- Adicionar coluna category na tabela products
ALTER TABLE public.products ADD COLUMN category TEXT;

-- Atualizar produtos existentes com categorias
UPDATE public.products SET category = 'Organização' WHERE slug = 'controle-enxoval';
UPDATE public.products SET category = 'Planejamento Financeiro' WHERE slug = 'calculadora-fraldas';
UPDATE public.products SET category = 'Preparação para Parto' WHERE slug = 'mala-maternidade';
UPDATE public.products SET category = 'Saúde & Nutrição' WHERE slug = 'guia-alimentacao';
UPDATE public.products SET category = 'Cuidados com Bebê' WHERE slug = 'diario-sono';