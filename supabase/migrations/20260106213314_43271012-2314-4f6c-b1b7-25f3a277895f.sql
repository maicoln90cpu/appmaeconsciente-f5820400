-- Create partner_access table for baby dashboard sharing
CREATE TABLE IF NOT EXISTS public.partner_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  partner_email TEXT NOT NULL,
  access_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN DEFAULT true,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_accessed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_access ENABLE ROW LEVEL SECURITY;

-- Policies for partner_access
CREATE POLICY "Users can view their own partner accesses"
  ON public.partner_access FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create partner accesses"
  ON public.partner_access FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own partner accesses"
  ON public.partner_access FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own partner accesses"
  ON public.partner_access FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_partner_access_updated_at
  BEFORE UPDATE ON public.partner_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create push_notification_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_notification_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own subscriptions"
  ON public.push_notification_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_notification_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();