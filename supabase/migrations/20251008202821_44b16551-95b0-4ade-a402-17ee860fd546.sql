-- Corrigir search_path nas funções para segurança
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.initialize_user_config()
RETURNS TRIGGER AS $$
DECLARE
  config_id_var UUID;
BEGIN
  -- Criar config padrão para o usuário
  INSERT INTO public.config (user_id, orcamento_total, dias_alerta_troca)
  VALUES (NEW.id, 5000, 7)
  RETURNING id INTO config_id_var;
  
  -- Inserir limites RN padrão
  INSERT INTO public.limites_rn (config_id, item, limite) VALUES
    (config_id_var, 'Bodies', 6),
    (config_id_var, 'Mijões', 4),
    (config_id_var, 'Macacões', 3),
    (config_id_var, 'Sapatos', 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;