import { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Baby, Activity } from "lucide-react";
import { useVaccination } from "@/hooks/useVaccination";
import { CadastroBebe } from "@/components/vacinacao/CadastroBebe";
import { DashboardVacinacao } from "@/components/vacinacao/DashboardVacinacao";
import { CalendarioVacinas } from "@/components/vacinacao/CalendarioVacinas";
import { RegistroVacina } from "@/components/vacinacao/RegistroVacina";
import { ConfiguracoesLembretes } from "@/components/vacinacao/ConfiguracoesLembretes";
import type { VaccinationCalendar } from "@/types/vaccination";

const CartaoVacinacao = () => {
  const {
    currentProfile,
    calendar,
    vaccinations,
    settings,
    loading,
    saveProfile,
    addVaccination,
    saveSettings,
  } = useVaccination();

  const [selectedVaccine, setSelectedVaccine] = useState<VaccinationCalendar | undefined>();
  const [registroOpen, setRegistroOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">💉 Cartão de Vacinação Digital</h1>
          <p className="text-muted-foreground">
            Organize e acompanhe todas as vacinas do seu bebê
          </p>
        </div>

        <Alert className="mb-6">
          <Baby className="h-4 w-4" />
          <AlertDescription>
            Para começar, cadastre os dados do bebê abaixo
          </AlertDescription>
        </Alert>

        <CadastroBebe onSave={saveProfile} />
      </div>
    );
  }

  const handleRegisterClick = (vaccine: VaccinationCalendar) => {
    setSelectedVaccine(vaccine);
    setRegistroOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              💉 Cartão de Vacinação - {currentProfile.nickname || currentProfile.baby_name}
            </h1>
            <p className="text-muted-foreground">
              Acompanhe todas as vacinas e mantenha a saúde do bebê em dia
            </p>
          </div>
          <Link to="/materiais/monitor-desenvolvimento">
            <Button variant="outline" className="gap-2">
              <Activity className="h-4 w-4" />
              Monitor de Desenvolvimento
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="calendario">Calendário</TabsTrigger>
          <TabsTrigger value="lembretes">Lembretes</TabsTrigger>
          <TabsTrigger value="dados">Dados do Bebê</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <DashboardVacinacao
            profile={currentProfile}
            calendar={calendar}
            vaccinations={vaccinations}
          />
        </TabsContent>

        <TabsContent value="calendario" className="space-y-6">
          <CalendarioVacinas
            profile={currentProfile}
            calendar={calendar}
            vaccinations={vaccinations}
            onRegisterClick={handleRegisterClick}
          />
        </TabsContent>

        <TabsContent value="lembretes" className="space-y-6">
          <ConfiguracoesLembretes
            settings={settings}
            onSave={saveSettings}
          />
        </TabsContent>

        <TabsContent value="dados" className="space-y-6">
          <CadastroBebe
            profile={currentProfile}
            onSave={saveProfile}
          />
        </TabsContent>
      </Tabs>

      <RegistroVacina
        vaccine={selectedVaccine}
        open={registroOpen}
        onOpenChange={setRegistroOpen}
        onSave={addVaccination}
      />
    </div>
  );
};

export default CartaoVacinacao;
