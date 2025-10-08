-- Criar tabela de configurações
CREATE TABLE IF NOT EXISTS public.config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  orcamento_total DECIMAL(10,2) DEFAULT 5000,
  dias_alerta_troca INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de limites RN
CREATE TABLE IF NOT EXISTS public.limites_rn (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID NOT NULL REFERENCES public.config(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  limite INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens do enxoval
CREATE TABLE IF NOT EXISTS public.itens_enxoval (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data DATE,
  categoria TEXT NOT NULL CHECK (categoria IN ('Roupas','Higiene','Quarto','Alimentação','Mãe','Extras')),
  item TEXT NOT NULL,
  necessidade TEXT NOT NULL CHECK (necessidade IN ('Necessário','Depois','Não')),
  prioridade TEXT NOT NULL CHECK (prioridade IN ('Alta','Média','Baixa')),
  tamanho TEXT CHECK (tamanho IN ('RN','P','M','G','Opcional')),
  qtd_planejada INTEGER DEFAULT 0,
  preco_planejado DECIMAL(10,2) DEFAULT 0,
  qtd_comprada INTEGER DEFAULT 0,
  preco_unit_pago DECIMAL(10,2) DEFAULT 0,
  frete DECIMAL(10,2) DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  preco_referencia DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'A comprar' CHECK (status IN ('A comprar','Comprado')),
  loja TEXT,
  link TEXT,
  origem TEXT CHECK (origem IN ('Novo','Usado','Brechó')),
  data_limite_troca DATE,
  obs TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.limites_rn ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_enxoval ENABLE ROW LEVEL SECURITY;

-- Políticas para config
CREATE POLICY "Users can view their own config"
ON public.config FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own config"
ON public.config FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own config"
ON public.config FOR UPDATE
USING (auth.uid() = user_id);

-- Políticas para limites_rn
CREATE POLICY "Users can view their own limites_rn"
ON public.limites_rn FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.config
  WHERE config.id = limites_rn.config_id
  AND config.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own limites_rn"
ON public.limites_rn FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.config
  WHERE config.id = limites_rn.config_id
  AND config.user_id = auth.uid()
));

CREATE POLICY "Users can update their own limites_rn"
ON public.limites_rn FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.config
  WHERE config.id = limites_rn.config_id
  AND config.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own limites_rn"
ON public.limites_rn FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.config
  WHERE config.id = limites_rn.config_id
  AND config.user_id = auth.uid()
));

-- Políticas para itens_enxoval
CREATE POLICY "Users can view their own items"
ON public.itens_enxoval FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items"
ON public.itens_enxoval FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
ON public.itens_enxoval FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
ON public.itens_enxoval FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_config_updated_at
BEFORE UPDATE ON public.config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itens_enxoval_updated_at
BEFORE UPDATE ON public.itens_enxoval
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir limites RN padrão (será criado quando o usuário criar sua config)
-- Exemplo de função para inicializar config com limites padrão
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentando o trigger pois não temos acesso à tabela auth.users
-- Usuários terão que criar manualmente ou via aplicação
-- CREATE TRIGGER on_auth_user_created
-- AFTER INSERT ON auth.users
-- FOR EACH ROW
-- EXECUTE FUNCTION public.initialize_user_config();