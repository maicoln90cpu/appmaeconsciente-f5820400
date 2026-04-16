import {
  LevelProgress,
  DailyLoginTracker,
  WeeklyGoalCard,
  ActivityCalendar,
} from '@/components/gamification';

import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';

export const DashboardBebeGamification = () => {
  const { badgesEnabled, loading } = useFeatureFlags();

  if (loading || !badgesEnabled) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <LevelProgress />
      <DailyLoginTracker />
      <WeeklyGoalCard />
      <ActivityCalendar />
    </div>
  );
};
