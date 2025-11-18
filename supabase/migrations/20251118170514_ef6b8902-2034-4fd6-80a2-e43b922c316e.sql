-- Create maternity_bag_categories table
CREATE TABLE public.maternity_bag_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  delivery_type_filter TEXT, -- 'cesarean', 'normal', null for both
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maternity_bag_items table
CREATE TABLE public.maternity_bag_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.maternity_bag_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  checked BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  cesarean_only BOOLEAN DEFAULT false,
  normal_only BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maternity_bag_shared_access table
CREATE TABLE public.maternity_bag_shared_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  access_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_accessed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maternity_bag_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maternity_bag_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maternity_bag_shared_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maternity_bag_categories
CREATE POLICY "Users can view their own categories"
  ON public.maternity_bag_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON public.maternity_bag_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON public.maternity_bag_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON public.maternity_bag_categories FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for maternity_bag_items
CREATE POLICY "Users can view their own items"
  ON public.maternity_bag_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared items"
  ON public.maternity_bag_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.maternity_bag_shared_access
      WHERE maternity_bag_shared_access.user_id = maternity_bag_items.user_id
        AND maternity_bag_shared_access.is_active = true
        AND maternity_bag_shared_access.expires_at > now()
        AND maternity_bag_shared_access.shared_with_email = (
          SELECT email FROM public.profiles WHERE id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can create their own items"
  ON public.maternity_bag_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
  ON public.maternity_bag_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON public.maternity_bag_items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for maternity_bag_shared_access
CREATE POLICY "Users can view their own shared access"
  ON public.maternity_bag_shared_access FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create shared access"
  ON public.maternity_bag_shared_access FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared access"
  ON public.maternity_bag_shared_access FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared access"
  ON public.maternity_bag_shared_access FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_maternity_bag_categories_user_id ON public.maternity_bag_categories(user_id);
CREATE INDEX idx_maternity_bag_items_user_id ON public.maternity_bag_items(user_id);
CREATE INDEX idx_maternity_bag_items_category_id ON public.maternity_bag_items(category_id);
CREATE INDEX idx_maternity_bag_shared_access_user_id ON public.maternity_bag_shared_access(user_id);
CREATE INDEX idx_maternity_bag_shared_access_token ON public.maternity_bag_shared_access(access_token);

-- Create triggers for updated_at
CREATE TRIGGER update_maternity_bag_categories_updated_at
  BEFORE UPDATE ON public.maternity_bag_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maternity_bag_items_updated_at
  BEFORE UPDATE ON public.maternity_bag_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maternity_bag_shared_access_updated_at
  BEFORE UPDATE ON public.maternity_bag_shared_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();