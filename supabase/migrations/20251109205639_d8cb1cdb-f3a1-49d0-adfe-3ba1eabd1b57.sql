-- Add notes column to user_favorites table
ALTER TABLE public.user_favorites
ADD COLUMN notes text;

-- Add updated_at column to track when notes are modified
ALTER TABLE public.user_favorites
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- Create trigger to update updated_at
CREATE TRIGGER update_user_favorites_updated_at
BEFORE UPDATE ON public.user_favorites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS policy to allow users to update their own favorites (for notes)
CREATE POLICY "Users can update their own favorites"
ON public.user_favorites
FOR UPDATE
USING (auth.uid() = user_id);