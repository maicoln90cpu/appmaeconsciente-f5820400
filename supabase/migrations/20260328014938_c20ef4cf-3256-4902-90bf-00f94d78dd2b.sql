ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT false;

-- Mark existing virtual users
UPDATE public.profiles SET is_virtual = true WHERE email LIKE '%@maes.virtual%';