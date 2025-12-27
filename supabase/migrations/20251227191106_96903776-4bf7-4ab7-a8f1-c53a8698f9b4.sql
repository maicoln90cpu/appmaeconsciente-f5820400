-- Function to get last activity dates for multiple users in batch
-- This replaces the N+1 query pattern in UserManagement
CREATE OR REPLACE FUNCTION public.get_user_last_activities(user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  last_activity timestamptz,
  has_used_tools boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_activities AS (
    SELECT 
      u.id as uid,
      GREATEST(
        (SELECT MAX(created_at) FROM baby_feeding_logs WHERE baby_feeding_logs.user_id = u.id),
        (SELECT MAX(created_at) FROM baby_sleep_logs WHERE baby_sleep_logs.user_id = u.id),
        (SELECT MAX(created_at) FROM itens_enxoval WHERE itens_enxoval.user_id = u.id)
      ) as last_act
    FROM unnest(user_ids) as u(id)
  )
  SELECT 
    ua.uid as user_id,
    ua.last_act as last_activity,
    (ua.last_act IS NOT NULL) as has_used_tools
  FROM user_activities ua;
END;
$$;

-- Add composite indexes for common user activity queries
CREATE INDEX IF NOT EXISTS idx_baby_feeding_logs_user_created 
ON baby_feeding_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_baby_sleep_logs_user_created 
ON baby_sleep_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_itens_enxoval_user_created 
ON itens_enxoval(user_id, created_at DESC);

-- Add index for posts query optimization
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc 
ON posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_user 
ON post_likes(post_id, user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post 
ON post_comments(post_id);