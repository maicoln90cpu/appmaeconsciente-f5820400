import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calculator, TrendingUp, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { DiaperEstimate } from '@/pages/CalculadoraFraldas';
import { Progress } from '@/components/ui/progress';

interface Props {
  onEstimateCalculated: (estimate: DiaperEstimate) => void;
}

// Estimativas baseadas em dados reais
const DIAPER_USAGE = {
  RN: { min: 8, max: 12, weightRange: [0, 4] },
  P: { min: 7, max: 9, weightRange: [3, 6] },
  M: { min: 6, max: 8, weightRange: [5, 10] },
  G: { min: 5, max: 7, weightRange: [9, 13] },
  XG: { min: 4, max: 6, weightRange: [12, 20] },
};

export const FraldaCalculator = ({ onEstimateCalculated }: Props) => {
  const [babyAge, setBabyAge] = useState('');
  const [babyWeight, setBabyWeight] = useState('');
  const [period, setPeriod] = useState('1');

  const calculateEstimate = () => {
    const weight = parseFloat(babyWeight);
    const months = parseInt(period);

    if (!babyAge || !weight || !months) return;

    // Determinar tamanho atual
    let currentSize = 'RN';
    for (const [size, data] of Object.entries(DIAPER_USAGE)) {
      if (weight >= data.weightRange[0] && weight <= data.weightRange[1]) {
        currentSize = size;
        break;
      }
    }

    const estimates = [];
    let totalDiapers = 0;
    let currentWeight = weight;

    // Simular crescimento e calcular por período
    for (let month = 0; month < months; month++) {
      // Crescimento médio: ~500g/mês nos primeiros 6 meses
      if (month > 0) {
        currentWeight += month < 6 ? 0.5 : 0.3;
      }

      // Determinar tamanho para este mês
      let sizeForMonth = 'RN';
      for (const [size, data] of Object.entries(DIAPER_USAGE)) {
        if (currentWeight >= data.weightRange[0] && currentWeight <= data.weightRange[1]) {
          sizeForMonth = size;
          break;
        }
      }

      const usage = DIAPER_USAGE[sizeForMonth as keyof typeof DIAPER_USAGE];
      const dailyAvg = (usage.min + usage.max) / 2;
      const monthlyQty = Math.round(dailyAvg * 30);

      // Evitar duplicatas, acumular no mesmo tamanho
      const existingSize = estimates.find(e => e.size === sizeForMonth);
      if (existingSize) {
        existingSize.monthlyQty += monthlyQty;
      } else {
        estimates.push({
          size: sizeForMonth,
          monthlyQty,
          dailyAvg: parseFloat(dailyAvg.toFixed(1)),
        });
      }

      totalDiapers += monthlyQty;
    }

    const estimate: DiaperEstimate = {
      babyAge,
      babyWeight: weight,
      calculationPeriod: months,
      estimates,
      totalDiapers,
    };

    onEstimateCalculated(estimate);
  };

  return (
    <div className="space-y-6">
      {/* Formulário */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="babyAge">Idade do Bebê</Label>
          <Select value={babyAge} onValueChange={setBabyAge}>
            <SelectTrigger id="babyAge">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not-born">Ainda não nasceu</SelectItem>
              <SelectItem value="0-1m">0-1 mês</SelectItem>
              <SelectItem value="1-3m">1-3 meses</SelectItem>
              <SelectItem value="3-6m">3-6 meses</SelectItem>
              <SelectItem value="6-12m">6-12 meses</SelectItem>
              <SelectItem value="12m+">12+ meses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Peso Atual/Estimado (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            min="2"
            max="20"
            placeholder="Ex: 3.5"
            value={babyWeight}
            onChange={e => setBabyWeight(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="period">Período de Cálculo</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger id="period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 mês</SelectItem>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">1 ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={calculateEstimate} className="w-full" size="lg">
        <Calculator className="mr-2 h-5 w-5" />
        Calcular Estimativa
      </Button>

      {/* Dica Importante */}
      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertDescription>
          <strong>Dica:</strong> Compre menos fraldas RN e mais P! Bebês crescem rápido nos
          primeiros meses.
        </AlertDescription>
      </Alert>
    </div>
  );
};
