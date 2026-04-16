/**
 * @fileoverview Calculadora de Mamadeira
 */

import { useState, useMemo } from 'react';

import { Baby, Calculator, Info, Milk } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';


import { useGrowthMeasurements } from '@/hooks/useGrowthMeasurements';

interface BottleCalculatorProps {
  babyProfileId?: string;
}

// Reference table for bottle feeding by age
const BOTTLE_REFERENCE = [
  { ageWeeks: '0-1', mlPerFeeding: '30-60', feedingsPerDay: '8-12', totalMl: '400-600' },
  { ageWeeks: '1-2', mlPerFeeding: '60-90', feedingsPerDay: '8-10', totalMl: '500-700' },
  { ageWeeks: '2-4', mlPerFeeding: '90-120', feedingsPerDay: '7-9', totalMl: '700-900' },
  { ageWeeks: '4-8', mlPerFeeding: '120-150', feedingsPerDay: '6-8', totalMl: '800-1000' },
  { ageWeeks: '8-12', mlPerFeeding: '150-180', feedingsPerDay: '5-7', totalMl: '900-1100' },
  { ageWeeks: '12-16', mlPerFeeding: '180-210', feedingsPerDay: '5-6', totalMl: '1000-1200' },
  { ageWeeks: '16-24', mlPerFeeding: '180-240', feedingsPerDay: '4-6', totalMl: '1000-1200' },
  { ageWeeks: '24+', mlPerFeeding: '180-240', feedingsPerDay: '3-5', totalMl: '800-1000' },
];

export const BottleCalculator = ({ babyProfileId }: BottleCalculatorProps) => {
  const [weight, setWeight] = useState<string>('');
  const [ageWeeks, setAgeWeeks] = useState<string>('');
  const [feedingFrequency, setFeedingFrequency] = useState<string>('6');

  const { latestMeasurement } = useGrowthMeasurements(babyProfileId);

  // Use latest weight if available
  const effectiveWeight = weight || latestMeasurement?.weight_kg?.toString() || '';

  // Calculate recommended bottle size
  const calculation = useMemo(() => {
    const weightKg = parseFloat(effectiveWeight);
    const frequency = parseInt(feedingFrequency);

    if (!weightKg || isNaN(weightKg) || !frequency) {
      return null;
    }

    // General formula: 150-200ml per kg per day
    const minDailyMl = weightKg * 150;
    const maxDailyMl = weightKg * 200;

    const minPerBottle = Math.round(minDailyMl / frequency);
    const maxPerBottle = Math.round(maxDailyMl / frequency);
    const avgPerBottle = Math.round((minPerBottle + maxPerBottle) / 2);

    return {
      minDaily: Math.round(minDailyMl),
      maxDaily: Math.round(maxDailyMl),
      minPerBottle,
      maxPerBottle,
      avgPerBottle,
      frequency,
    };
  }, [effectiveWeight, feedingFrequency]);

  // Get age-based reference
  const ageReference = useMemo(() => {
    if (!ageWeeks) return null;
    const weeks = parseInt(ageWeeks);

    if (weeks <= 1) return BOTTLE_REFERENCE[0];
    if (weeks <= 2) return BOTTLE_REFERENCE[1];
    if (weeks <= 4) return BOTTLE_REFERENCE[2];
    if (weeks <= 8) return BOTTLE_REFERENCE[3];
    if (weeks <= 12) return BOTTLE_REFERENCE[4];
    if (weeks <= 16) return BOTTLE_REFERENCE[5];
    if (weeks <= 24) return BOTTLE_REFERENCE[6];
    return BOTTLE_REFERENCE[7];
  }, [ageWeeks]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calculadora de Mamadeira
          </CardTitle>
          <CardDescription>Calcule a quantidade ideal de leite por mamadeira</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input section */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="weight">Peso do bebê (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder={latestMeasurement?.weight_kg?.toString() || 'Ex: 4.5'}
                value={weight}
                onChange={e => setWeight(e.target.value)}
              />
              {latestMeasurement?.weight_kg && !weight && (
                <p className="text-xs text-muted-foreground mt-1">Usando último peso registrado</p>
              )}
            </div>
            <div>
              <Label htmlFor="age">Idade (semanas)</Label>
              <Input
                id="age"
                type="number"
                placeholder="Ex: 8"
                value={ageWeeks}
                onChange={e => setAgeWeeks(e.target.value)}
              />
            </div>
            <div>
              <Label>Mamadeiras por dia</Label>
              <Select value={feedingFrequency} onValueChange={setFeedingFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} mamadeiras
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          {calculation && (
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4 text-center">
                  <Milk className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-3xl font-bold text-primary">{calculation.avgPerBottle}ml</p>
                  <p className="text-sm text-muted-foreground">Por mamadeira</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ({calculation.minPerBottle} - {calculation.maxPerBottle}ml)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">
                    {calculation.minDaily} - {calculation.maxDaily}ml
                  </p>
                  <p className="text-sm text-muted-foreground">Total diário</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{calculation.frequency}x</p>
                  <p className="text-sm text-muted-foreground">Mamadeiras por dia</p>
                </CardContent>
              </Card>
            </div>
          )}

          {!calculation && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Informe o peso do bebê para calcular a quantidade recomendada de leite.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Age reference */}
      {ageReference && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Baby className="h-5 w-5" />
              Referência por Idade ({ageWeeks} semanas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">{ageReference.mlPerFeeding}ml</p>
                <p className="text-xs text-muted-foreground">Por mamadeira</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">{ageReference.feedingsPerDay}</p>
                <p className="text-xs text-muted-foreground">Mamadeiras/dia</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">{ageReference.totalMl}ml</p>
                <p className="text-xs text-muted-foreground">Total diário</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reference table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tabela de Referência por Idade</CardTitle>
          <CardDescription>Valores médios - cada bebê é único, consulte o pediatra</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Idade (semanas)</TableHead>
                <TableHead>ml/mamadeira</TableHead>
                <TableHead>Mamadeiras/dia</TableHead>
                <TableHead>Total diário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BOTTLE_REFERENCE.map((row, index) => (
                <TableRow key={index} className={ageReference === row ? 'bg-primary/5' : ''}>
                  <TableCell className="font-medium">
                    {row.ageWeeks}
                    {ageReference === row && (
                      <Badge variant="outline" className="ml-2">
                        Atual
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{row.mlPerFeeding}</TableCell>
                  <TableCell>{row.feedingsPerDay}</TableCell>
                  <TableCell>{row.totalMl}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dicas Importantes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                Os valores são estimativas. Observe os sinais de fome e saciedade do bebê.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                Bebês em amamentação exclusiva não precisam de mamadeira nas primeiras semanas.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Após os 6 meses, a introdução alimentar reduz a necessidade de leite.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Sinais de fome: mãos na boca, movimentos de sucção, agitação.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Sinais de saciedade: vira a cabeça, relaxa, para de sugar.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
