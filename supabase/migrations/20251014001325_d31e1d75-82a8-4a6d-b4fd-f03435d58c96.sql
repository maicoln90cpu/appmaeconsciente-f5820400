
-- Corrigir a função de auto-assign para usar o email correto
CREATE OR REPLACE FUNCTION public.assign_admin_role_for_specific_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the new user has the admin email (email correto com 'hotmail')
  IF NEW.email = 'maicoln90@hotmail.com' THEN
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role assigned to: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$function$;
