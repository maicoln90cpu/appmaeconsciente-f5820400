-- Create baby_feeding_logs table
CREATE TABLE public.baby_feeding_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baby_name TEXT,
  feeding_type TEXT NOT NULL CHECK (feeding_type IN ('breastfeeding', 'bottle', 'pumping')),
  breast_side TEXT CHECK (breast_side IN ('left', 'right', 'both')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  volume_ml INTEGER,
  milk_type TEXT CHECK (milk_type IN ('breast_milk', 'formula', 'mixed')),
  temperature TEXT CHECK (temperature IN ('warm', 'room', 'cold')),
  leftover_ml INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.baby_feeding_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for baby_feeding_logs
CREATE POLICY "Users can view their own feeding logs"
ON public.baby_feeding_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feeding logs"
ON public.baby_feeding_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feeding logs"
ON public.baby_feeding_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feeding logs"
ON public.baby_feeding_logs FOR DELETE
USING (auth.uid() = user_id);

-- Create breast_milk_storage table
CREATE TABLE public.breast_milk_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pumped_at TIMESTAMPTZ NOT NULL,
  volume_ml INTEGER NOT NULL,
  pump_method TEXT CHECK (pump_method IN ('manual', 'electric')),
  storage_location TEXT NOT NULL CHECK (storage_location IN ('fridge', 'freezer')),
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.breast_milk_storage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for breast_milk_storage
CREATE POLICY "Users can view their own storage"
ON public.breast_milk_storage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own storage"
ON public.breast_milk_storage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own storage"
ON public.breast_milk_storage FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own storage"
ON public.breast_milk_storage FOR DELETE
USING (auth.uid() = user_id);

-- Create feeding_settings table
CREATE TABLE public.feeding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  baby_name TEXT NOT NULL,
  baby_birthdate DATE NOT NULL,
  feeding_interval_minutes INTEGER DEFAULT 180,
  reminder_enabled BOOLEAN DEFAULT true,
  last_breast_side TEXT CHECK (last_breast_side IN ('left', 'right')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feeding_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feeding_settings
CREATE POLICY "Users can view their own settings"
ON public.feeding_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.feeding_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.feeding_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_baby_feeding_logs_updated_at
BEFORE UPDATE ON public.baby_feeding_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_breast_milk_storage_updated_at
BEFORE UPDATE ON public.breast_milk_storage
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feeding_settings_updated_at
BEFORE UPDATE ON public.feeding_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert product into products table
INSERT INTO public.products (
  title,
  slug,
  description,
  short_description,
  category,
  is_free,
  is_active,
  price,
  destination_url,
  display_order
) VALUES (
  '🍼 Rastreador de Amamentação e Mamadeiras',
  'rastreador-amamentacao',
  'Ferramenta interativa completa para registrar e acompanhar toda a rotina de alimentação do bebê — amamentação, mamadeiras e ordenha. Controle inteligente de horários, quantidade e armazenamento para construir uma rotina alimentar tranquila e saudável.',
  'Registre e monitore amamentação, mamadeiras e ordenha com controle inteligente de horários e estoque.',
  'Cuidados com Bebê',
  false,
  true,
  39.90,
  '/materiais/rastreador-amamentacao',
  6
);