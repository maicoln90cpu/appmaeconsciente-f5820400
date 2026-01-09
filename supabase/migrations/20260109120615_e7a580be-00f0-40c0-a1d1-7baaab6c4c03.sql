-- Create ultrasound_images table
CREATE TABLE public.ultrasound_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  gestational_week INTEGER NOT NULL CHECK (gestational_week >= 4 AND gestational_week <= 42),
  ultrasound_date DATE NOT NULL,
  ultrasound_type TEXT DEFAULT 'routine',
  notes TEXT,
  baby_weight_grams INTEGER,
  baby_length_cm NUMERIC(5,2),
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ultrasound_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own ultrasounds"
  ON public.ultrasound_images
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ultrasounds"
  ON public.ultrasound_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ultrasounds"
  ON public.ultrasound_images
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ultrasounds"
  ON public.ultrasound_images
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_ultrasound_images_updated_at
  BEFORE UPDATE ON public.ultrasound_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for ultrasound images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ultrasounds', 'ultrasounds', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ultrasound bucket
CREATE POLICY "Users can view ultrasound images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'ultrasounds');

CREATE POLICY "Users can upload ultrasound images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'ultrasounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their ultrasound images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'ultrasounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their ultrasound images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'ultrasounds' AND auth.uid()::text = (storage.foldername(name))[1]);