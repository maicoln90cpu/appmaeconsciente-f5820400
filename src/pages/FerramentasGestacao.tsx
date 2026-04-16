/**
 * @fileoverview Página de Ferramentas de Gestação
 */

import { lazy, Suspense } from 'react';

import { Timer, Calculator, Image, Baby, ClipboardCheck, FileText } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ContractionDiary = lazy(() =>
  import('@/components/gestacao/ContractionDiary').then(m => ({ default: m.ContractionDiary }))
);
const DueDateCalculator = lazy(() =>
  import('@/components/gestacao/DueDateCalculator').then(m => ({ default: m.DueDateCalculator }))
);
const UltrasoundAlbum = lazy(() =>
  import('@/components/gestacao/UltrasoundAlbum').then(m => ({ default: m.UltrasoundAlbum }))
);
const KickCounter = lazy(() =>
  import('@/components/gestacao/KickCounter').then(m => ({ default: m.KickCounter }))
);
const ExamChecklist = lazy(() =>
  import('@/components/gestacao/ExamChecklist').then(m => ({ default: m.ExamChecklist }))
);
const BirthPlanBuilder = lazy(() =>
  import('@/components/gestacao/BirthPlanBuilder').then(m => ({ default: m.BirthPlanBuilder }))
);

import { PageLoader } from '@/components/ui/page-loader';

const TabFallback = () => <PageLoader />;

const FerramentasGestacao = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Ferramentas de Gestação</h1>
        <p className="text-muted-foreground">
          Acompanhe sua gestação com ferramentas essenciais para futuras mamães 🤰
        </p>
      </div>

      <Tabs defaultValue="ultrassons" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 w-full max-w-4xl p-1.5">
          <TabsTrigger value="ultrassons" className="flex items-center gap-1.5">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Ultrassons</span>
            <span className="sm:hidden">📸</span>
          </TabsTrigger>
          <TabsTrigger value="dpp" className="flex items-center gap-1.5">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Calculadora DPP</span>
            <span className="sm:hidden">DPP</span>
          </TabsTrigger>
          <TabsTrigger value="contracoes" className="flex items-center gap-1.5">
            <Timer className="h-4 w-4" />
            <span className="hidden sm:inline">Contrações</span>
            <span className="sm:hidden">Timer</span>
          </TabsTrigger>
          <TabsTrigger value="movimentos" className="flex items-center gap-1.5">
            <Baby className="h-4 w-4" />
            <span className="hidden sm:inline">Movimentos</span>
            <span className="sm:hidden">👶</span>
          </TabsTrigger>
          <TabsTrigger value="exames" className="flex items-center gap-1.5">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Exames</span>
            <span className="sm:hidden">🩺</span>
          </TabsTrigger>
          <TabsTrigger value="plano-parto" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Plano de Parto</span>
            <span className="sm:hidden">📋</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ultrassons">
          <Suspense fallback={<TabFallback />}>
            <UltrasoundAlbum />
          </Suspense>
        </TabsContent>
        <TabsContent value="dpp">
          <Suspense fallback={<TabFallback />}>
            <DueDateCalculator />
          </Suspense>
        </TabsContent>
        <TabsContent value="contracoes">
          <Suspense fallback={<TabFallback />}>
            <ContractionDiary />
          </Suspense>
        </TabsContent>
        <TabsContent value="movimentos">
          <Suspense fallback={<TabFallback />}>
            <KickCounter />
          </Suspense>
        </TabsContent>
        <TabsContent value="exames">
          <Suspense fallback={<TabFallback />}>
            <ExamChecklist />
          </Suspense>
        </TabsContent>
        <TabsContent value="plano-parto">
          <Suspense fallback={<TabFallback />}>
            <BirthPlanBuilder />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FerramentasGestacao;
