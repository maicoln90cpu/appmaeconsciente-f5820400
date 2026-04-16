import { differenceInMonths } from 'date-fns';
import { Loader2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ConfiguracoesSono } from '@/components/sono/ConfiguracoesSono';
import { DashboardSono } from '@/components/sono/DashboardSono';
import { HistoricoSono } from '@/components/sono/HistoricoSono';
import { RegistroSono } from '@/components/sono/RegistroSono';
import { SleepAIInsights } from '@/components/sono/SleepAIInsights';
import { SleepPatternChart } from '@/components/sono/SleepPatternChart';

import { useBabySleep } from '@/hooks/useBabySleep';


export default function DiarioSono() {
  const { sleepLogs, settings, milestones, loading, saveSettings, addSleepLog, deleteSleepLog } =
    useBabySleep();

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
          <p className="text-muted-foreground">Configure os dados do seu bebê para começar</p>
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
        <p className="text-muted-foreground">Acompanhe e melhore o sono de {settings.baby_name}</p>
      </div>

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="insights">🧠 Insights IA</TabsTrigger>
          <TabsTrigger value="registro">📝 Registro</TabsTrigger>
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="padroes">📈 Padrões</TabsTrigger>
          <TabsTrigger value="historico">📅 Histórico</TabsTrigger>
          <TabsTrigger value="configuracoes">⚙️ Config</TabsTrigger>
        </TabsList>

        <TabsContent value="insights">
          <SleepAIInsights
            sleepLogs={sleepLogs}
            milestones={milestones}
            babyName={settings.baby_name}
            babyAgeMonths={babyAgeMonths}
          />
        </TabsContent>

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

        <TabsContent value="padroes">
          <SleepPatternChart sleepLogs={sleepLogs} period={14} />
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
