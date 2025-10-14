-- Enable realtime for hotmart_transactions table
ALTER TABLE hotmart_transactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE hotmart_transactions;