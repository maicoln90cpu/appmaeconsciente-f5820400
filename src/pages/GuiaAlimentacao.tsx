import { useState, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { LazyTabContent } from '@/components/ui/lazy-tab-content';
import { DashboardSaude } from '@/components/alimentacao/DashboardSaude';
import { GenerateMealPlanButton } from '@/components/alimentacao/GenerateMealPlanButton';
import { GenerateRecipesButton } from '@/components/alimentacao/GenerateRecipesButton';
import { GenerateExercisesButton } from '@/components/alimentacao/GenerateExercisesButton';
import { ProfileRequiredDialog } from '@/components/alimentacao/ProfileRequiredDialog';
import {
  Utensils,
  Pill,
  BookOpen,
  Scale,
  AlertTriangle,
  Bot,
  Droplets,
  Dumbbell,
  ShoppingCart,
  BarChart3,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Lazy load tab components for better initial bundle size
const PlanoSemanal = lazy(() =>
  import('@/components/alimentacao/PlanoSemanal').then(m => ({ default: m.PlanoSemanal }))
);
const Receitas = lazy(() =>
  import('@/components/alimentacao/Receitas').then(m => ({ default: m.Receitas }))
);
const ControleSuplemento = lazy(() =>
  import('@/components/alimentacao/ControleSuplemento').then(m => ({
    default: m.ControleSuplemento,
  }))
);
const RastreadorHidratacao = lazy(() =>
  import('@/components/alimentacao/RastreadorHidratacao').then(m => ({
    default: m.RastreadorHidratacao,
  }))
);
const ExerciciosTrimestre = lazy(() =>
  import('@/components/alimentacao/ExerciciosTrimestre').then(m => ({
    default: m.ExerciciosTrimestre,
  }))
);
const MonitoramentoPeso = lazy(() =>
  import('@/components/alimentacao/MonitoramentoPeso').then(m => ({ default: m.MonitoramentoPeso }))
);
const ListaCompras = lazy(() =>
  import('@/components/alimentacao/ListaCompras').then(m => ({ default: m.ListaCompras }))
);
const AlertasAlimentos = lazy(() =>
  import('@/components/alimentacao/AlertasAlimentos').then(m => ({ default: m.AlertasAlimentos }))
);
const IANutricional = lazy(() =>
  import('@/components/alimentacao/IANutricional').then(m => ({ default: m.IANutricional }))
);

export default function GuiaAlimentacao() {
  const { profile, loading } = useProfile();
  const [activeTab, setActiveTab] = useState('plano');
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const needsProfileData = !profile?.peso_atual || !profile?.altura_cm;

  // Check if user has any nutrition content
  const { refetch: refetchContent } = useQuery({
    queryKey: ['nutrition-content', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return false;

      const [mealPlans, recipes, exercises] = await Promise.all([
        supabase
          .from('meal_plans')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', profile.id),
        supabase
          .from('recipes')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', profile.id),
        supabase
          .from('exercises')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', profile.id),
      ]);

      return (mealPlans.count || 0) > 0 || (recipes.count || 0) > 0 || (exercises.count || 0) > 0;
    },
    enabled: !!profile?.id,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile?.perfil_completo) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert>
          <AlertDescription>
            Por favor, complete seu perfil primeiro para acessar o Guia de Alimentação e Bem-Estar.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <ProfileRequiredDialog
        open={showProfileDialog}
        onComplete={() => setShowProfileDialog(false)}
      />
      <div className="container max-w-6xl py-8">
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">🌱 Guia de Alimentação e Bem-Estar</h1>
            <p className="text-muted-foreground">
              Sua nutrição e saúde durante a gestação, com planos personalizados e acompanhamento
              completo
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* ScrollArea horizontal para tabs em mobile */}
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex w-max gap-1 h-auto p-1.5 md:grid md:w-full md:grid-cols-5 lg:grid-cols-10">
              <TabsTrigger
                value="dashboard"
                className="flex flex-col items-center gap-1 min-w-[60px] min-h-[44px] py-2 px-2 touch-manipulation"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs">Dash</span>
              </TabsTrigger>
              <TabsTrigger
                value="ia"
                className="flex flex-col items-center gap-1 min-w-[60px] min-h-[44px] py-2 px-2 touch-manipulation"
              >
                <Bot className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs">IA</span>
              </TabsTrigger>
              <TabsTrigger
                value="plano"
                className="flex flex-col items-center gap-1 min-w-[60px] min-h-[44px] py-2 px-2 touch-manipulation"
              >
                <Utensils className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs">Plano</span>
              </TabsTrigger>
              <TabsTrigger
                value="receitas"
                className="flex flex-col items-center gap-1 min-w-[60px] min-h-[44px] py-2 px-2 touch-manipulation"
              >
                <BookOpen className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs">Receitas</span>
              </TabsTrigger>
              <TabsTrigger
                value="suplementos"
                className="flex flex-col items-center gap-1 min-w-[60px] min-h-[44px] py-2 px-2 touch-manipulation"
              >
                <Pill className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs">Suplem.</span>
              </TabsTrigger>
              <TabsTrigger
                value="hidratacao"
                className="flex flex-col items-center gap-1 min-w-[60px] min-h-[44px] py-2 px-2 touch-manipulation"
              >
                <Droplets className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs">Água</span>
              </TabsTrigger>
              <TabsTrigger
                value="exercicios"
                className="flex flex-col items-center gap-1 min-w-[60px] min-h-[44px] py-2 px-2 touch-manipulation"
              >
                <Dumbbell className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs">Exerc.</span>
              </TabsTrigger>
              <TabsTrigger
                value="peso"
                className="flex flex-col items-center gap-1 min-w-[60px] min-h-[44px] py-2 px-2 touch-manipulation"
              >
                <Scale className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs">Peso</span>
              </TabsTrigger>
              <TabsTrigger
                value="compras"
                className="flex flex-col items-center gap-1 min-w-[60px] min-h-[44px] py-2 px-2 touch-manipulation"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs">Compras</span>
              </TabsTrigger>
              <TabsTrigger
                value="alertas"
                className="flex flex-col items-center gap-1 min-w-[60px] min-h-[44px] py-2 px-2 touch-manipulation"
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs">Alertas</span>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" className="h-2" />
          </ScrollArea>

          <TabsContent value="dashboard">
            <DashboardSaude />
          </TabsContent>

          <TabsContent value="ia">
            <LazyTabContent fallbackHeight="h-64">
              <IANutricional />
            </LazyTabContent>
          </TabsContent>

          <TabsContent value="plano">
            <div className="space-y-4">
              <GenerateMealPlanButton
                onSuccess={() => refetchContent()}
                onNeedsProfile={() => setShowProfileDialog(true)}
                needsProfile={needsProfileData}
              />
              <LazyTabContent>
                <PlanoSemanal profile={profile} />
              </LazyTabContent>
            </div>
          </TabsContent>

          <TabsContent value="receitas">
            <div className="space-y-4">
              <GenerateRecipesButton
                onSuccess={() => refetchContent()}
                onNeedsProfile={() => setShowProfileDialog(true)}
                needsProfile={needsProfileData}
              />
              <LazyTabContent>
                <Receitas />
              </LazyTabContent>
            </div>
          </TabsContent>

          <TabsContent value="suplementos">
            <LazyTabContent>
              <ControleSuplemento />
            </LazyTabContent>
          </TabsContent>

          <TabsContent value="hidratacao">
            <LazyTabContent>
              <RastreadorHidratacao />
            </LazyTabContent>
          </TabsContent>

          <TabsContent value="exercicios">
            <div className="space-y-4">
              <GenerateExercisesButton
                onSuccess={() => refetchContent()}
                onNeedsProfile={() => setShowProfileDialog(true)}
                needsProfile={needsProfileData}
              />
              <LazyTabContent>
                <ExerciciosTrimestre />
              </LazyTabContent>
            </div>
          </TabsContent>

          <TabsContent value="peso">
            <LazyTabContent>
              <MonitoramentoPeso profile={profile} />
            </LazyTabContent>
          </TabsContent>

          <TabsContent value="compras">
            <LazyTabContent>
              <ListaCompras />
            </LazyTabContent>
          </TabsContent>

          <TabsContent value="alertas">
            <LazyTabContent>
              <AlertasAlimentos />
            </LazyTabContent>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
