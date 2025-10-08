-- Adicionar novas colunas à tabela limites_rn
ALTER TABLE public.limites_rn 
ADD COLUMN quando_aumentar TEXT,
ADD COLUMN observacoes TEXT;

-- Atualizar os registros existentes com os novos dados
UPDATE public.limites_rn SET 
  quando_aumentar = '+2 se clima frio',
  observacoes = 'Priorize tamanho P no restante do enxoval.'
WHERE item = 'Bodies';

UPDATE public.limites_rn SET 
  quando_aumentar = '+2 se clima frio',
  observacoes = 'Elástico suave; prefira com pé reversível.'
WHERE item = 'Mijões';

UPDATE public.limites_rn SET 
  quando_aumentar = '+1 se clima frio',
  observacoes = 'Abertura frontal facilita trocas.'
WHERE item = 'Macacões';

UPDATE public.limites_rn SET 
  quando_aumentar = '—',
  observacoes = 'Dispensável; use meias.'
WHERE item = 'Sapatos';

-- Atualizar a função initialize_user_config para incluir os novos campos
CREATE OR REPLACE FUNCTION public.initialize_user_config()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  config_id_var UUID;
BEGIN
  -- Criar config padrão para o usuário
  INSERT INTO public.config (user_id, orcamento_total, dias_alerta_troca)
  VALUES (NEW.id, 5000, 7)
  RETURNING id INTO config_id_var;
  
  -- Inserir limites RN padrão com os novos campos
  INSERT INTO public.limites_rn (config_id, item, limite, quando_aumentar, observacoes) VALUES
    (config_id_var, 'Bodies (curta+longa)', 6, '+2 se clima frio', 'Priorize tamanho P no restante do enxoval.'),
    (config_id_var, 'Mijões/Calças', 4, '+2 se clima frio', 'Elástico suave; prefira com pé reversível.'),
    (config_id_var, 'Macacões', 3, '+1 se clima frio', 'Abertura frontal facilita trocas.'),
    (config_id_var, 'Meias', 6, '+2 no frio', 'Dispensa "sapato RN".'),
    (config_id_var, 'Gorro', 1, '1 se frio', 'Use só em ambientes frios.'),
    (config_id_var, 'Luvas', 0, '1 par se quiser', 'Melhor manter unhas aparadas (mais confortável).'),
    (config_id_var, 'Casaquinho/Coletes', 1, '1 no frio', 'Evite peças volumosas.'),
    (config_id_var, 'Saída de maternidade', 1, '—', 'Opte por conjunto reutilizável.'),
    (config_id_var, 'Bodies RN manga curta', 3, '+1 no calor', 'Pode combinar com manga longa para 6 no total.'),
    (config_id_var, 'Bodies RN manga longa', 3, '+1 no frio', '—'),
    (config_id_var, 'Shorts/culotes leves', 2, '+2 no calor', 'Só se for verão intenso.'),
    (config_id_var, 'Sapatos RN', 0, '—', 'Dispensável; use meias.');
  
  RETURN NEW;
END;
$function$;