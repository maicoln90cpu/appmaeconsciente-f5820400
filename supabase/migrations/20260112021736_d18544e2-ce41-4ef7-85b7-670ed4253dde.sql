-- Índices para posts (comunidade)
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Índices para itens_enxoval
CREATE INDEX IF NOT EXISTS idx_itens_enxoval_user_id ON public.itens_enxoval(user_id);
CREATE INDEX IF NOT EXISTS idx_itens_enxoval_categoria ON public.itens_enxoval(categoria);

-- Índices para baby_vaccinations
CREATE INDEX IF NOT EXISTS idx_baby_vaccinations_user_id ON public.baby_vaccinations(user_id);
CREATE INDEX IF NOT EXISTS idx_baby_vaccinations_baby_profile ON public.baby_vaccinations(baby_profile_id);

-- Índices para baby_vaccination_profiles
CREATE INDEX IF NOT EXISTS idx_baby_vaccination_profiles_user_id ON public.baby_vaccination_profiles(user_id);

-- Índices para daily_activity (gamificação)
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_id ON public.daily_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_date ON public.daily_activity(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON public.daily_activity(user_id, activity_date DESC);

-- Índices para user_badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Índices para user_notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON public.user_notifications(user_id, is_read);

-- Índices para baby_milestone_records
CREATE INDEX IF NOT EXISTS idx_baby_milestone_records_user_id ON public.baby_milestone_records(user_id);
CREATE INDEX IF NOT EXISTS idx_baby_milestone_records_baby_profile ON public.baby_milestone_records(baby_profile_id);

-- Índices para profiles (busca por email e level)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON public.profiles(level DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles(xp_total DESC);

-- Índices para post_comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);

-- Índices para post_likes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

-- Índices para baby_appointments
CREATE INDEX IF NOT EXISTS idx_baby_appointments_user_id ON public.baby_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_baby_appointments_scheduled ON public.baby_appointments(scheduled_date);

-- Índices para baby_colic_logs
CREATE INDEX IF NOT EXISTS idx_baby_colic_logs_user_id ON public.baby_colic_logs(user_id);

-- Índices para baby_medications
CREATE INDEX IF NOT EXISTS idx_baby_medications_user_id ON public.baby_medications(user_id);

-- Índices para baby_routines
CREATE INDEX IF NOT EXISTS idx_baby_routines_user_id ON public.baby_routines(user_id);

-- Índices para baby_first_times
CREATE INDEX IF NOT EXISTS idx_baby_first_times_user_id ON public.baby_first_times(user_id);

-- Índices para baby_timeline_events
CREATE INDEX IF NOT EXISTS idx_baby_timeline_events_user_id ON public.baby_timeline_events(user_id);
CREATE INDEX IF NOT EXISTS idx_baby_timeline_events_date ON public.baby_timeline_events(event_date DESC);

-- Índices para contraction_logs
CREATE INDEX IF NOT EXISTS idx_contraction_logs_user_id ON public.contraction_logs(user_id);

-- Índices para emotional_logs
CREATE INDEX IF NOT EXISTS idx_emotional_logs_user_id ON public.emotional_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_logs_date ON public.emotional_logs(date DESC);

-- Índices para food_introduction_log
CREATE INDEX IF NOT EXISTS idx_food_introduction_log_user_id ON public.food_introduction_log(user_id);

-- Índices para growth_measurements
CREATE INDEX IF NOT EXISTS idx_growth_measurements_user_id ON public.growth_measurements(user_id);

-- Índices para maternity_bag_items
CREATE INDEX IF NOT EXISTS idx_maternity_bag_items_user_id ON public.maternity_bag_items(user_id);

-- Índices para user_streaks
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.user_streaks(user_id);

-- Índices para user_challenges
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON public.user_challenges(user_id);

-- Índices para breast_milk_storage
CREATE INDEX IF NOT EXISTS idx_breast_milk_storage_user_id ON public.breast_milk_storage(user_id);

-- Índices para body_image_log
CREATE INDEX IF NOT EXISTS idx_body_image_log_user_id ON public.body_image_log(user_id);

-- Índices para baby_achievements
CREATE INDEX IF NOT EXISTS idx_baby_achievements_user_id ON public.baby_achievements(user_id);