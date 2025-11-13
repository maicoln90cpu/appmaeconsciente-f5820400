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
import { BabyMilestoneRecord } from "@/types/development";
import { Plus, Baby } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MonitorDesenvolvimento = () => {
  const { profiles, currentProfile } = useVaccination();
  const { 
    records, 
    summary, 
    loading, 
    markAsAchieved,
    milestoneTypes 
  } = useDevelopmentMilestones(currentProfile?.id || null);

  const [selectedMilestone, setSelectedMilestone] = useState<BabyMilestoneRecord | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showQuickRegister, setShowQuickRegister] = useState(false);

  const handleMilestoneClick = (record: BabyMilestoneRecord) => {
    setSelectedMilestone(record);
    setShowDetailDialog(true);
  };

  const handleQuickRegister = async (milestoneIds: string[], date: Date) => {
    for (const id of milestoneIds) {
      await markAsAchieved(id, date);
    }
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

        {summary && (
          <>
            <DashboardDesenvolvimento summary={summary} />

            <LinhaTempoMarcos
              records={records}
              babyAgeMonths={summary.age_months}
              onMilestoneClick={handleMilestoneClick}
            />

            <RelatorioPediatraDialog
              summary={summary}
              records={records}
              babyProfile={{
                baby_name: currentProfile.baby_name,
                birth_date: currentProfile.birth_date,
                birth_type: currentProfile.birth_type || undefined,
                birth_city: currentProfile.birth_city || undefined
              }}
            />
          </>
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
