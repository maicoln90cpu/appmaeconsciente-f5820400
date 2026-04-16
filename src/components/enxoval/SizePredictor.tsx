import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Ruler,
  Baby,
  Shirt,
  Calculator,
  TrendingUp,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import {
  predictClothingSizes,
  predictDiaperSizes,
  getCurrentClothingSize,
  getCurrentDiaperSize,
  getNextSizeChange,
  formatMonthRange,
  BabyGrowthPrediction,
  SizePrediction,
  CLOTHING_SIZES,
  DIAPER_SIZES,
} from '@/lib/size-predictions';

interface SizePredictorProps {
  currentWeight?: number;
  currentHeight?: number;
  currentAgeMonths?: number;
  gender?: 'male' | 'female';
  onSizeAlert?: (message: string) => void;
}

export const SizePredictor = ({
  currentWeight: initialWeight,
  currentHeight: initialHeight,
  currentAgeMonths: initialAge,
  gender: initialGender,
  onSizeAlert,
}: SizePredictorProps) => {
  const [ageMonths, setAgeMonths] = useState<number>(initialAge || 0);
  const [weightKg, setWeightKg] = useState<number | undefined>(initialWeight);
  const [heightCm, setHeightCm] = useState<number | undefined>(initialHeight);
  const [gender, setGender] = useState<'male' | 'female'>(initialGender || 'male');
  const [percentile, setPercentile] = useState<'p3' | 'p15' | 'p50' | 'p85' | 'p97'>('p50');

  const prediction: BabyGrowthPrediction = useMemo(
    () => ({
      currentAge: ageMonths,
      currentWeight: weightKg,
      currentHeight: heightCm,
      gender,
      percentile,
    }),
    [ageMonths, weightKg, heightCm, gender, percentile]
  );

  const clothingPredictions = useMemo(() => predictClothingSizes(prediction), [prediction]);

  const diaperPredictions = useMemo(() => predictDiaperSizes(prediction), [prediction]);

  const currentClothingSize = weightKg ? getCurrentClothingSize(weightKg) : null;
  const currentDiaperSize = weightKg ? getCurrentDiaperSize(weightKg) : null;

  const nextSizeChange = weightKg
    ? getNextSizeChange(weightKg, ageMonths, gender, percentile)
    : null;

  const getPercentileLabel = (p: string) => {
    const labels: Record<string, string> = {
      p3: 'Abaixo da média (3%)',
      p15: 'Levemente abaixo (15%)',
      p50: 'Na média (50%)',
      p85: 'Acima da média (85%)',
      p97: 'Bem acima da média (97%)',
    };
    return labels[p] || p;
  };

  const renderPredictionCard = (pred: SizePrediction, type: 'clothing' | 'diaper') => {
    const isCurrentSize =
      type === 'clothing' ? pred.size === currentClothingSize : pred.size === currentDiaperSize;
    const isPastSize = pred.endMonth < ageMonths;
    const isFutureSize = pred.startMonth > ageMonths;

    return (
      <Card
        key={pred.size}
        className={`
          ${isCurrentSize ? 'border-primary border-2 bg-primary/5' : ''}
          ${isPastSize ? 'opacity-50' : ''}
        `}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={isCurrentSize ? 'default' : isPastSize ? 'secondary' : 'outline'}
                className="text-lg px-3 py-1"
              >
                {pred.size}
              </Badge>
              {isCurrentSize && (
                <Badge variant="outline" className="bg-primary/10">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Tamanho Atual
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">~{pred.durationWeeks} semanas</span>
          </div>

          <div className="text-sm text-muted-foreground mb-2">
            {formatMonthRange(pred.startMonth, pred.endMonth)}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span>
              {pred.estimatedStartWeight.toFixed(1)}kg → {pred.estimatedEndWeight.toFixed(1)}kg
            </span>
            {type === 'clothing' && pred.recommendedQuantity && (
              <Badge variant="secondary">
                <Shirt className="h-3 w-3 mr-1" />
                {pred.recommendedQuantity} peças
              </Badge>
            )}
            {type === 'diaper' && pred.diapersNeeded && (
              <Badge variant="secondary">~{pred.diapersNeeded} fraldas</Badge>
            )}
          </div>

          {isCurrentSize && !isFutureSize && (
            <Progress
              value={((ageMonths - pred.startMonth) / (pred.endMonth - pred.startMonth)) * 100}
              className="mt-3 h-2"
            />
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Previsão de Tamanhos
        </CardTitle>
        <CardDescription>
          Calcule quando seu bebê usará cada tamanho de roupa e fralda
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="age">Idade (meses)</Label>
            <Input
              id="age"
              type="number"
              min={0}
              max={24}
              value={ageMonths}
              onChange={e => setAgeMonths(Number(e.target.value))}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Peso atual (kg)</Label>
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

          <div className="space-y-2">
            <Label htmlFor="gender">Sexo</Label>
            <Select value={gender} onValueChange={v => setGender(v as 'male' | 'female')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Menino</SelectItem>
                <SelectItem value="female">Menina</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="percentile">Curva de Crescimento</Label>
            <Select value={percentile} onValueChange={v => setPercentile(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="p3">Percentil 3</SelectItem>
                <SelectItem value="p15">Percentil 15</SelectItem>
                <SelectItem value="p50">Percentil 50 (média)</SelectItem>
                <SelectItem value="p85">Percentil 85</SelectItem>
                <SelectItem value="p97">Percentil 97</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Current Status Alert */}
        {weightKg && currentClothingSize && (
          <Alert className="border-primary/30 bg-primary/5">
            <Baby className="h-4 w-4 text-primary" />
            <AlertDescription>
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  Com <strong>{weightKg}kg</strong>, seu bebê está no tamanho
                </span>
                <Badge>{currentClothingSize}</Badge>
                <span>de roupa e</span>
                <Badge>{currentDiaperSize}</Badge>
                <span>de fralda.</span>
                {nextSizeChange && (
                  <span className="text-muted-foreground">
                    Próximo tamanho ({nextSizeChange.nextSize}) em ~
                    {nextSizeChange.estimatedMonthsUntilChange.toFixed(1)} meses.
                  </span>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Size Predictions Tabs */}
        <Tabs defaultValue="clothing">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clothing" className="gap-2">
              <Shirt className="h-4 w-4" />
              Roupas
            </TabsTrigger>
            <TabsTrigger value="diapers" className="gap-2">
              <Baby className="h-4 w-4" />
              Fraldas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clothing" className="mt-4 space-y-3">
            {clothingPredictions.map(pred => renderPredictionCard(pred, 'clothing'))}

            {clothingPredictions.length === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Preencha os dados acima para ver as previsões de tamanhos.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="diapers" className="mt-4 space-y-3">
            {diaperPredictions.map(pred => renderPredictionCard(pred, 'diaper'))}

            {/* Diaper Summary */}
            {diaperPredictions.length > 0 && (
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-medium">Resumo de Fraldas</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {diaperPredictions.map(pred => (
                      <div key={pred.size} className="flex justify-between">
                        <span>{pred.size}:</span>
                        <span className="font-medium">~{pred.diapersNeeded} un</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t flex justify-between font-medium">
                    <span>Total estimado:</span>
                    <span>
                      ~{diaperPredictions.reduce((sum, p) => sum + (p.diapersNeeded || 0), 0)}{' '}
                      fraldas
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Tips */}
        <Alert className="bg-muted/30">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription>
            <strong>Dica:</strong> Bebês crescem em ritmos diferentes. Use a curva de crescimento do
            seu bebê (informada pelo pediatra) para previsões mais precisas. Compre menos peças em
            tamanhos menores (RN, P) pois são usados por pouco tempo.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
