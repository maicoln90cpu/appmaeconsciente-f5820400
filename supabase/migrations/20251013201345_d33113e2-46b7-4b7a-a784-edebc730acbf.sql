-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  thumbnail_url TEXT,
  is_free BOOLEAN NOT NULL DEFAULT true,
  price NUMERIC,
  hotmart_product_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_product_access table
CREATE TABLE public.user_product_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_product_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Anyone authenticated can view active products"
ON public.products
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_product_access
CREATE POLICY "Users can view their own access"
ON public.user_product_access
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all access"
ON public.user_product_access
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert Controle de Enxoval as first product
INSERT INTO public.products (slug, title, description, short_description, is_free, display_order)
VALUES (
  'controle-enxoval',
  'Controle de Enxoval Inteligente',
  'Sistema completo de planejamento e controle do enxoval do bebê. Gerencie seu orçamento, acompanhe compras, receba alertas inteligentes sobre excessos de tamanho RN, itens supérfluos e prazos de troca. Método MAES integrado para uma maternidade consciente e sem desperdícios.',
  'Planeje e controle seu enxoval com inteligência e economia',
  true,
  1
);