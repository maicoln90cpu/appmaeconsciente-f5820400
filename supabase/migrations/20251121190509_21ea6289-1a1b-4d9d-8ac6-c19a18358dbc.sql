-- Allow public read access to site_settings for GTM script
DROP POLICY IF EXISTS "Only admins can view site settings" ON public.site_settings;

CREATE POLICY "Public can view GTM settings"
  ON public.site_settings
  FOR SELECT
  TO public
  USING (true);