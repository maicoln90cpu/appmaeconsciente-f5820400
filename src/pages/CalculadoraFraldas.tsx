import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FraldaCalculator } from "@/components/calculadora-fraldas/FraldaCalculator";
import { BrandComparison } from "@/components/calculadora-fraldas/BrandComparison";
import { ClothDiaperSimulator } from "@/components/calculadora-fraldas/ClothDiaperSimulator";
import { ResultsSummary } from "@/components/calculadora-fraldas/ResultsSummary";
import { Baby, DollarSign, Leaf } from "lucide-react";

export interface DiaperEstimate {
  babyAge: string;
  babyWeight: number;
  calculationPeriod: number;
  estimates: {
    size: string;
    monthlyQty: number;
    dailyAvg: number;
  }[];
  totalDiapers: number;
}

const CalculadoraFraldas = () => {
  const [estimate, setEstimate] = useState<DiaperEstimate | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Baby className="h-10 w-10 text-primary" />
            Calculadora de Fraldas
          </h1>
          <p className="text-muted-foreground">
            Estime quantas fraldas você vai precisar, compare marcas e descubra se fraldas de pano valem a pena
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Calculadora Principal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5" />
                Calculadora Principal
              </CardTitle>
              <CardDescription>
                Calcule quantas fraldas você precisará nos próximos meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FraldaCalculator onEstimateCalculated={setEstimate} />
            </CardContent>
          </Card>

          {/* Tabs: Comparativo e Simulador */}
          <Tabs defaultValue="comparison" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comparison" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Comparativo de Marcas
              </TabsTrigger>
              <TabsTrigger value="cloth" className="flex items-center gap-2">
                <Leaf className="h-4 w-4" />
                Fraldas de Pano
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comparison" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Comparação de Preços por Marca</CardTitle>
                  <CardDescription>
                    Compare os custos entre as principais marcas do mercado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BrandComparison estimate={estimate} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cloth" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Simulador de Fraldas de Pano</CardTitle>
                  <CardDescription>
                    Descubra se vale a pena investir em fraldas reutilizáveis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ClothDiaperSimulator estimate={estimate} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Resumo Final */}
          {estimate && (
            <ResultsSummary estimate={estimate} />
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculadoraFraldas;
