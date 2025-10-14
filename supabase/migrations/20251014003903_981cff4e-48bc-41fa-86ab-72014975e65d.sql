-- Add access duration column to products table
ALTER TABLE products 
ADD COLUMN access_duration_days INTEGER;

COMMENT ON COLUMN products.access_duration_days IS 
'Duração do acesso em dias. NULL = acesso vitalício';