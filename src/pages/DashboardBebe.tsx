import { lazy, Suspense, useEffect, useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useDashboardBebe } from "@/hooks/useDashboardBebe";
import { useProfile } from "@/hooks/useProfile";
import {
  DashboardBebeHeader,
  DashboardBebeAlerts,
  DashboardBebeKPIs,
  DashboardBebeStats24h,
  DashboardBebeTimeline,
  DashboardBebeQuickActions,
  DashboardBebeTabs,
  DashboardBebeUpcomingEvents,
  DashboardBebeRecentActivity,
  DashboardBebeGamification,
} from "@/components/dashboard-bebe";
import { ContextCards } from "@/components/dashboard-bebe/ContextCards";
import { OnboardingWizard, OnboardingChecklist } from "@/components/onboarding";
import { PhaseSelectionModal } from "@/components/onboarding/PhaseSelectionModal";
import { ActionableInsights, CrossModuleInsights } from "@/components/insights";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles } from "lucide-react";

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
const JaundiceMonitor = lazy(() => import("@/components/bebe/JaundiceMonitor").then(m => ({ default: m.JaundiceMonitor })));
const MomWellnessDiary = lazy(() => import("@/components/bebe/MomWellnessDiary").then(m => ({ default: m.MomWellnessDiary })));
const TeethTracker = lazy(() => import("@/components/bebe/TeethTracker").then(m => ({ default: m.TeethTracker })));
const StimulationBank = lazy(() => import("@/components/bebe/StimulationBank").then(m => ({ default: m.StimulationBank })));
const AllergyDiary = lazy(() => import("@/components/bebe/AllergyDiary").then(m => ({ default: m.AllergyDiary })));

const DAILY_TIPS = [
  "Beba pelo menos 2 litros de água por dia para manter-se hidratada! 💧",
  "Descanse sempre que possível - seu corpo está trabalhando duro! 😴",
  "Movimente-se com caminhadas leves para melhorar a circulação 🚶‍♀️",
  "Alimentos ricos em ferro ajudam a prevenir anemia na gestação 🥬",
  "Converse com seu bebê - ele já consegue ouvir sua voz! 💕",
  "Pratique exercícios de respiração para relaxar 🧘‍♀️",
  "Registre os movimentos do bebê - é importante para o acompanhamento 📝",
];

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
  const { profile } = useProfile();
  const [showWizard, setShowWizard] = useState(false);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [dailyTip] = useState(() => DAILY_TIPS[Math.floor(Math.random() * DAILY_TIPS.length)]);

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

  // Show onboarding wizard for new users
  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      const dismissed = localStorage.getItem("onboarding_wizard_dismissed");
      if (!dismissed) setShowWizard(true);
    }
  }, [profile]);

  // Show phase selection if not set
  useEffect(() => {
    if (profile && !profile.fase_maternidade && profile.onboarding_completed) {
      const dismissed = localStorage.getItem("phase_selection_dismissed");
      if (!dismissed) setShowPhaseModal(true);
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container py-4 sm:py-6 md:py-8 max-w-6xl space-y-4 sm:space-y-6">
      {/* Onboarding */}
      <OnboardingWizard open={showWizard} onClose={() => { setShowWizard(false); localStorage.setItem("onboarding_wizard_dismissed", "true"); }} />

      {/* Phase selection */}
      <PhaseSelectionModal open={showPhaseModal} onOpenChange={(open) => { setShowPhaseModal(open); if (!open) localStorage.setItem("phase_selection_dismissed", "true"); }} />

      {/* Greeting + Baby Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            Olá, {profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Mamãe'}! 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <DashboardBebeHeader
          babyProfiles={babyProfiles}
          selectedBabyId={selectedBabyId}
          onBabyChange={setSelectedBabyId}
        />
      </div>

      {/* Onboarding checklist */}
      {profile && !profile.onboarding_completed && <OnboardingChecklist />}

      {/* Context cards (dynamic, phase-aware) */}
      <ContextCards />

      {/* Alerts */}
      <DashboardBebeAlerts alerts={alerts} />

      {/* Gamification row - hidden in simple mode */}
      {!profile?.simple_mode && <DashboardBebeGamification />}

      {/* Main tabbed content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <DashboardBebeTabs />

        {/* Overview Tab - the merged "home" */}
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

          <DashboardBebeQuickActions />
          
          {/* Events + Activity side by side */}
          <div className="grid gap-4 md:grid-cols-2">
            <DashboardBebeUpcomingEvents />
            <DashboardBebeRecentActivity />
          </div>

          {/* Insights - hidden in simple mode */}
          {!profile?.simple_mode && (
            <div className="grid gap-4 md:grid-cols-2">
              <ActionableInsights maxItems={4} />
              <CrossModuleInsights />
            </div>
          )}
          
          <DashboardBebeTimeline 
            feedingLogs={feedingLogs24h} 
            sleepLogs={sleepLogs24h} 
          />
        </TabsContent>

        {/* Saúde group */}
        <TabsContent value="growth">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <GrowthChart babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="colic">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <ColicTracker babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="medications">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <MedicationTimer babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="jaundice">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <JaundiceMonitor babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="wellness">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <MomWellnessDiary />
          </Suspense>
        </TabsContent>

        {/* Alimentação group */}
        <TabsContent value="food">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <FoodIntroductionDiary babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="bottle">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <BottleCalculator babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        {/* Rotina group */}
        <TabsContent value="appointments">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <AppointmentOrganizer babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="routine">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <RoutinePlanner babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="calendar">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <UnifiedCalendar babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        {/* Mais group */}
        <TabsContent value="report">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <PediatricReportGenerator babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="export">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <DataExporter babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="partner">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <PartnerAccessManager />
          </Suspense>
        </TabsContent>

        <TabsContent value="notifications">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <NotificationSettings />
          </Suspense>
        </TabsContent>

        <TabsContent value="achievements">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <BabyAchievements babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="firsts">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <FirstTimesAlbum babyProfileId={selectedBabyId} />
          </Suspense>
        </TabsContent>

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
