-- Create hotmart_product_mapping table
CREATE TABLE public.hotmart_product_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotmart_product_id TEXT NOT NULL UNIQUE,
  internal_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hotmart_transactions table for audit
CREATE TABLE public.hotmart_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE,
  hotmart_product_id TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  status TEXT NOT NULL,
  amount NUMERIC,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID,
  product_id UUID REFERENCES public.products(id)
);

-- Enable RLS
ALTER TABLE public.hotmart_product_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotmart_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hotmart_product_mapping
CREATE POLICY "Admins can manage product mappings"
ON public.hotmart_product_mapping
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for hotmart_transactions
CREATE POLICY "Admins can view all transactions"
ON public.hotmart_transactions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add index for faster lookups
CREATE INDEX idx_hotmart_mapping_product_id ON public.hotmart_product_mapping(hotmart_product_id);
CREATE INDEX idx_hotmart_transactions_email ON public.hotmart_transactions(buyer_email);
CREATE INDEX idx_user_product_access_lookup ON public.user_product_access(user_id, product_id);