-- =====================================================
-- PACKAGE 9: Database Indexes for Performance Optimization
-- Creates indexes on frequently queried columns to improve query performance
-- =====================================================

-- =====================================================
-- 1. POSTS TABLE INDEXES (Community/Feed queries)
-- =====================================================

-- Index for fetching posts ordered by creation date (feed pagination)
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc 
ON public.posts (created_at DESC);

-- Index for filtering posts by categoria (correct column name)
CREATE INDEX IF NOT EXISTS idx_posts_categoria 
ON public.posts (categoria);

-- Index for filtering posts by author
CREATE INDEX IF NOT EXISTS idx_posts_user_id 
ON public.posts (user_id, created_at DESC);

-- =====================================================
-- 2. BABY FEEDING LOGS INDEXES
-- =====================================================

-- Index for user's feeding logs ordered by time
CREATE INDEX IF NOT EXISTS idx_baby_feeding_logs_user_time 
ON public.baby_feeding_logs (user_id, start_time DESC);

-- Index for feeding type statistics
CREATE INDEX IF NOT EXISTS idx_baby_feeding_logs_type 
ON public.baby_feeding_logs (feeding_type, user_id);

-- =====================================================
-- 3. BABY SLEEP LOGS INDEXES  
-- =====================================================

-- Index for user's sleep logs ordered by time
CREATE INDEX IF NOT EXISTS idx_baby_sleep_logs_user_time 
ON public.baby_sleep_logs (user_id, sleep_start DESC);

-- Index for sleep type analysis
CREATE INDEX IF NOT EXISTS idx_baby_sleep_logs_type 
ON public.baby_sleep_logs (sleep_type, user_id);

-- =====================================================
-- 4. BABY VACCINATIONS INDEXES
-- =====================================================

-- Index for baby profile vaccinations
CREATE INDEX IF NOT EXISTS idx_baby_vaccinations_profile 
ON public.baby_vaccinations (baby_profile_id, application_date DESC);

-- Index for user vaccinations
CREATE INDEX IF NOT EXISTS idx_baby_vaccinations_user 
ON public.baby_vaccinations (user_id);

-- =====================================================
-- 5. DEVELOPMENT MILESTONES INDEXES
-- =====================================================

-- Index for milestone records by baby profile
CREATE INDEX IF NOT EXISTS idx_baby_milestone_records_profile 
ON public.baby_milestone_records (baby_profile_id, status);

-- Index for milestone types by age range (for filtering)
CREATE INDEX IF NOT EXISTS idx_development_milestone_types_age 
ON public.development_milestone_types (age_min_months, age_max_months);

-- Index for milestone types by area
CREATE INDEX IF NOT EXISTS idx_development_milestone_types_area 
ON public.development_milestone_types (area);

-- =====================================================
-- 6. ENXOVAL ITEMS INDEXES
-- =====================================================

-- Index for user's enxoval items by status
CREATE INDEX IF NOT EXISTS idx_itens_enxoval_user_status 
ON public.itens_enxoval (user_id, status);

-- Index for enxoval items by category
CREATE INDEX IF NOT EXISTS idx_itens_enxoval_category 
ON public.itens_enxoval (categoria, user_id);

-- Index for exchange date alerts
CREATE INDEX IF NOT EXISTS idx_itens_enxoval_exchange_date 
ON public.itens_enxoval (data_limite_troca) 
WHERE data_limite_troca IS NOT NULL;

-- =====================================================
-- 7. COMMENTS/INTERACTIONS INDEXES
-- =====================================================

-- Index for post comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post 
ON public.post_comments (post_id, created_at DESC);

-- Index for post likes
CREATE INDEX IF NOT EXISTS idx_post_likes_post 
ON public.post_likes (post_id);

-- Index for user follows
CREATE INDEX IF NOT EXISTS idx_user_follows_follower 
ON public.user_follows (follower_id);

CREATE INDEX IF NOT EXISTS idx_user_follows_following 
ON public.user_follows (following_id);

-- =====================================================
-- 8. GAMIFICATION INDEXES
-- =====================================================

-- Index for user badges (correct column name: unlocked_at)
CREATE INDEX IF NOT EXISTS idx_user_badges_user 
ON public.user_badges (user_id, unlocked_at DESC);

-- Index for daily activity
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date 
ON public.daily_activity (user_id, activity_date DESC);

-- =====================================================
-- 9. APPOINTMENTS AND MEDICATIONS INDEXES
-- =====================================================

-- Index for baby appointments by date
CREATE INDEX IF NOT EXISTS idx_baby_appointments_user_date 
ON public.baby_appointments (user_id, scheduled_date);

-- Index for active baby medications
CREATE INDEX IF NOT EXISTS idx_baby_medications_user_active 
ON public.baby_medications (user_id, is_active) 
WHERE is_active = true;

-- =====================================================
-- 10. PROFILES AND AUTH INDEXES
-- =====================================================

-- Index for profile email lookups (commonly used in admin)
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON public.profiles (email);

-- Index for user roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user 
ON public.user_roles (user_id);

-- =====================================================
-- 11. PRODUCT ACCESS INDEXES
-- =====================================================

-- Index for checking user product access
CREATE INDEX IF NOT EXISTS idx_user_product_access_user 
ON public.user_product_access (user_id, product_id);

-- Index for expiring access alerts
CREATE INDEX IF NOT EXISTS idx_user_product_access_expires 
ON public.user_product_access (expires_at) 
WHERE expires_at IS NOT NULL;

-- =====================================================
-- 12. MATERNITY BAG INDEXES (corrected column: checked instead of is_packed)
-- =====================================================

-- Index for maternity bag items
CREATE INDEX IF NOT EXISTS idx_maternity_bag_items_user 
ON public.maternity_bag_items (user_id, checked);

-- =====================================================
-- 13. GROWTH MEASUREMENTS INDEXES
-- =====================================================

-- Index for growth measurements by baby profile
CREATE INDEX IF NOT EXISTS idx_growth_measurements_profile 
ON public.growth_measurements (baby_profile_id, measurement_date DESC);

-- =====================================================
-- 14. POSTPARTUM RECOVERY INDEXES
-- =====================================================

-- Index for emotional logs
CREATE INDEX IF NOT EXISTS idx_emotional_logs_user_date 
ON public.emotional_logs (user_id, date DESC);

-- Index for postpartum symptoms
CREATE INDEX IF NOT EXISTS idx_postpartum_symptoms_user_date 
ON public.postpartum_symptoms (user_id, date DESC);

-- =====================================================
-- 15. CONTRACTIONS INDEXES
-- =====================================================

-- Index for contraction logs
CREATE INDEX IF NOT EXISTS idx_contraction_logs_user_time 
ON public.contraction_logs (user_id, start_time DESC);

-- =====================================================
-- 16. BABY TIMELINE EVENTS
-- =====================================================

-- Index for timeline events by baby profile
CREATE INDEX IF NOT EXISTS idx_baby_timeline_events_profile 
ON public.baby_timeline_events (baby_profile_id, event_date DESC);

-- =====================================================
-- ANALYZE tables to update statistics after index creation
-- =====================================================
ANALYZE public.posts;
ANALYZE public.baby_feeding_logs;
ANALYZE public.baby_sleep_logs;
ANALYZE public.baby_vaccinations;
ANALYZE public.baby_milestone_records;
ANALYZE public.itens_enxoval;
ANALYZE public.post_comments;
ANALYZE public.daily_activity;
ANALYZE public.profiles;