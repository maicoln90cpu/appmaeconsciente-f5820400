import { useState } from "react";
import { useVaccination } from "@/hooks/useVaccination";
import { useDevelopmentMilestones } from "@/hooks/useDevelopmentMilestones";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardDesenvolvimento } from "@/components/desenvolvimento/DashboardDesenvolvimento";
import { LinhaTempoMarcos } from "@/components/desenvolvimento/LinhaTempoMarcos";
import { MilestoneDetailDialog } from "@/components/desenvolvimento/MilestoneDetailDialog";
import { RegistroRapidoMarcos } from "@/components/desenvolvimento/RegistroRapidoMarcos";
import { RelatorioPediatraDialog } from "@/components/desenvolvimento/RelatorioPediatraDialog";
import { ConfiguracoesAlertas } from "@/components/desenvolvimento/ConfiguracoesAlertas";
import { MarcosAtencao } from "@/components/desenvolvimento/MarcosAtencao";
import { BabyMilestoneRecord, DevelopmentAlertSettings } from "@/types/development";
import { Plus, Baby, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const attentionMilestones = getAttentionMilestones();

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
    // TODO: Implement save to database
    console.log('Saving alert settings:', settings);
  };

  if (!currentProfile) {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-8">
          <Alert>
            <Baby className="h-4 w-4" />
            <AlertDescription>
              Você precisa cadastrar um perfil de bebê primeiro. Acesse o Cartão de Vacinação para criar um perfil.
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-8">
          <p>Carregando...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-6xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Monitor de Desenvolvimento</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe as conquistas do seu bebê com carinho e sem paranoia
            </p>
          </div>
          <Button onClick={() => setShowQuickRegister(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Conquistas
          </Button>
        </div>

        {/* Mensagem contextual motivacional */}
        <Alert className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
          <AlertCircle className="h-4 w-4 text-pink-600" />
          <AlertTitle className="text-pink-800">💕 Cada bebê tem seu próprio ritmo</AlertTitle>
          <AlertDescription className="text-pink-700">
            Este monitor é uma ferramenta de acompanhamento com amor, não de comparação. 
            Observe, celebre e confie no desenvolvimento único do seu bebê.
          </AlertDescription>
        </Alert>

        {summary && (
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
              <TabsTrigger value="attention">
                Atenção 
                {attentionMilestones.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">
                    {attentionMilestones.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings">Alertas</TabsTrigger>
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
                  console.log('Generate report');
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
      </div>
    </MainLayout>
  );
};

export default MonitorDesenvolvimento;
