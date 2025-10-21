-- Modificar trigger para conceder trial automaticamente sem pg_net
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  trial_product RECORD;
  expiration_date TIMESTAMP WITH TIME ZONE;
  config_id_var UUID;
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, email, perfil_completo)
  VALUES (NEW.id, NEW.email, FALSE);
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Grant trial access to all trial-enabled products
  FOR trial_product IN 
    SELECT id, title, trial_days 
    FROM public.products 
    WHERE trial_enabled = true 
      AND is_active = true
  LOOP
    expiration_date := NOW() + (trial_product.trial_days || ' days')::INTERVAL;
    
    INSERT INTO public.user_product_access (user_id, product_id, expires_at)
    VALUES (NEW.id, trial_product.id, expiration_date)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    
    RAISE NOTICE 'Trial concedido: % por % dias para usuário %', trial_product.title, trial_product.trial_days, NEW.email;
  END LOOP;
  
  RETURN NEW;
END;
$function$;