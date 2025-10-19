-- Criar tabela de registros de sono do bebê
CREATE TABLE public.baby_sleep_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baby_name TEXT,
  baby_age_months INTEGER,
  sleep_start TIMESTAMP WITH TIME ZONE NOT NULL,
  sleep_end TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  sleep_type TEXT NOT NULL CHECK (sleep_type IN ('diurno', 'noturno')),
  location TEXT CHECK (location IN ('berco', 'colo', 'carrinho', 'cama_compartilhada', 'outro')),
  wakeup_mood TEXT CHECK (wakeup_mood IN ('calmo', 'chorando', 'agitado', 'neutro')),
  mom_mood TEXT CHECK (mom_mood IN ('descansada', 'cansada', 'exausta', 'neutra')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de configurações de sono
CREATE TABLE public.baby_sleep_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  baby_name TEXT NOT NULL,
  baby_birthdate DATE NOT NULL,
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_interval_minutes INTEGER DEFAULT 90,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de marcos de sono por idade
CREATE TABLE public.baby_sleep_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  age_range_start INTEGER NOT NULL,
  age_range_end INTEGER NOT NULL,
  recommended_total_hours_min INTEGER NOT NULL,
  recommended_total_hours_max INTEGER NOT NULL,
  recommended_naps INTEGER,
  avg_night_sleep_hours INTEGER,
  tips TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.baby_sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_sleep_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_sleep_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies para baby_sleep_logs
CREATE POLICY "Users can view their own sleep logs"
ON public.baby_sleep_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sleep logs"
ON public.baby_sleep_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep logs"
ON public.baby_sleep_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sleep logs"
ON public.baby_sleep_logs FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies para baby_sleep_settings
CREATE POLICY "Users can view their own settings"
ON public.baby_sleep_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.baby_sleep_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.baby_sleep_settings FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies para baby_sleep_milestones (público para leitura)
CREATE POLICY "Anyone authenticated can view milestones"
ON public.baby_sleep_milestones FOR SELECT
USING (true);

CREATE POLICY "Admins can manage milestones"
ON public.baby_sleep_milestones FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_baby_sleep_logs_updated_at
BEFORE UPDATE ON public.baby_sleep_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_baby_sleep_settings_updated_at
BEFORE UPDATE ON public.baby_sleep_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados de marcos de sono
INSERT INTO public.baby_sleep_milestones (age_range_start, age_range_end, recommended_total_hours_min, recommended_total_hours_max, recommended_naps, avg_night_sleep_hours, tips) VALUES
(0, 3, 14, 17, 4, 8, ARRAY['Sono fracionado é normal nessa fase', 'Bebês acordam para mamar a cada 2-3 horas', 'Ambiente escuro e silencioso ajuda', 'Swaddle pode acalmar o bebê']),
(4, 6, 12, 16, 3, 10, ARRAY['Bebê começa a dormir períodos mais longos', 'Estabeleça uma rotina de sono', 'Evite estímulos 30 min antes de dormir', 'Sonecas regulares são importantes']),
(7, 12, 12, 15, 2, 11, ARRAY['Rotina consistente é fundamental', 'Bebê pode dormir a noite toda', 'Mantenha horários regulares', 'Cuide da temperatura do quarto']),
(13, 18, 11, 14, 2, 11, ARRAY['Transição para 2 sonecas', 'Mantenha rotina relaxante antes de dormir', 'Evite telas antes do sono', 'Atividades físicas durante o dia ajudam']),
(19, 24, 11, 14, 1, 11, ARRAY['Transição para 1 soneca', 'Soneca após o almoço é ideal', 'Rotina noturna de 30-45 min', 'Bebê entende mais a rotina agora']);

-- Adicionar o produto na tabela products
INSERT INTO public.products (
  title,
  slug,
  short_description,
  description,
  is_free,
  is_active,
  display_order,
  destination_url,
  thumbnail_url
) VALUES (
  '💤 Diário de Sono do Bebê',
  'diario-sono',
  'Monitore, analise e melhore o sono do seu bebê com inteligência',
  'Ferramenta completa para registrar sono, visualizar padrões, receber alertas inteligentes e construir uma rotina saudável. Inclui: registro com temporizador, dashboard analítico, sugestões por idade, histórico detalhado, exportação PDF e compartilhamento via WhatsApp e Email.',
  false,
  true,
  6,
  '/materiais/diario-sono',
  NULL
);