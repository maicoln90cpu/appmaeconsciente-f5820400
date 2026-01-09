import { Tabs, TabsContent } from "@/components/ui/tabs";
import { GrowthChart } from "@/components/crescimento/GrowthChart";
import { FoodIntroductionDiary } from "@/components/alimentacao-bebe/FoodIntroductionDiary";
import { BottleCalculator } from "@/components/alimentacao-bebe/BottleCalculator";
import { ColicTracker } from "@/components/bebe/ColicTracker";
import { MedicationTimer } from "@/components/bebe/MedicationTimer";
import { AppointmentOrganizer } from "@/components/bebe/AppointmentOrganizer";
import { RoutinePlanner } from "@/components/bebe/RoutinePlanner";
import { PediatricReportGenerator } from "@/components/bebe/PediatricReportGenerator";
import { UnifiedCalendar } from "@/components/bebe/UnifiedCalendar";
import { DataExporter } from "@/components/bebe/DataExporter";
import { BabySummaryWidget } from "@/components/bebe/BabySummaryWidget";
import { PartnerAccessManager } from "@/components/bebe/PartnerAccessManager";
import { NotificationSettings } from "@/components/bebe/NotificationSettings";
import { BabyAchievements } from "@/components/bebe/BabyAchievements";
import { FirstTimesAlbum } from "@/components/bebe/FirstTimesAlbum";
import { VisualTimeline } from "@/components/bebe/VisualTimeline";
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
          <BabySummaryWidget />
          
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
          <GrowthChart babyProfileId={selectedBabyId} />
        </TabsContent>

        {/* Food Introduction Tab */}
        <TabsContent value="food">
          <FoodIntroductionDiary babyProfileId={selectedBabyId} />
        </TabsContent>

        {/* Bottle Calculator Tab */}
        <TabsContent value="bottle">
          <BottleCalculator babyProfileId={selectedBabyId} />
        </TabsContent>

        {/* Colic Tracker Tab */}
        <TabsContent value="colic">
          <ColicTracker babyProfileId={selectedBabyId} />
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications">
          <MedicationTimer babyProfileId={selectedBabyId} />
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <AppointmentOrganizer babyProfileId={selectedBabyId} />
        </TabsContent>

        {/* Routine Tab */}
        <TabsContent value="routine">
          <RoutinePlanner babyProfileId={selectedBabyId} />
        </TabsContent>

        {/* Unified Calendar Tab */}
        <TabsContent value="calendar">
          <UnifiedCalendar babyProfileId={selectedBabyId} />
        </TabsContent>

        {/* Pediatric Report Tab */}
        <TabsContent value="report">
          <PediatricReportGenerator babyProfileId={selectedBabyId} />
        </TabsContent>

        {/* Data Export Tab */}
        <TabsContent value="export">
          <DataExporter babyProfileId={selectedBabyId} />
        </TabsContent>

        {/* Partner Access Tab */}
        <TabsContent value="partner">
          <PartnerAccessManager />
        </TabsContent>

        {/* Notification Settings Tab */}
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <BabyAchievements babyProfileId={selectedBabyId} />
        </TabsContent>

        {/* First Times Album Tab */}
        <TabsContent value="firsts">
          <FirstTimesAlbum babyProfileId={selectedBabyId} />
        </TabsContent>

        {/* Visual Timeline Tab */}
        <TabsContent value="timeline">
          <VisualTimeline babyProfileId={selectedBabyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardBebe;
