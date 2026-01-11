import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Baby, BarChart3, History, Droplets, Settings, Info } from "lucide-react";
import { useBabyFeeding } from "@/hooks/useBabyFeeding";
import { ConfiguracoesAmamentacao } from "@/components/amamentacao/ConfiguracoesAmamentacao";
import { RegistroMamada } from "@/components/amamentacao/RegistroMamada";
import { DashboardAmamentacao } from "@/components/amamentacao/DashboardAmamentacao";
import { HistoricoMamadas } from "@/components/amamentacao/HistoricoMamadas";
import { GestaoOrdenha } from "@/components/amamentacao/GestaoOrdenha";
import { ExportAmamentacaoPDF } from "@/components/amamentacao/ExportAmamentacaoPDF";
import { Loader2 } from "lucide-react";

const RastreadorAmamentacao = () => {
  const {
    feedingLogs,
    storage,
    settings,
    loading,
    saveSettings,
    addFeedingLog,
    updateFeedingLog,
    deleteFeedingLog,
    addStorage,
    markStorageAsUsed,
    reloadData
  } = useBabyFeeding();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Baby className="h-8 w-8 text-primary" />
              🍼 Rastreador de Amamentação
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure os dados do seu bebê para começar
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Primeiro, configure as informações básicas do seu bebê para começar a usar o rastreador.
            </AlertDescription>
          </Alert>

          <ConfiguracoesAmamentacao settings={settings} onSave={saveSettings} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Baby className="h-8 w-8 text-primary" />
                🍼 Rastreador de Amamentação
              </h1>
              <p className="text-muted-foreground mt-2">
                Acompanhe toda a rotina de alimentação de {settings.baby_name}
              </p>
            </div>
            <ExportAmamentacaoPDF feedingLogs={feedingLogs} settings={settings} />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="registro" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 gap-1 h-auto p-1">
              <TabsTrigger value="registro" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-1 sm:px-3">
                <Baby className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs">Registro</span>
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-1 sm:px-3">
                <BarChart3 className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="historico" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-1 sm:px-3">
                <History className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs">Histórico</span>
              </TabsTrigger>
              <TabsTrigger value="ordenha" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-1 sm:px-3">
                <Droplets className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs">Ordenha</span>
              </TabsTrigger>
              <TabsTrigger value="configuracoes" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-1 sm:px-3">
                <Settings className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs">Config</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="registro">
              <RegistroMamada settings={settings} onAddLog={addFeedingLog} />
            </TabsContent>

            <TabsContent value="dashboard">
              <DashboardAmamentacao feedingLogs={feedingLogs} />
            </TabsContent>

            <TabsContent value="historico">
              <HistoricoMamadas feedingLogs={feedingLogs} onDelete={deleteFeedingLog} />
            </TabsContent>

            <TabsContent value="ordenha">
              <GestaoOrdenha 
                storage={storage} 
                onAddStorage={addStorage}
                onMarkAsUsed={markStorageAsUsed}
              />
            </TabsContent>

            <TabsContent value="configuracoes">
              <ConfiguracoesAmamentacao settings={settings} onSave={saveSettings} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
};

export default RastreadorAmamentacao;
