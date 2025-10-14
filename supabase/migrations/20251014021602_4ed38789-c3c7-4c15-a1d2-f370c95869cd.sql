-- Remover constraint unique da coluna transaction_id se existir
ALTER TABLE hotmart_transactions DROP CONSTRAINT IF EXISTS hotmart_transactions_transaction_id_key;

-- Criar índice (não unique) para melhorar performance nas queries
CREATE INDEX IF NOT EXISTS idx_hotmart_transactions_transaction_id ON hotmart_transactions(transaction_id);

-- Criar índice para event_type também
CREATE INDEX IF NOT EXISTS idx_hotmart_transactions_event_type ON hotmart_transactions(event_type);