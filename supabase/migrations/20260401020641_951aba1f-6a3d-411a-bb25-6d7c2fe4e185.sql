
-- Drop the old permissive SELECT policy
DROP POLICY IF EXISTS "Anyone authenticated can view posts" ON public.posts;

-- Create a new policy that filters hidden posts
CREATE POLICY "Authenticated users can view non-hidden posts"
ON public.posts
FOR SELECT
TO authenticated
USING (is_hidden IS NOT TRUE);
