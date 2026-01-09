/**
 * @fileoverview Página de Ferramentas de Gestação
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractionDiary } from "@/components/gestacao/ContractionDiary";
import { DueDateCalculator } from "@/components/gestacao/DueDateCalculator";
import { Timer, Calculator, Baby } from "lucide-react";

const FerramentasGestacao = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Ferramentas de Gestação</h1>
        <p className="text-muted-foreground">
          Acompanhe sua gestação com ferramentas essenciais para futuras mamães 🤰
        </p>
      </div>

      <Tabs defaultValue="dpp" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="dpp" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Calculadora DPP</span>
            <span className="sm:hidden">DPP</span>
          </TabsTrigger>
          <TabsTrigger value="contracoes" className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            <span className="hidden sm:inline">Contrações</span>
            <span className="sm:hidden">Timer</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dpp">
          <DueDateCalculator />
        </TabsContent>

        <TabsContent value="contracoes">
          <ContractionDiary />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FerramentasGestacao;
