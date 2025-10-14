-- Add admin role for maicoln90@hotmail.com when user signs up or exists

-- First, try to add admin role if user already exists
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Try to find user in auth.users
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'maicoln90@hotmail.com';
  
  -- If user exists, add admin role
  IF admin_user_id IS NOT NULL THEN
    -- Remove existing roles for this user
    DELETE FROM user_roles WHERE user_id = admin_user_id;
    
    -- Add admin role
    INSERT INTO user_roles (user_id, role)
    VALUES (admin_user_id, 'admin');
    
    RAISE NOTICE 'Admin role added for existing user: %', admin_user_id;
  ELSE
    RAISE NOTICE 'User maicoln90@hotmail.com not found yet';
  END IF;
END $$;

-- Create function to auto-assign admin role for specific email
CREATE OR REPLACE FUNCTION public.assign_admin_role_for_specific_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the new user has the admin email
  IF NEW.email = 'maicoln90@hotmail.com' THEN
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role assigned to: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after user profile is created
DROP TRIGGER IF EXISTS auto_assign_admin_role ON public.profiles;
CREATE TRIGGER auto_assign_admin_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_role_for_specific_email();