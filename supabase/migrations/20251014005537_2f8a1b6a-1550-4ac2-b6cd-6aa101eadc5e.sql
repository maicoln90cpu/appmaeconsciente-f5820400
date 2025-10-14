-- Add event_type column to hotmart_transactions table
ALTER TABLE hotmart_transactions 
ADD COLUMN IF NOT EXISTS event_type TEXT;