import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanoSemanal } from "@/components/alimentacao/PlanoSemanal";
import { ControleSuplemento } from "@/components/alimentacao/ControleSuplemento";
import { Receitas } from "@/components/alimentacao/Receitas";
import { MonitoramentoPeso } from "@/components/alimentacao/MonitoramentoPeso";
import { AlertasAlimentos } from "@/components/alimentacao/AlertasAlimentos";
import { Utensils, Pill, BookOpen, Scale, AlertTriangle } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GuiaAlimentacao() {
  const { profile, loading } = useProfile();
  const [activeTab, setActiveTab] = useState("plano");

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!profile?.perfil_completo) {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-8">
          <Alert>
            <AlertDescription>
              Por favor, complete seu perfil primeiro para acessar o Guia de Alimentação e Bem-Estar.
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-6xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🌱 Guia de Alimentação e Bem-Estar</h1>
          <p className="text-muted-foreground">
            Sua nutrição e saúde durante a gestação, com planos personalizados e acompanhamento completo
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="plano" className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              <span className="hidden sm:inline">Plano Semanal</span>
            </TabsTrigger>
            <TabsTrigger value="suplementos" className="flex items-center gap-2">
              <Pill className="h-4 w-4" />
              <span className="hidden sm:inline">Suplementos</span>
            </TabsTrigger>
            <TabsTrigger value="receitas" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Receitas</span>
            </TabsTrigger>
            <TabsTrigger value="peso" className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">Peso</span>
            </TabsTrigger>
            <TabsTrigger value="alertas" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Alertas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plano">
            <PlanoSemanal profile={profile} />
          </TabsContent>

          <TabsContent value="suplementos">
            <ControleSuplemento />
          </TabsContent>

          <TabsContent value="receitas">
            <Receitas />
          </TabsContent>

          <TabsContent value="peso">
            <MonitoramentoPeso profile={profile} />
          </TabsContent>

          <TabsContent value="alertas">
            <AlertasAlimentos />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
