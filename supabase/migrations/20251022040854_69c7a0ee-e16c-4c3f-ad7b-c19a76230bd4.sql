-- Create tool_suggestions table
CREATE TABLE IF NOT EXISTS public.tool_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  main_idea TEXT NOT NULL,
  problem_solved TEXT,
  main_functions TEXT NOT NULL,
  integrations TEXT[] DEFAULT '{}',
  phases TEXT[] DEFAULT '{}',
  target_audience TEXT,
  priority_rating INTEGER DEFAULT 3,
  reference_examples TEXT,
  available_for_beta BOOLEAN DEFAULT false,
  contact_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_feedback TEXT,
  reward_granted BOOLEAN DEFAULT false,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add columns to support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS ticket_type TEXT DEFAULT 'support',
ADD COLUMN IF NOT EXISTS related_suggestion_id UUID REFERENCES public.tool_suggestions(id);

-- Enable RLS
ALTER TABLE public.tool_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tool_suggestions
CREATE POLICY "Users can view their own suggestions"
ON public.tool_suggestions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own suggestions"
ON public.tool_suggestions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestions"
ON public.tool_suggestions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all suggestions"
ON public.tool_suggestions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all suggestions"
ON public.tool_suggestions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tool_suggestions_user_id ON public.tool_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_suggestions_status ON public.tool_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_tool_suggestions_created_at ON public.tool_suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_type ON public.support_tickets(ticket_type);

-- Create trigger for updated_at
CREATE TRIGGER update_tool_suggestions_updated_at
BEFORE UPDATE ON public.tool_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();