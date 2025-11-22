-- Add database indexes to improve query performance

-- Index for posts ordering by created_at (most common query)
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Index for post_likes queries (count and user checks)
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post ON public.post_likes(user_id, post_id);

-- Index for post_comments queries (count)
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);

-- Index for profiles lookup by user_id
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Index for baby_feeding_logs queries
CREATE INDEX IF NOT EXISTS idx_baby_feeding_logs_user_start ON public.baby_feeding_logs(user_id, start_time DESC);

-- Index for baby_sleep_logs queries
CREATE INDEX IF NOT EXISTS idx_baby_sleep_logs_user_start ON public.baby_sleep_logs(user_id, sleep_start DESC);

-- Index for baby_milestone_records queries
CREATE INDEX IF NOT EXISTS idx_baby_milestone_records_profile ON public.baby_milestone_records(baby_profile_id, status);

-- Index for itens_enxoval queries
CREATE INDEX IF NOT EXISTS idx_itens_enxoval_user_status ON public.itens_enxoval(user_id, status);

-- Index for vaccination queries
CREATE INDEX IF NOT EXISTS idx_baby_vaccinations_profile ON public.baby_vaccinations(baby_profile_id, application_date DESC);

-- Index for postpartum symptoms queries
CREATE INDEX IF NOT EXISTS idx_postpartum_symptoms_user_date ON public.postpartum_symptoms(user_id, date DESC);

-- Index for medication logs queries
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_time ON public.medication_logs(user_id, taken_at DESC);

-- Composite index for development milestones with area filtering
CREATE INDEX IF NOT EXISTS idx_milestone_types_area_age ON public.development_milestone_types(area, age_min_months, age_max_months) WHERE is_active = true;