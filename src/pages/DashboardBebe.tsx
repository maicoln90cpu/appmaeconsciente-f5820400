import { lazy, Suspense } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useDashboardBebe } from "@/hooks/useDashboardBebe";
import {
  DashboardBebeHeader,
  DashboardBebeAlerts,
  DashboardBebeKPIs,
  DashboardBebeStats24h,
  DashboardBebeTimeline,
  DashboardBebeQuickActions,
  DashboardBebeTabs
} from "@/components/dashboard-bebe";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load heavy tab components
const GrowthChart = lazy(() => import("@/components/crescimento/GrowthChart").then(m => ({ default: m.GrowthChart })));
const FoodIntroductionDiary = lazy(() => import("@/components/alimentacao-bebe/FoodIntroductionDiary").then(m => ({ default: m.FoodIntroductionDiary })));
const BottleCalculator = lazy(() => import("@/components/alimentacao-bebe/BottleCalculator").then(m => ({ default: m.BottleCalculator })));
const ColicTracker = lazy(() => import("@/components/bebe/ColicTracker").then(m => ({ default: m.ColicTracker })));
const MedicationTimer = lazy(() => import("@/components/bebe/MedicationTimer").then(m => ({ default: m.MedicationTimer })));
const AppointmentOrganizer = lazy(() => import("@/components/bebe/AppointmentOrganizer").then(m => ({ default: m.AppointmentOrganizer })));
const RoutinePlanner = lazy(() => import("@/components/bebe/RoutinePlanner").then(m => ({ default: m.RoutinePlanner })));
const PediatricReportGenerator = lazy(() => import("@/components/bebe/PediatricReportGenerator").then(m => ({ default: m.PediatricReportGenerator })));
const UnifiedCalendar = lazy(() => import("@/components/bebe/UnifiedCalendar").then(m => ({ default: m.UnifiedCalendar })));
const DataExporter = lazy(() => import("@/components/bebe/DataExporter").then(m => ({ default: m.DataExporter })));
const BabySummaryWidget = lazy(() => import("@/components/bebe/BabySummaryWidget").then(m => ({ default: m.BabySummaryWidget })));
const PartnerAccessManager = lazy(() => import("@/components/bebe/PartnerAccessManager").then(m => ({ default: m.PartnerAccessManager })));
const NotificationSettings = lazy(() => import("@/components/bebe/NotificationSettings").then(m => ({ default: m.NotificationSettings })));
const BabyAchievements = lazy(() => import("@/components/bebe/BabyAchievements").then(m => ({ default: m.BabyAchievements })));
const FirstTimesAlbum = lazy(() => import("@/components/bebe/FirstTimesAlbum").then(m => ({ default: m.FirstTimesAlbum })));
const VisualTimeline = lazy(() => import("@/components/bebe/VisualTimeline").then(m => ({ default: m.VisualTimeline })));

// Lightweight loading skeleton for tabs
const TabLoadingSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-48 w-full" />
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  </div>
);

const DashboardBebe = () => {
  const {
    loading,
    lastFeeding,
    lastSleep,
    feedingLogs24h,
    sleepLogs24h,
    alerts,
    selectedBabyId,
    setSelectedBabyId,
    babyProfiles,
    stats
  } = useDashboardBebe();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl">
      <DashboardBebeHeader
        babyProfiles={babyProfiles}
        selectedBabyId={selectedBabyId}
        onBabyChange={setSelectedBabyId}
      />

      <DashboardBebeAlerts alerts={alerts} />

      <Tabs defaultValue="overview" className="space-y-6">
        <DashboardBebeTabs />

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <BabySummaryWidget />
          </Suspense>
          
          <DashboardBebeKPIs 
            lastFeeding={lastFeeding} 
            lastSleep={lastSleep} 
          />
          
          <DashboardBebeStats24h
            feedingCount={feedingLogs24h.length}
            totalFeedingTime={stats.totalFeedingTime}
            sleepCount={sleepLogs24h.length}
            totalSleepTime={stats.totalSleepTime}
            averageSleepDuration={stats.averageSleepDuration}
          />
          
          <DashboardBebeTimeline 
            feedingLogs={feedingLogs24h} 
            sleepLogs={sleepLogs24h} 
          />
          
          <DashboardBebeQuickActions />
        </TabsContent>

        {/* Growth Tab */}
        <TabsContent value="growth">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <GrowthChart babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        {/* Food Introduction Tab */}
        <TabsContent value="food">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <FoodIntroductionDiary babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        {/* Bottle Calculator Tab */}
        <TabsContent value="bottle">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <BottleCalculator babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        {/* Colic Tracker Tab */}
        <TabsContent value="colic">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <ColicTracker babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <MedicationTimer babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <AppointmentOrganizer babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        {/* Routine Tab */}
        <TabsContent value="routine">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <RoutinePlanner babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        {/* Unified Calendar Tab */}
        <TabsContent value="calendar">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <UnifiedCalendar babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        {/* Pediatric Report Tab */}
        <TabsContent value="report">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <PediatricReportGenerator babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        {/* Data Export Tab */}
        <TabsContent value="export">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <DataExporter babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        {/* Partner Access Tab */}
        <TabsContent value="partner">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <PartnerAccessManager />
          </Suspense>
        </TabsContent>

        {/* Notification Settings Tab */}
        <TabsContent value="notifications">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <NotificationSettings />
          </Suspense>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <BabyAchievements babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        {/* First Times Album Tab */}
        <TabsContent value="firsts">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <FirstTimesAlbum babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        {/* Visual Timeline Tab */}
        <TabsContent value="timeline">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <VisualTimeline babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardBebe;
