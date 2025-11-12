import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardRecuperacao } from "@/components/recuperacao/DashboardRecuperacao";
import { RastreadorSintomas } from "@/components/recuperacao/RastreadorSintomas";
import { ControleMedicamentos } from "@/components/recuperacao/ControleMedicamentos";
import { DiarioAutoestima } from "@/components/recuperacao/DiarioAutoestima";
import { AcessoParceiro } from "@/components/recuperacao/AcessoParceiro";
import { ConquistasRecuperacao } from "@/components/recuperacao/ConquistasRecuperacao";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Pill, Calendar, Heart, FileText, Camera, Users, Trophy } from "lucide-react";

const RecuperacaoPosPartoPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Guia de Recuperação Pós-Parto</h1>
          <p className="text-muted-foreground">
            Seu corpo e mente merecem o mesmo cuidado que seu bebê 💕
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid grid-cols-4 sm:grid-cols-8 w-full">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="sintomas" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Sintomas</span>
            </TabsTrigger>
            <TabsTrigger value="medicamentos" className="flex items-center gap-2">
              <Pill className="h-4 w-4" />
              <span className="hidden sm:inline">Medicamentos</span>
            </TabsTrigger>
            <TabsTrigger value="consultas" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Consultas</span>
            </TabsTrigger>
            <TabsTrigger value="emocional" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Emocional</span>
            </TabsTrigger>
            <TabsTrigger value="autoestima" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Autoestima</span>
            </TabsTrigger>
            <TabsTrigger value="parceiro" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Parceiro</span>
            </TabsTrigger>
            <TabsTrigger value="conquistas" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Conquistas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardRecuperacao />
          </TabsContent>

          <TabsContent value="sintomas">
            <RastreadorSintomas />
          </TabsContent>

          <TabsContent value="medicamentos">
            <ControleMedicamentos />
          </TabsContent>

          <TabsContent value="consultas">
            <div className="text-center text-muted-foreground py-12">
              Agenda de Consultas (em desenvolvimento)
            </div>
          </TabsContent>

          <TabsContent value="emocional">
            <div className="text-center text-muted-foreground py-12">
              Rastreador Emocional (em desenvolvimento)
            </div>
          </TabsContent>

          <TabsContent value="autoestima">
            <DiarioAutoestima />
          </TabsContent>

          <TabsContent value="parceiro">
            <AcessoParceiro />
          </TabsContent>

          <TabsContent value="conquistas">
            <ConquistasRecuperacao />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default RecuperacaoPosPartoPage;
