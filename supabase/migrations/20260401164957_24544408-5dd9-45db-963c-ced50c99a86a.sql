
-- Tabela: Checklist de Documentos do Bebê
CREATE TABLE public.baby_documents_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  document_label TEXT NOT NULL,
  description TEXT,
  deadline_info TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.baby_documents_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents checklist"
  ON public.baby_documents_checklist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents checklist"
  ON public.baby_documents_checklist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents checklist"
  ON public.baby_documents_checklist FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents checklist"
  ON public.baby_documents_checklist FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_baby_documents_checklist_updated_at
  BEFORE UPDATE ON public.baby_documents_checklist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela: Checklist do Quartinho do Bebê
CREATE TABLE public.baby_room_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  priority TEXT DEFAULT 'medium',
  is_custom BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.baby_room_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own room checklist"
  ON public.baby_room_checklist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own room checklist"
  ON public.baby_room_checklist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own room checklist"
  ON public.baby_room_checklist FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own room checklist"
  ON public.baby_room_checklist FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_baby_room_checklist_updated_at
  BEFORE UPDATE ON public.baby_room_checklist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
