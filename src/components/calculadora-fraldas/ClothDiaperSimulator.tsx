import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Leaf, DollarSign, Clock, TrendingDown } from "lucide-react";
import type { DiaperEstimate } from "@/pages/CalculadoraFraldas";
import { Progress } from "@/components/ui/progress";

interface Props {
  estimate: DiaperEstimate | null;
}

export const ClothDiaperSimulator = ({ estimate }: Props) => {
  const [clothDiapers, setClothDiapers] = useState(24);
  const [pricePerCloth, setPricePerCloth] = useState(45);
  const [washCostPerMonth, setWashCostPerMonth] = useState(30);

  const simulation = useMemo(() => {
    if (!estimate) return null;

    // Custo inicial fraldas de pano
    const initialInvestment = clothDiapers * pricePerCloth;
    
    // Custo mensal descartáveis (média de R$0.75 por fralda)
    const disposableMonthlyCost = (estimate.totalDiapers / estimate.calculationPeriod) * 0.75;
    
    // Custo mensal fraldas de pano (apenas lavagens)
    const clothMonthlyCost = washCostPerMonth;
    
    // Economia mensal
    const monthlySavings = disposableMonthlyCost - clothMonthlyCost;
    
    // Ponto de equilíbrio (em meses)
    const breakEvenMonths = Math.ceil(initialInvestment / monthlySavings);
    
    // Economia em 2 anos
    const savingsIn2Years = (monthlySavings * 24) - initialInvestment;
    
    // Lavagens por semana (assumindo 3-4)
    const washesPerWeek = 3.5;
    const hoursPerWeek = washesPerWeek * 1.5; // 1.5h por lavagem (lavar+secar+dobrar)
    
    // Impacto ambiental (kg de lixo evitado)
    const wasteAvoided = (estimate.totalDiapers / estimate.calculationPeriod) * 24 * 0.3; // 300g por fralda

    return {
      initialInvestment,
      disposableMonthlyCost,
      clothMonthlyCost,
      monthlySavings,
      breakEvenMonths,
      savingsIn2Years,
      hoursPerWeek,
      wasteAvoided,
    };
  }, [estimate, clothDiapers, pricePerCloth, washCostPerMonth]);

  if (!estimate) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Calcule uma estimativa acima para ver a simulação de fraldas de pano
      </div>
    );
  }

  if (!simulation) return null;

  const breakEvenProgress = Math.min((12 / simulation.breakEvenMonths) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Configuração */}
      <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="space-y-2">
          <Label htmlFor="clothQty">Quantidade de Fraldas de Pano</Label>
          <Input
            id="clothQty"
            type="number"
            min="12"
            max="40"
            value={clothDiapers}
            onChange={(e) => setClothDiapers(parseInt(e.target.value) || 24)}
          />
          <p className="text-xs text-muted-foreground">Recomendado: 20-30 fraldas</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pricePerCloth">Preço por Fralda (R$)</Label>
          <Input
            id="pricePerCloth"
            type="number"
            min="20"
            max="100"
            value={pricePerCloth}
            onChange={(e) => setPricePerCloth(parseInt(e.target.value) || 45)}
          />
          <p className="text-xs text-muted-foreground">Média: R$ 40-60</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="washCost">Custo Lavagens/Mês (R$)</Label>
          <Input
            id="washCost"
            type="number"
            min="10"
            max="100"
            value={washCostPerMonth}
            onChange={(e) => setWashCostPerMonth(parseInt(e.target.value) || 30)}
          />
          <p className="text-xs text-muted-foreground">Água + energia</p>
        </div>
      </div>

      {/* Comparação Visual */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Descartáveis */}
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold text-lg mb-4">Fraldas Descartáveis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Custo mensal:</span>
              <span className="font-bold text-lg">R$ {simulation.disposableMonthlyCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Custo em 2 anos:</span>
              <span className="font-bold text-destructive">
                R$ {(simulation.disposableMonthlyCost * 24).toFixed(2)}
              </span>
            </div>
            <div className="pt-2 border-t">
              <Badge variant="outline">Sem investimento inicial</Badge>
            </div>
          </div>
        </div>

        {/* Pano */}
        <div className="p-6 border-2 border-success rounded-lg bg-success/5">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Leaf className="h-5 w-5 text-success" />
            Fraldas de Pano
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Investimento inicial:</span>
              <span className="font-bold text-warning">R$ {simulation.initialInvestment.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Custo mensal:</span>
              <span className="font-bold text-lg">R$ {simulation.clothMonthlyCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Economia em 2 anos:</span>
              <span className="font-bold text-success text-xl">
                R$ {simulation.savingsIn2Years.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ponto de Equilíbrio */}
      <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Ponto de Equilíbrio</h3>
        </div>
        <p className="text-muted-foreground mb-4">
          O investimento em fraldas de pano se paga em <strong className="text-primary">{simulation.breakEvenMonths} meses</strong>
        </p>
        <Progress value={breakEvenProgress} className="h-3" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>Hoje</span>
          <span>{simulation.breakEvenMonths} meses</span>
          <span>24 meses</span>
        </div>
      </div>

      {/* Cards de Informação */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Economia Mensal */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-success">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">Economia Mensal</span>
          </div>
          <p className="text-2xl font-bold">R$ {simulation.monthlySavings.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            por mês após ponto de equilíbrio
          </p>
        </div>

        {/* Tempo Dedicado */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-warning">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Tempo Dedicado</span>
          </div>
          <p className="text-2xl font-bold">{simulation.hoursPerWeek.toFixed(1)}h</p>
          <p className="text-xs text-muted-foreground mt-1">
            por semana (lavagens)
          </p>
        </div>

        {/* Impacto Ambiental */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-success">
            <Leaf className="h-4 w-4" />
            <span className="text-sm font-medium">Impacto Ambiental</span>
          </div>
          <p className="text-2xl font-bold">{simulation.wasteAvoided.toFixed(0)} kg</p>
          <p className="text-xs text-muted-foreground mt-1">
            de lixo evitado em 2 anos
          </p>
        </div>
      </div>

      {/* Conclusão */}
      <div className="p-6 border-2 border-success rounded-lg bg-success/5">
        <h3 className="font-semibold text-lg mb-3 text-success">Vale a Pena?</h3>
        {simulation.savingsIn2Years > 1000 ? (
          <p className="text-muted-foreground">
            <strong className="text-success">Sim!</strong> Com uma economia de{" "}
            <strong>R$ {simulation.savingsIn2Years.toFixed(2)}</strong> em 2 anos e{" "}
            <strong>{simulation.wasteAvoided.toFixed(0)}kg</strong> de lixo evitado, fraldas de pano são uma excelente opção 
            para quem busca economia e sustentabilidade. O investimento inicial se paga em apenas {simulation.breakEvenMonths} meses!
          </p>
        ) : (
          <p className="text-muted-foreground">
            A economia é moderada (R$ {simulation.savingsIn2Years.toFixed(2)} em 2 anos), mas o impacto ambiental é significativo. 
            Considere se o tempo dedicado às lavagens ({simulation.hoursPerWeek.toFixed(1)}h/semana) cabe na sua rotina.
          </p>
        )}
      </div>
    </div>
  );
};
