-- Configurar limites de storage para profile-photos bucket
UPDATE storage.buckets
SET 
  file_size_limit = 5242880, -- 5MB em bytes
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'profile-photos';

-- Configurar limites de storage para post-images bucket
UPDATE storage.buckets
SET 
  file_size_limit = 5242880, -- 5MB em bytes
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'post-images';

-- Adicionar política INSERT redundante na tabela profiles (segurança adicional)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);