import { useState } from 'react';

import { Calculator, Ruler } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { CLOTHING_SIZES, DIAPER_SIZES } from '@/lib/size-predictions';

export const ClothingSizeCalculator = () => {
  const [open, setOpen] = useState(false);
  const [monthsOld, setMonthsOld] = useState<number>(0);
  const [weightKg, setWeightKg] = useState<number | undefined>();
  const [heightCm, setHeightCm] = useState<number | undefined>();

  const calculateSize = () => {
    // Prioriza peso se disponível, senão usa idade
    if (weightKg) {
      const clothingSize =
        CLOTHING_SIZES.find(s => weightKg >= s.minWeight && weightKg < s.maxWeight) ||
        CLOTHING_SIZES[CLOTHING_SIZES.length - 1];

      const diaperSize =
        DIAPER_SIZES.find(s => weightKg >= s.minWeight && weightKg <= s.maxWeight) ||
        DIAPER_SIZES[DIAPER_SIZES.length - 1];

      return { clothingSize, diaperSize, basedOn: 'peso' };
    }

    // Fallback para idade
    const clothingSize =
      CLOTHING_SIZES.find(s => monthsOld <= s.maxMonths) ||
      CLOTHING_SIZES[CLOTHING_SIZES.length - 1];

    // Para fraldas, estimar peso pela idade (média)
    const estimatedWeight = 3.3 + monthsOld * 0.5; // Aproximação simples
    const diaperSize =
      DIAPER_SIZES.find(s => estimatedWeight >= s.minWeight && estimatedWeight <= s.maxWeight) ||
      DIAPER_SIZES[0];

    return { clothingSize, diaperSize, basedOn: 'idade' };
  };

  const result = calculateSize();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Ruler className="h-4 w-4" />
          Calcular Tamanho
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Tamanho
          </DialogTitle>
          <DialogDescription>
            Descubra qual tamanho de roupa e fralda é ideal para seu bebê.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="months">Idade (meses)</Label>
              <Input
                id="months"
                type="number"
                min={0}
                max={24}
                value={monthsOld}
                onChange={e => setMonthsOld(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg) - opcional</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min={0}
                max={20}
                value={weightKg || ''}
                onChange={e => setWeightKg(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="3.5"
              />
            </div>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Tamanho de Roupa:</span>
                <Badge className="text-lg px-3 py-1">{result.clothingSize.size}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {result.clothingSize.minWeight}kg - {result.clothingSize.maxWeight}kg | Até{' '}
                {result.clothingSize.maxHeight}cm
              </div>

              <div className="border-t pt-4 flex items-center justify-between">
                <span className="font-medium">Tamanho de Fralda:</span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {result.diaperSize.size}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {result.diaperSize.minWeight}kg - {result.diaperSize.maxWeight}kg | ~
                {result.diaperSize.dailyUsage} fraldas/dia
              </div>

              <p className="text-xs text-muted-foreground italic border-t pt-3">
                Cálculo baseado {result.basedOn === 'peso' ? 'no peso' : 'na idade'} informado(a).
              </p>
            </CardContent>
          </Card>

          <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-2">💡 Dicas importantes:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>O peso é o melhor indicador de tamanho</li>
              <li>Cada bebê tem seu próprio ritmo de crescimento</li>
              <li>Na dúvida, opte pelo tamanho maior</li>
              <li>Evite comprar muitas peças de tamanhos pequenos</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
