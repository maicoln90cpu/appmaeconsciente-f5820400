-- Ativar trial para todos os produtos ativos
UPDATE public.products
SET 
  trial_enabled = true,
  trial_days = COALESCE(trial_days, 3)
WHERE is_active = true;