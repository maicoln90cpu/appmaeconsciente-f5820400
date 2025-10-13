-- Fix RLS policy violation on user_product_access table
-- The admin policy needs both USING and WITH CHECK clauses for INSERT operations

DROP POLICY IF EXISTS "Admins can manage all access" ON user_product_access;

CREATE POLICY "Admins can manage all access" 
ON user_product_access
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add rate limiting trigger for posts to prevent spam
CREATE OR REPLACE FUNCTION check_post_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM posts
    WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '1 minute'
  ) THEN
    RAISE EXCEPTION 'Aguarde antes de postar novamente';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_rate_limit_trigger
BEFORE INSERT ON posts
FOR EACH ROW
EXECUTE FUNCTION check_post_rate_limit();

-- Add database constraint for post content length
ALTER TABLE posts 
ADD CONSTRAINT content_length_check 
CHECK (length(content) <= 5000 AND length(content) > 0);