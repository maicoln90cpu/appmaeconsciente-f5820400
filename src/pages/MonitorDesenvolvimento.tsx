import { useState, useEffect } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfiguracoesAlertas } from "@/components/desenvolvimento/ConfiguracoesAlertas";
import { DashboardDesenvolvimento } from "@/components/desenvolvimento/DashboardDesenvolvimento";
import { LinhaTempoMarcos } from "@/components/desenvolvimento/LinhaTempoMarcos";
import { MarcosAtencao } from "@/components/desenvolvimento/MarcosAtencao";
import { MilestoneDetailDialog } from "@/components/desenvolvimento/MilestoneDetailDialog";
import { OnboardingMonitor } from "@/components/desenvolvimento/OnboardingMonitor";
import { RegistroRapidoMarcos } from "@/components/desenvolvimento/RegistroRapidoMarcos";

import { useDevelopmentMilestones } from "@/hooks/useDevelopmentMilestones";
import { useVaccination } from "@/hooks/useVaccination";

import { logger } from "@/lib/logger";

import { Plus, Baby, AlertCircle, HelpCircle } from "lucide-react";

import type { BabyMilestoneRecord, DevelopmentAlertSettings } from "@/types/development";

const MonitorDesenvolvimento = () => {
  const { profiles, currentProfile } = useVaccination();
  const { 
    records, 
    summary, 
    loading, 
    markAsAchieved,
    updateRecord,
    milestoneTypes,
    getAttentionMilestones
  } = useDevelopmentMilestones(currentProfile?.id || null);

  const [selectedMilestone, setSelectedMilestone] = useState<BabyMilestoneRecord | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [alertSettings, setAlertSettings] = useState<DevelopmentAlertSettings | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const attentionMilestones = getAttentionMilestones();

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('monitor-desenvolvimento-onboarding');
    if (!hasSeenOnboarding && currentProfile) {
      setShowOnboarding(true);
    }
    // Load saved alert settings
    if (currentProfile) {
      const storageKey = `dev_alert_settings_${currentProfile.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setAlertSettings(JSON.parse(saved));
        } catch {}
      }
    }
  }, [currentProfile]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('monitor-desenvolvimento-onboarding', 'true');
    setShowOnboarding(false);
  };

  const handleMilestoneClick = (record: BabyMilestoneRecord) => {
    setSelectedMilestone(record);
    setShowDetailDialog(true);
  };

  const handleQuickRegister = async (milestoneIds: string[], date: Date) => {
    for (const id of milestoneIds) {
      await markAsAchieved(id, date);
    }
  };

  const handleMarkAsDoubt = (recordId: string) => {
    updateRecord(recordId, { status: 'doubt' });
  };

  const handleSaveAlertSettings = (settings: Partial<DevelopmentAlertSettings>) => {
    const storageKey = `dev_alert_settings_${currentProfile?.id}`;
    const current = alertSettings || {};
    const merged = { ...current, ...settings };
    setAlertSettings(merged as DevelopmentAlertSettings);
    localStorage.setItem(storageKey, JSON.stringify(merged));
    logger.debug('Alert settings saved', { data: merged });
  };

  if (!currentProfile) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert>
          <Baby className="h-4 w-4" />
          <AlertDescription>
            Você precisa cadastrar um perfil de bebê primeiro. Acesse o Cartão de Vacinação para criar um perfil.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container max-w-6xl py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Monitor de Desenvolvimento</h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-2">
                Acompanhe as conquistas do seu bebê com carinho
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowOnboarding(true)}
                  className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                  aria-label="Abrir ajuda"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver tutorial novamente</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => setShowQuickRegister(true)} className="w-full sm:w-auto text-sm">
                <Plus className="h-4 w-4 mr-1.5 sm:mr-2 shrink-0" />
                <span className="truncate">Registrar Conquistas</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Registre múltiplas conquistas de uma vez</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Mensagem contextual motivacional */}
        <Alert className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200 dark:from-pink-950/30 dark:to-purple-950/30 dark:border-pink-800">
          <AlertCircle className="h-4 w-4 text-pink-600 dark:text-pink-400 shrink-0" />
          <AlertTitle className="text-pink-800 dark:text-pink-300 text-sm">💕 Cada bebê tem seu ritmo</AlertTitle>
          <AlertDescription className="text-pink-700 dark:text-pink-400 text-xs sm:text-sm">
            Este monitor é para acompanhamento com amor, não comparação.
          </AlertDescription>
        </Alert>

        {summary && (
          <Tabs defaultValue="dashboard" className="space-y-4 sm:space-y-6">
            <TabsList className="w-full grid grid-cols-4 h-auto p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="dashboard" className="text-[10px] xs:text-xs sm:text-sm px-1.5 py-1.5 sm:px-3 sm:py-2">
                    <span className="hidden xs:inline">Dashboard</span>
                    <span className="xs:hidden">Dash</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Visão geral do desenvolvimento por área</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="timeline" className="text-[10px] xs:text-xs sm:text-sm px-1.5 py-1.5 sm:px-3 sm:py-2">
                    <span className="hidden xs:inline">Linha do Tempo</span>
                    <span className="xs:hidden">Tempo</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Veja todos os marcos organizados por faixa etária</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="attention" className="text-[10px] xs:text-xs sm:text-sm px-1.5 py-1.5 sm:px-3 sm:py-2 relative">
                    <span className="hidden xs:inline">Atenção</span>
                    <span className="xs:hidden">Alerta</span>
                    {attentionMilestones.length > 0 && (
                      <span className="ml-1 px-1 py-0.5 text-[8px] sm:text-xs bg-amber-100 text-amber-800 rounded-full">
                        {attentionMilestones.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Marcos que podem precisar de atenção especial</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="settings" className="text-[10px] xs:text-xs sm:text-sm px-1.5 py-1.5 sm:px-3 sm:py-2">
                    <span className="hidden xs:inline">Alertas</span>
                    <span className="xs:hidden">Config</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Configure lembretes e notificações</p>
                </TooltipContent>
              </Tooltip>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <DashboardDesenvolvimento summary={summary} />
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <LinhaTempoMarcos
                records={records}
                babyAgeMonths={summary.age_months}
                onMilestoneClick={handleMilestoneClick}
              />
            </TabsContent>

            <TabsContent value="attention" className="space-y-6">
              <MarcosAtencao
                attentionRecords={attentionMilestones}
                babyAgeMonths={summary.age_months}
                onMarkAsAchieved={(milestoneTypeId) => markAsAchieved(milestoneTypeId, new Date())}
                onMarkAsDoubt={handleMarkAsDoubt}
                onGenerateReport={() => {
                  logger.debug('Generate report requested');
                }}
              />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <ConfiguracoesAlertas
                settings={alertSettings}
                babyProfileId={currentProfile.id}
                onSave={handleSaveAlertSettings}
              />
            </TabsContent>
          </Tabs>
        )}

        <MilestoneDetailDialog
          record={selectedMilestone}
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          onMarkAsAchieved={markAsAchieved}
        />

        <RegistroRapidoMarcos
          milestones={milestoneTypes}
          babyAgeMonths={summary?.age_months || 0}
          open={showQuickRegister}
          onOpenChange={setShowQuickRegister}
          onSave={handleQuickRegister}
        />

        <OnboardingMonitor
          open={showOnboarding}
          onComplete={handleOnboardingComplete}
        />
      </div>
    </TooltipProvider>
  );
};

export default MonitorDesenvolvimento;
