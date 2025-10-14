-- Adicionar campo display_name na tabela posts para admins personalizarem nome
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Adicionar campo hotmart_product_id para mapear produtos Hotmart
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS hotmart_product_id TEXT;

-- Adicionar campo payment_url para URL de checkout de cada produto
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS payment_url TEXT;

-- Criar índice para otimizar buscas por hotmart_product_id
CREATE INDEX IF NOT EXISTS idx_products_hotmart_id 
ON products(hotmart_product_id) 
WHERE hotmart_product_id IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN posts.display_name IS 'Nome customizado que aparece no post, usado principalmente por admins';
COMMENT ON COLUMN products.hotmart_product_id IS 'ID do produto na Hotmart para mapear compras do webhook';
COMMENT ON COLUMN products.payment_url IS 'URL de checkout específica deste produto na Hotmart';