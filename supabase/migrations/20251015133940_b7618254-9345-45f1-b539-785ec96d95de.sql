-- Atualizar trigger handle_new_user_profile para chamar grant-trial-access
-- Primeiro, criar a função atualizada
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, email, perfil_completo)
  VALUES (NEW.id, NEW.email, FALSE);
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Chamar edge function para conceder trial (se configurado)
  -- Usando pg_net para fazer a chamada HTTP
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  IF supabase_url IS NOT NULL AND service_role_key IS NOT NULL THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/grant-trial-access',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object('user_id', NEW.id::text)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;