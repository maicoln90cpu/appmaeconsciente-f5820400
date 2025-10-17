import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Award } from "lucide-react";
import type { DiaperEstimate } from "@/pages/CalculadoraFraldas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  estimate: DiaperEstimate | null;
}

const BRANDS = [
  { name: "Pampers Premium Care", pricePerUnit: { RN: 0.85, P: 0.90, M: 0.95, G: 1.00, XG: 1.10 }, quality: "premium" },
  { name: "Huggies Supreme Care", pricePerUnit: { RN: 0.80, P: 0.85, M: 0.90, G: 0.95, XG: 1.05 }, quality: "premium" },
  { name: "MamyPoko", pricePerUnit: { RN: 0.65, P: 0.70, M: 0.75, G: 0.80, XG: 0.90 }, quality: "standard" },
  { name: "Pom Pom Derma Protek", pricePerUnit: { RN: 0.70, P: 0.75, M: 0.80, G: 0.85, XG: 0.95 }, quality: "standard" },
  { name: "Pampers Supersec", pricePerUnit: { RN: 0.55, P: 0.60, M: 0.65, G: 0.70, XG: 0.80 }, quality: "economic" },
  { name: "Cremer Disney", pricePerUnit: { RN: 0.50, P: 0.55, M: 0.60, G: 0.65, XG: 0.75 }, quality: "economic" },
];

export const BrandComparison = ({ estimate }: Props) => {
  const [selectedSize, setSelectedSize] = useState<string>("all");

  const comparison = useMemo(() => {
    if (!estimate) return [];

    return BRANDS.map(brand => {
      let totalCost = 0;
      let monthlyCost = 0;

      estimate.estimates.forEach(est => {
        const size = est.size as keyof typeof brand.pricePerUnit;
        if (selectedSize === "all" || selectedSize === size) {
          const cost = est.monthlyQty * brand.pricePerUnit[size];
          totalCost += cost;
        }
      });

      monthlyCost = totalCost / estimate.calculationPeriod;

      return {
        brand: brand.name,
        quality: brand.quality,
        monthlyCost,
        totalCost,
        annualCost: monthlyCost * 12,
      };
    }).sort((a, b) => a.totalCost - b.totalCost);
  }, [estimate, selectedSize]);

  const savings = useMemo(() => {
    if (comparison.length < 2) return 0;
    return comparison[comparison.length - 1].totalCost - comparison[0].totalCost;
  }, [comparison]);

  if (!estimate) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Calcule uma estimativa acima para ver a comparação de marcas
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro por Tamanho */}
      <div className="flex items-center gap-4">
        <Label htmlFor="sizeFilter">Filtrar por tamanho:</Label>
        <Select value={selectedSize} onValueChange={setSelectedSize}>
          <SelectTrigger id="sizeFilter" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {estimate.estimates.map(est => (
              <SelectItem key={est.size} value={est.size}>
                Tamanho {est.size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de Comparação */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Marca</TableHead>
              <TableHead>Qualidade</TableHead>
              <TableHead className="text-right">Custo Mensal</TableHead>
              <TableHead className="text-right">Custo Total ({estimate.calculationPeriod}m)</TableHead>
              <TableHead className="text-right">Custo Anual</TableHead>
              <TableHead className="text-center">Ranking</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparison.map((item, index) => (
              <TableRow key={item.brand} className={index === 0 ? "bg-success/10" : ""}>
                <TableCell className="font-medium">{item.brand}</TableCell>
                <TableCell>
                  <Badge variant={
                    item.quality === "premium" ? "default" : 
                    item.quality === "standard" ? "secondary" : 
                    "outline"
                  }>
                    {item.quality === "premium" ? "Premium" : 
                     item.quality === "standard" ? "Padrão" : 
                     "Econômica"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  R$ {item.monthlyCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  R$ {item.totalCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  R$ {item.annualCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  {index === 0 && (
                    <Badge className="bg-success">
                      <Award className="h-3 w-3 mr-1" />
                      Melhor
                    </Badge>
                  )}
                  {index === comparison.length - 1 && (
                    <Badge variant="outline">Mais cara</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Economia Destacada */}
      {savings > 0 && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-success mb-2">
            <TrendingDown className="h-5 w-5" />
            <span className="font-semibold text-lg">Economia Potencial</span>
          </div>
          <p className="text-muted-foreground">
            Escolhendo <strong>{comparison[0].brand}</strong> em vez de <strong>{comparison[comparison.length - 1].brand}</strong>, 
            você economiza <strong className="text-success">R$ {savings.toFixed(2)}</strong> em {estimate.calculationPeriod} meses!
          </p>
        </div>
      )}

      {/* Dica de Pacotes Grandes */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-primary mb-2">
          <TrendingUp className="h-5 w-5" />
          <span className="font-semibold">Dica de Economia</span>
        </div>
        <p className="text-muted-foreground">
          Comprar pacotes maiores (mega, hiper) reduz o custo por fralda em até 30%. 
          Planeje compras mensais em vez de semanais!
        </p>
      </div>
    </div>
  );
};
