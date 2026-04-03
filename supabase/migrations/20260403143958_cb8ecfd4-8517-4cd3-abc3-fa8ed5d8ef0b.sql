
-- =============================================
-- 1. TABELA blog_posts
-- =============================================
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  meta_title TEXT,
  meta_description TEXT,
  seo_keywords TEXT[],
  categories TEXT[],
  tags TEXT[],
  featured_image_url TEXT,
  og_image_url TEXT,
  author_name TEXT DEFAULT 'Mãe Consciente',
  reading_time_min INTEGER DEFAULT 5,
  views_count INTEGER DEFAULT 0,
  is_ai_generated BOOLEAN DEFAULT false,
  model_used TEXT,
  generation_cost_usd NUMERIC(10,6) DEFAULT 0,
  image_generation_cost_usd NUMERIC(10,6) DEFAULT 0,
  faq_schema JSONB,
  internal_links JSONB,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ler posts publicados
CREATE POLICY "Anyone can read published blog posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published');

-- Admins podem ler todos os posts (incluindo rascunhos)
CREATE POLICY "Admins can read all blog posts"
  ON public.blog_posts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins podem criar posts
CREATE POLICY "Admins can create blog posts"
  ON public.blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins podem editar posts
CREATE POLICY "Admins can update blog posts"
  ON public.blog_posts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins podem deletar posts
CREATE POLICY "Admins can delete blog posts"
  ON public.blog_posts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Índices
CREATE INDEX idx_blog_posts_slug ON public.blog_posts (slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts (status);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts (published_at DESC);
CREATE INDEX idx_blog_posts_categories ON public.blog_posts USING GIN (categories);

-- Trigger updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. TABELA blog_settings (singleton)
-- =============================================
CREATE TABLE public.blog_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_active BOOLEAN DEFAULT false,
  auto_publish BOOLEAN DEFAULT false,
  cron_schedule TEXT DEFAULT 'every_24h',
  ai_model TEXT DEFAULT 'google/gemini-3-flash-preview',
  image_model TEXT DEFAULT 'google/gemini-3.1-flash-image-preview',
  default_author TEXT DEFAULT 'Mãe Consciente',
  system_prompt TEXT,
  image_prompt_template TEXT,
  categories_list JSONB DEFAULT '["Gravidez","Pós-Parto","Bebê","Saúde da Mãe","Alimentação","Desenvolvimento Infantil","Amamentação","Sono do Bebê"]'::jsonb,
  topics_pool JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read blog settings"
  ON public.blog_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update blog settings"
  ON public.blog_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert blog settings"
  ON public.blog_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_blog_settings_updated_at
  BEFORE UPDATE ON public.blog_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 3. TABELA blog_generation_logs
-- =============================================
CREATE TABLE public.blog_generation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  model_used TEXT,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'success', 'error')),
  generation_type TEXT NOT NULL DEFAULT 'text' CHECK (generation_type IN ('text', 'image')),
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  text_cost_usd NUMERIC(10,6) DEFAULT 0,
  image_cost_usd NUMERIC(10,6) DEFAULT 0,
  total_cost_usd NUMERIC(10,6) DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blog generation logs"
  ON public.blog_generation_logs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 4. TABELA blog_image_prompts
-- =============================================
CREATE TABLE public.blog_image_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  style_description TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_image_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blog image prompts"
  ON public.blog_image_prompts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_blog_image_prompts_updated_at
  BEFORE UPDATE ON public.blog_image_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 5. FUNÇÃO RPC increment_blog_views
-- =============================================
CREATE OR REPLACE FUNCTION public.increment_blog_views(p_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.blog_posts
  SET views_count = views_count + 1
  WHERE slug = p_slug AND status = 'published';
END;
$$;

-- =============================================
-- 6. BUCKET blog-images (público)
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true);

-- Qualquer pessoa pode ver imagens do blog
CREATE POLICY "Anyone can view blog images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');

-- Admins podem fazer upload
CREATE POLICY "Admins can upload blog images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'));

-- Admins podem deletar
CREATE POLICY "Admins can delete blog images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'));

-- Service role pode fazer upload (para edge functions)
CREATE POLICY "Service role can upload blog images"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Service role can update blog images"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'blog-images');
