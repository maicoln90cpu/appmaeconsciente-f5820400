-- Adicionar novos campos à tabela itens_enxoval para suportar o Método M.A.E.S.
ALTER TABLE public.itens_enxoval
ADD COLUMN IF NOT EXISTS etapa_maes text CHECK (etapa_maes IN ('Mapear', 'Avaliar', 'Enxugar', 'Sustentar')),
ADD COLUMN IF NOT EXISTS classificacao text CHECK (classificacao IN ('Essencial', 'Pode Esperar', 'Supérfluo')),
ADD COLUMN IF NOT EXISTS emocao text;

-- Adicionar novo campo à tabela config para mensagem pessoal
ALTER TABLE public.config
ADD COLUMN IF NOT EXISTS mensagem_motivacao text;