import { LevelProgress, DailyLoginTracker, WeeklyGoalCard, ActivityCalendar } from "@/components/gamification";

export const DashboardBebeGamification = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <LevelProgress />
      <DailyLoginTracker />
      <WeeklyGoalCard />
      <ActivityCalendar />
    </div>
  );
};
