import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanoSemanal } from "@/components/alimentacao/PlanoSemanal";
import { ControleSuplemento } from "@/components/alimentacao/ControleSuplemento";
import { Receitas } from "@/components/alimentacao/Receitas";
import { MonitoramentoPeso } from "@/components/alimentacao/MonitoramentoPeso";
import { AlertasAlimentos } from "@/components/alimentacao/AlertasAlimentos";
import { IANutricional } from "@/components/alimentacao/IANutricional";
import { RastreadorHidratacao } from "@/components/alimentacao/RastreadorHidratacao";
import { ExerciciosTrimestre } from "@/components/alimentacao/ExerciciosTrimestre";
import { ListaCompras } from "@/components/alimentacao/ListaCompras";
import { DashboardSaude } from "@/components/alimentacao/DashboardSaude";
import { GenerateMealPlanButton } from "@/components/alimentacao/GenerateMealPlanButton";
import { GenerateRecipesButton } from "@/components/alimentacao/GenerateRecipesButton";
import { GenerateExercisesButton } from "@/components/alimentacao/GenerateExercisesButton";
import { ProfileRequiredDialog } from "@/components/alimentacao/ProfileRequiredDialog";
import { Utensils, Pill, BookOpen, Scale, AlertTriangle, Bot, Droplets, Dumbbell, ShoppingCart, BarChart3 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function GuiaAlimentacao() {
  const { profile, loading } = useProfile();
  const [activeTab, setActiveTab] = useState("plano");
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const needsProfileData = !profile?.peso_atual || !profile?.altura_cm;
  const trimester = profile?.meses_gestacao 
    ? Math.min(Math.ceil(profile.meses_gestacao / 3), 3)
    : 1;

  // Check if user has any nutrition content
  const { data: hasContent, refetch: refetchContent } = useQuery({
    queryKey: ['nutrition-content', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return false;

      const [mealPlans, recipes, exercises] = await Promise.all([
        supabase.from('meal_plans').select('id', { count: 'exact', head: true }).eq('created_by', profile.id),
        supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('created_by', profile.id),
        supabase.from('exercises').select('id', { count: 'exact', head: true }).eq('created_by', profile.id),
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
              Sua nutrição e saúde durante a gestação, com planos personalizados e acompanhamento completo
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 gap-1 h-auto p-1">
            <TabsTrigger value="dashboard" className="flex flex-col items-center gap-1 py-2 px-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">Dash</span>
            </TabsTrigger>
            <TabsTrigger value="ia" className="flex flex-col items-center gap-1 py-2 px-1">
              <Bot className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">IA</span>
            </TabsTrigger>
            <TabsTrigger value="plano" className="flex flex-col items-center gap-1 py-2 px-1">
              <Utensils className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">Plano</span>
            </TabsTrigger>
            <TabsTrigger value="receitas" className="flex flex-col items-center gap-1 py-2 px-1">
              <BookOpen className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">Receitas</span>
            </TabsTrigger>
            <TabsTrigger value="suplementos" className="flex flex-col items-center gap-1 py-2 px-1">
              <Pill className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">Suplem.</span>
            </TabsTrigger>
            <TabsTrigger value="hidratacao" className="flex flex-col items-center gap-1 py-2 px-1">
              <Droplets className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">Água</span>
            </TabsTrigger>
            <TabsTrigger value="exercicios" className="flex flex-col items-center gap-1 py-2 px-1">
              <Dumbbell className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">Exerc.</span>
            </TabsTrigger>
            <TabsTrigger value="peso" className="flex flex-col items-center gap-1 py-2 px-1">
              <Scale className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">Peso</span>
            </TabsTrigger>
            <TabsTrigger value="compras" className="flex flex-col items-center gap-1 py-2 px-1">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">Compras</span>
            </TabsTrigger>
            <TabsTrigger value="alertas" className="flex flex-col items-center gap-1 py-2 px-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">Alertas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardSaude />
          </TabsContent>

          <TabsContent value="ia">
            <IANutricional />
          </TabsContent>

          <TabsContent value="plano">
            <div className="space-y-4">
              <GenerateMealPlanButton 
                onSuccess={() => refetchContent()} 
                onNeedsProfile={() => setShowProfileDialog(true)}
                needsProfile={needsProfileData}
              />
              <PlanoSemanal profile={profile} />
            </div>
          </TabsContent>

          <TabsContent value="receitas">
            <div className="space-y-4">
              <GenerateRecipesButton 
                onSuccess={() => refetchContent()}
                onNeedsProfile={() => setShowProfileDialog(true)}
                needsProfile={needsProfileData}
              />
              <Receitas />
            </div>
          </TabsContent>

          <TabsContent value="suplementos">
            <ControleSuplemento />
          </TabsContent>

          <TabsContent value="hidratacao">
            <RastreadorHidratacao />
          </TabsContent>

          <TabsContent value="exercicios">
            <div className="space-y-4">
              <GenerateExercisesButton 
                onSuccess={() => refetchContent()}
                onNeedsProfile={() => setShowProfileDialog(true)}
                needsProfile={needsProfileData}
              />
              <ExerciciosTrimestre />
            </div>
          </TabsContent>

          <TabsContent value="peso">
            <MonitoramentoPeso profile={profile} />
          </TabsContent>

          <TabsContent value="compras">
            <ListaCompras />
          </TabsContent>

          <TabsContent value="alertas">
            <AlertasAlimentos />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
