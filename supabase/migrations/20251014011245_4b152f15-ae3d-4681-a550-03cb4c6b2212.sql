-- Adicionar coluna destination_url na tabela products
ALTER TABLE public.products 
ADD COLUMN destination_url text;