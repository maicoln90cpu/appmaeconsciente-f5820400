import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegistroSono } from "@/components/sono/RegistroSono";
import { DashboardSono } from "@/components/sono/DashboardSono";
import { HistoricoSono } from "@/components/sono/HistoricoSono";
import { ConfiguracoesSono } from "@/components/sono/ConfiguracoesSono";
import { ExportSonoPDF } from "@/components/sono/ExportSonoPDF";
import { useBabySleep } from "@/hooks/useBabySleep";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { differenceInMonths } from "date-fns";

export default function DiarioSono() {
  const {
    sleepLogs,
    settings,
    milestones,
    loading,
    saveSettings,
    addSleepLog,
    deleteSleepLog,
  } = useBabySleep();

  const babyAgeMonths = settings?.baby_birthdate 
    ? differenceInMonths(new Date(), new Date(settings.baby_birthdate))
    : undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">💤 Diário de Sono do Bebê</h1>
          <p className="text-muted-foreground">
            Configure os dados do seu bebê para começar
          </p>
        </div>
        <Alert>
          <AlertDescription>
            Para começar a usar o Diário de Sono, preencha as configurações iniciais abaixo.
          </AlertDescription>
        </Alert>
        <div className="mt-6">
          <ConfiguracoesSono settings={null} onSave={saveSettings} />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">💤 Diário de Sono do Bebê</h1>
        <p className="text-muted-foreground">
          Acompanhe e melhore o sono de {settings.baby_name}
        </p>
      </div>

      <Tabs defaultValue="registro" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="registro">📝 Registro</TabsTrigger>
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="historico">📅 Histórico</TabsTrigger>
          <TabsTrigger value="configuracoes">⚙️ Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="registro">
          <RegistroSono
            onSave={addSleepLog}
            babyName={settings.baby_name}
            babyAgeMonths={babyAgeMonths}
          />
        </TabsContent>

        <TabsContent value="dashboard">
          <DashboardSono
            sleepLogs={sleepLogs}
            milestones={milestones}
            babyAgeMonths={babyAgeMonths}
          />
        </TabsContent>

        <TabsContent value="historico">
          <HistoricoSono
            sleepLogs={sleepLogs}
            onDelete={deleteSleepLog}
            babyName={settings.baby_name}
          />
        </TabsContent>

        <TabsContent value="configuracoes">
          <ConfiguracoesSono settings={settings} onSave={saveSettings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
