-- Tabela para rastreamento de cólicas do bebê
CREATE TABLE public.baby_colic_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  baby_profile_id UUID REFERENCES public.baby_vaccination_profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5),
  triggers TEXT[] DEFAULT '{}',
  relief_methods TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para medicamentos do bebê
CREATE TABLE public.baby_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  baby_profile_id UUID REFERENCES public.baby_vaccination_profiles(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  times_per_day INTEGER DEFAULT 1,
  time_of_day TEXT[] DEFAULT '{}',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para logs de medicamentos do bebê
CREATE TABLE public.baby_medication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medication_id UUID NOT NULL REFERENCES public.baby_medications(id) ON DELETE CASCADE,
  given_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dosage_given TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para consultas do bebê
CREATE TABLE public.baby_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  baby_profile_id UUID REFERENCES public.baby_vaccination_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  appointment_type TEXT NOT NULL DEFAULT 'pediatra',
  doctor_name TEXT,
  location TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_minutes INTEGER DEFAULT 30,
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para rotinas do bebê
CREATE TABLE public.baby_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  baby_profile_id UUID REFERENCES public.baby_vaccination_profiles(id) ON DELETE CASCADE,
  routine_type TEXT NOT NULL,
  title TEXT NOT NULL,
  scheduled_time TIME NOT NULL,
  days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
  duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para logs de rotinas do bebê
CREATE TABLE public.baby_routine_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  routine_id UUID NOT NULL REFERENCES public.baby_routines(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  actual_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.baby_colic_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_routine_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for baby_colic_logs
CREATE POLICY "Users can view their own colic logs" ON public.baby_colic_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own colic logs" ON public.baby_colic_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own colic logs" ON public.baby_colic_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own colic logs" ON public.baby_colic_logs FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for baby_medications
CREATE POLICY "Users can view their own baby medications" ON public.baby_medications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own baby medications" ON public.baby_medications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own baby medications" ON public.baby_medications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own baby medications" ON public.baby_medications FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for baby_medication_logs
CREATE POLICY "Users can view their own baby medication logs" ON public.baby_medication_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own baby medication logs" ON public.baby_medication_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own baby medication logs" ON public.baby_medication_logs FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for baby_appointments
CREATE POLICY "Users can view their own baby appointments" ON public.baby_appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own baby appointments" ON public.baby_appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own baby appointments" ON public.baby_appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own baby appointments" ON public.baby_appointments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for baby_routines
CREATE POLICY "Users can view their own baby routines" ON public.baby_routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own baby routines" ON public.baby_routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own baby routines" ON public.baby_routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own baby routines" ON public.baby_routines FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for baby_routine_logs
CREATE POLICY "Users can view their own baby routine logs" ON public.baby_routine_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own baby routine logs" ON public.baby_routine_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own baby routine logs" ON public.baby_routine_logs FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_baby_colic_logs_updated_at BEFORE UPDATE ON public.baby_colic_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_baby_medications_updated_at BEFORE UPDATE ON public.baby_medications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_baby_appointments_updated_at BEFORE UPDATE ON public.baby_appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_baby_routines_updated_at BEFORE UPDATE ON public.baby_routines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();