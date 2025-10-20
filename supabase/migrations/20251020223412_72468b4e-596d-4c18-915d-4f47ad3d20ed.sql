-- Criar tabela de perfis de bebê para vacinação
CREATE TABLE IF NOT EXISTS public.baby_vaccination_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  baby_name TEXT NOT NULL,
  nickname TEXT,
  birth_date DATE NOT NULL,
  avatar_url TEXT,
  birth_type TEXT,
  birth_city TEXT,
  calendar_type TEXT NOT NULL DEFAULT 'brasil',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.baby_vaccination_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own baby profiles"
  ON public.baby_vaccination_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own baby profiles"
  ON public.baby_vaccination_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own baby profiles"
  ON public.baby_vaccination_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own baby profiles"
  ON public.baby_vaccination_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Criar tabela de calendário de vacinação
CREATE TABLE IF NOT EXISTS public.vaccination_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccine_name TEXT NOT NULL,
  age_months INTEGER NOT NULL,
  dose_number INTEGER NOT NULL,
  dose_label TEXT,
  application_type TEXT,
  description TEXT,
  purpose TEXT,
  side_effects TEXT,
  post_vaccine_tips TEXT,
  interval_days INTEGER,
  calendar_type TEXT NOT NULL DEFAULT 'brasil',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.vaccination_calendar ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Anyone authenticated can view vaccination calendar"
  ON public.vaccination_calendar FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage vaccination calendar"
  ON public.vaccination_calendar FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar tabela de vacinas aplicadas
CREATE TABLE IF NOT EXISTS public.baby_vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  baby_profile_id UUID NOT NULL REFERENCES public.baby_vaccination_profiles(id) ON DELETE CASCADE,
  calendar_vaccine_id UUID REFERENCES public.vaccination_calendar(id),
  vaccine_name TEXT NOT NULL,
  dose_label TEXT,
  application_date DATE NOT NULL,
  batch_number TEXT,
  manufacturer TEXT,
  application_site TEXT,
  health_professional TEXT,
  reactions TEXT,
  proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.baby_vaccinations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own vaccinations"
  ON public.baby_vaccinations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vaccinations"
  ON public.baby_vaccinations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vaccinations"
  ON public.baby_vaccinations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vaccinations"
  ON public.baby_vaccinations FOR DELETE
  USING (auth.uid() = user_id);

-- Criar tabela de configurações de lembretes
CREATE TABLE IF NOT EXISTS public.vaccination_reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  baby_profile_id UUID NOT NULL REFERENCES public.baby_vaccination_profiles(id) ON DELETE CASCADE,
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_days_before INTEGER DEFAULT 7,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(baby_profile_id)
);

-- Habilitar RLS
ALTER TABLE public.vaccination_reminder_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own reminder settings"
  ON public.vaccination_reminder_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminder settings"
  ON public.vaccination_reminder_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminder settings"
  ON public.vaccination_reminder_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_baby_vaccination_profiles_updated_at
  BEFORE UPDATE ON public.baby_vaccination_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_baby_vaccinations_updated_at
  BEFORE UPDATE ON public.baby_vaccinations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vaccination_reminder_settings_updated_at
  BEFORE UPDATE ON public.vaccination_reminder_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Popular calendário nacional de vacinação
INSERT INTO public.vaccination_calendar (vaccine_name, age_months, dose_number, dose_label, application_type, description, purpose, side_effects, post_vaccine_tips, interval_days, calendar_type) VALUES
  ('BCG', 0, 1, 'Dose única', 'Intradérmica', 'Vacina contra tuberculose', 'Proteção contra formas graves de tuberculose', 'Pequena úlcera no local, que cicatriza em até 3 meses', 'Manter local limpo e seco. Não usar pomadas.', NULL, 'brasil'),
  ('Hepatite B', 0, 1, '1ª dose', 'Intramuscular', 'Vacina contra Hepatite B', 'Proteção contra o vírus da Hepatite B', 'Dor e vermelhidão no local', 'Compressa fria se necessário', 30, 'brasil'),
  
  ('Pentavalente', 2, 1, '1ª dose', 'Intramuscular', 'Protege contra 5 doenças', 'Proteção contra difteria, tétano, coqueluche, Hib e Hepatite B', 'Febre baixa, irritabilidade, dor local', 'Observar febre. Oferecer líquidos.', 60, 'brasil'),
  ('VIP (Poliomielite)', 2, 1, '1ª dose', 'Intramuscular', 'Vacina inativada contra pólio', 'Proteção contra poliomielite', 'Raramente causa reações', 'Manter hidratação', 60, 'brasil'),
  ('Rotavírus', 2, 1, '1ª dose', 'Oral', 'Proteção contra rotavírus', 'Previne diarreia grave por rotavírus', 'Raramente irritabilidade leve', 'Manter amamentação normal', 60, 'brasil'),
  ('Pneumocócica 10V', 2, 1, '1ª dose', 'Intramuscular', 'Proteção contra pneumococo', 'Previne pneumonia, meningite e otite', 'Febre, irritabilidade', 'Observar febre nas primeiras 48h', 60, 'brasil'),
  
  ('Meningocócica C', 3, 1, '1ª dose', 'Intramuscular', 'Proteção contra meningite C', 'Previne meningite meningocócica tipo C', 'Febre, dor local', 'Compressa fria, antitérmico se necessário', 60, 'brasil'),
  
  ('Pentavalente', 4, 2, '2ª dose', 'Intramuscular', 'Protege contra 5 doenças', 'Reforço de proteção', 'Febre baixa, irritabilidade', 'Observar febre. Oferecer líquidos.', 60, 'brasil'),
  ('VIP (Poliomielite)', 4, 2, '2ª dose', 'Intramuscular', 'Vacina inativada contra pólio', 'Reforço de proteção', 'Raramente causa reações', 'Manter hidratação', 60, 'brasil'),
  ('Rotavírus', 4, 2, '2ª dose', 'Oral', 'Proteção contra rotavírus', 'Reforço de proteção', 'Raramente irritabilidade leve', 'Manter amamentação normal', NULL, 'brasil'),
  ('Pneumocócica 10V', 4, 2, '2ª dose', 'Intramuscular', 'Proteção contra pneumococo', 'Reforço de proteção', 'Febre, irritabilidade', 'Observar febre nas primeiras 48h', 60, 'brasil'),
  
  ('Meningocócica C', 5, 2, '2ª dose', 'Intramuscular', 'Proteção contra meningite C', 'Reforço de proteção', 'Febre, dor local', 'Compressa fria, antitérmico se necessário', 210, 'brasil'),
  
  ('Pentavalente', 6, 3, '3ª dose', 'Intramuscular', 'Protege contra 5 doenças', 'Reforço final', 'Febre baixa, irritabilidade', 'Observar febre. Oferecer líquidos.', NULL, 'brasil'),
  ('VIP (Poliomielite)', 6, 3, '3ª dose', 'Intramuscular', 'Vacina inativada contra pólio', 'Reforço final', 'Raramente causa reações', 'Manter hidratação', NULL, 'brasil'),
  ('Hepatite B', 6, 2, '2ª dose', 'Intramuscular', 'Vacina contra Hepatite B', 'Reforço de proteção', 'Dor e vermelhidão no local', 'Compressa fria se necessário', NULL, 'brasil'),
  ('Influenza', 6, 1, '1ª dose', 'Intramuscular', 'Vacina contra gripe', 'Proteção contra vírus Influenza', 'Febre baixa, mal-estar', 'Repouso e hidratação', 30, 'brasil'),
  ('Influenza', 7, 2, '2ª dose', 'Intramuscular', 'Vacina contra gripe', 'Reforço de proteção', 'Febre baixa, mal-estar', 'Repouso e hidratação', NULL, 'brasil'),
  
  ('Febre Amarela', 9, 1, 'Dose única', 'Subcutânea', 'Proteção contra febre amarela', 'Previne febre amarela', 'Febre, dor de cabeça', 'Repouso, hidratação. Evitar sol.', NULL, 'brasil'),
  
  ('Tríplice Viral', 12, 1, '1ª dose', 'Subcutânea', 'Proteção contra sarampo, caxumba e rubéola', 'Previne 3 doenças virais', 'Febre após 7-10 dias, manchas leves', 'Observar febre tardia. Manter hidratação.', 90, 'brasil'),
  ('Pneumocócica 10V', 12, 3, 'Reforço', 'Intramuscular', 'Proteção contra pneumococo', 'Reforço de proteção', 'Febre, irritabilidade', 'Observar febre nas primeiras 48h', NULL, 'brasil'),
  ('Meningocócica C', 12, 3, 'Reforço', 'Intramuscular', 'Proteção contra meningite C', 'Reforço de proteção', 'Febre, dor local', 'Compressa fria, antitérmico se necessário', NULL, 'brasil'),
  
  ('DTP', 15, 1, '1º reforço', 'Intramuscular', 'Tríplice bacteriana', 'Proteção contra difteria, tétano e coqueluche', 'Febre, dor e inchaço local', 'Compressa fria. Antitérmico se necessário.', NULL, 'brasil'),
  ('VOP (Poliomielite)', 15, 1, '1º reforço', 'Oral', 'Vacina oral contra pólio', 'Reforço de proteção', 'Raramente causa reações', 'Evitar vômito 30 min após', NULL, 'brasil'),
  ('Hepatite A', 15, 1, 'Dose única', 'Intramuscular', 'Proteção contra Hepatite A', 'Previne Hepatite A', 'Dor local leve', 'Compressa fria se necessário', NULL, 'brasil'),
  ('Varicela', 15, 1, '1ª dose', 'Subcutânea', 'Proteção contra catapora', 'Previne varicela (catapora)', 'Febre leve, manchas no corpo', 'Observar febre. Evitar coçar.', 90, 'brasil'),
  
  ('DTP', 48, 2, '2º reforço', 'Intramuscular', 'Tríplice bacteriana', 'Reforço de proteção', 'Febre, dor e inchaço local', 'Compressa fria. Antitérmico se necessário.', NULL, 'brasil'),
  ('VOP (Poliomielite)', 48, 2, '2º reforço', 'Oral', 'Vacina oral contra pólio', 'Reforço de proteção', 'Raramente causa reações', 'Evitar vômito 30 min após', NULL, 'brasil'),
  ('Tríplice Viral', 48, 2, '2ª dose', 'Subcutânea', 'Proteção contra sarampo, caxumba e rubéola', 'Reforço de proteção', 'Febre após 7-10 dias, manchas leves', 'Observar febre tardia. Manter hidratação.', NULL, 'brasil'),
  ('Varicela', 48, 2, '2ª dose', 'Subcutânea', 'Proteção contra catapora', 'Reforço de proteção', 'Febre leve, manchas no corpo', 'Observar febre. Evitar coçar.', NULL, 'brasil');

-- Adicionar produto Cartão de Vacinação
INSERT INTO public.products (
  slug,
  title,
  description,
  short_description,
  category,
  is_free,
  price,
  trial_enabled,
  trial_days,
  access_duration_days,
  destination_url,
  is_active,
  display_order
) VALUES (
  'cartao-vacinacao',
  '💉 Cartão de Vacinação Digital do Bebê',
  'Ferramenta interativa que organiza e digitaliza toda a carteirinha de vacinação do bebê, permitindo que a mãe acompanhe datas, doses, lembretes e histórico completo, com interface intuitiva e visual acolhedora. Além de evitar esquecimentos, o sistema envia alertas automáticos, gera relatórios PDF profissionais e permite compartilhar com o pediatra, familiares ou cuidadores.',
  'Organize e digitalize toda a carteirinha de vacinação do bebê com lembretes automáticos e relatórios profissionais.',
  'Saúde & Prevenção',
  false,
  5.90,
  true,
  7,
  365,
  '/materiais/cartao-vacinacao',
  true,
  100
);