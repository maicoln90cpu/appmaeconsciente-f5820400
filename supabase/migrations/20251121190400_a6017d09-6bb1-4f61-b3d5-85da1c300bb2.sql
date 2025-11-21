-- Create site_settings table for storing site-wide configurations
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gtm_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view settings
CREATE POLICY "Only admins can view site settings"
  ON public.site_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email IN (
        'joaopauloap14@gmail.com',
        'joaopaulo@lovable.app',
        'jptech.itu@gmail.com'
      )
    )
  );

-- Only admins can update settings
CREATE POLICY "Only admins can update site settings"
  ON public.site_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email IN (
        'joaopauloap14@gmail.com',
        'joaopaulo@lovable.app',
        'jptech.itu@gmail.com'
      )
    )
  );

-- Only admins can insert settings
CREATE POLICY "Only admins can insert site settings"
  ON public.site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email IN (
        'joaopauloap14@gmail.com',
        'joaopaulo@lovable.app',
        'jptech.itu@gmail.com'
      )
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings with current GTM ID
INSERT INTO public.site_settings (gtm_id) 
VALUES ('GTM-K9TPFGCJ')
ON CONFLICT DO NOTHING;