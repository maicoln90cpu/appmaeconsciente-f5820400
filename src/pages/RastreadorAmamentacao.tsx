import { lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LazyTabContent } from '@/components/ui/lazy-tab-content';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Baby, BarChart3, History, Droplets, Settings, Info, Loader2 } from 'lucide-react';
import { useBabyFeeding } from '@/hooks/useBabyFeeding';
import { RegistroMamada } from '@/components/amamentacao/RegistroMamada';
import { ExportAmamentacaoPDF } from '@/components/amamentacao/ExportAmamentacaoPDF';

// Lazy load tab components for better initial bundle size
const DashboardAmamentacao = lazy(() =>
  import('@/components/amamentacao/DashboardAmamentacao').then(m => ({
    default: m.DashboardAmamentacao,
  }))
);
const HistoricoMamadas = lazy(() =>
  import('@/components/amamentacao/HistoricoMamadas').then(m => ({ default: m.HistoricoMamadas }))
);
const GestaoOrdenha = lazy(() =>
  import('@/components/amamentacao/GestaoOrdenha').then(m => ({ default: m.GestaoOrdenha }))
);
const ConfiguracoesAmamentacao = lazy(() =>
  import('@/components/amamentacao/ConfiguracoesAmamentacao').then(m => ({
    default: m.ConfiguracoesAmamentacao,
  }))
);

// Import ConfiguracoesAmamentacao directly for initial setup (when no settings exist)
import { ConfiguracoesAmamentacao as ConfiguracoesAmamentacaoSetup } from '@/components/amamentacao/ConfiguracoesAmamentacao';

const RastreadorAmamentacao = () => {
  const {
    feedingLogs,
    storage,
    settings,
    loading,
    saveSettings,
    addFeedingLog,
    deleteFeedingLog,
    addStorage,
    markStorageAsUsed,
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
              Primeiro, configure as informações básicas do seu bebê para começar a usar o
              rastreador.
            </AlertDescription>
          </Alert>

          <ConfiguracoesAmamentacaoSetup settings={settings} onSave={saveSettings} />
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
            <TabsTrigger
              value="registro"
              className="flex flex-col sm:flex-row items-center gap-1 py-2 px-1 sm:px-3"
            >
              <Baby className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">Registro</span>
            </TabsTrigger>
            <TabsTrigger
              value="dashboard"
              className="flex flex-col sm:flex-row items-center gap-1 py-2 px-1 sm:px-3"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger
              value="historico"
              className="flex flex-col sm:flex-row items-center gap-1 py-2 px-1 sm:px-3"
            >
              <History className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">Histórico</span>
            </TabsTrigger>
            <TabsTrigger
              value="ordenha"
              className="flex flex-col sm:flex-row items-center gap-1 py-2 px-1 sm:px-3"
            >
              <Droplets className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">Ordenha</span>
            </TabsTrigger>
            <TabsTrigger
              value="configuracoes"
              className="flex flex-col sm:flex-row items-center gap-1 py-2 px-1 sm:px-3"
            >
              <Settings className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registro">
            <RegistroMamada settings={settings} onAddLog={addFeedingLog} />
          </TabsContent>

          <TabsContent value="dashboard">
            <LazyTabContent fallbackHeight="h-64">
              <DashboardAmamentacao feedingLogs={feedingLogs} />
            </LazyTabContent>
          </TabsContent>

          <TabsContent value="historico">
            <LazyTabContent>
              <HistoricoMamadas feedingLogs={feedingLogs} onDelete={deleteFeedingLog} />
            </LazyTabContent>
          </TabsContent>

          <TabsContent value="ordenha">
            <LazyTabContent>
              <GestaoOrdenha
                storage={storage}
                onAddStorage={addStorage}
                onMarkAsUsed={markStorageAsUsed}
              />
            </LazyTabContent>
          </TabsContent>

          <TabsContent value="configuracoes">
            <LazyTabContent>
              <ConfiguracoesAmamentacao settings={settings} onSave={saveSettings} />
            </LazyTabContent>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RastreadorAmamentacao;
