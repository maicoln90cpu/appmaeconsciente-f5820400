import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { usePostpartumSymptoms } from "@/hooks/usePostpartumSymptoms";
import { Loader2 } from "lucide-react";

export const RastreadorSintomas = () => {
  const { addSymptom, isAdding } = usePostpartumSymptoms();
  const [formData, setFormData] = useState({
    pain_level: 0,
    bleeding_intensity: 'light' as 'light' | 'moderate' | 'heavy' | 'very_heavy',
    cramps_level: 0,
    swelling: [] as string[],
    healing_status: 'normal' as 'normal' | 'slow' | 'infected' | 'concerning',
    energy_level: 3,
    sleep_quality: 6,
    appetite: 'normal' as 'normal' | 'low' | 'high' | 'none',
    bowel_movement: 'normal' as 'normal' | 'constipated' | 'diarrhea' | 'painful',
    urination: 'normal' as 'normal' | 'painful' | 'frequent' | 'difficult',
    fever: false,
    temperature: undefined as number | undefined,
    breast_pain: false,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSymptom({
      date: new Date().toISOString().split('T')[0],
      ...formData,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Sintomas do Dia</CardTitle>
        <CardDescription>
          Acompanhe sua recuperação física diariamente. Seja honesta — isso ajuda a identificar quando procurar ajuda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nível de dor */}
          <div className="space-y-2">
            <Label>Nível de Dor (0 = nenhuma, 5 = intensa)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[formData.pain_level]}
                onValueChange={([value]) => setFormData(prev => ({ ...prev, pain_level: value }))}
                max={5}
                step={1}
                className="flex-1"
              />
              <span className="text-2xl font-bold w-8 text-center">{formData.pain_level}</span>
            </div>
          </div>

          {/* Intensidade do sangramento */}
          <div className="space-y-2">
            <Label>Intensidade do Sangramento</Label>
            <RadioGroup
              value={formData.bleeding_intensity}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, bleeding_intensity: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none">Nenhum</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light">Leve</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="moderate" id="moderate" />
                <Label htmlFor="moderate">Moderado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="heavy" id="heavy" />
                <Label htmlFor="heavy">Intenso</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="very_heavy" id="very_heavy" />
                <Label htmlFor="very_heavy">Muito intenso ⚠️</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Inchaço - removido pois swelling é array no schema */}

          {/* Status de cicatrização */}
          <div className="space-y-2">
            <Label>Cicatrização (pontos ou cesárea)</Label>
            <RadioGroup
              value={formData.healing_status}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, healing_status: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="normal-heal" />
                <Label htmlFor="normal-heal">Normal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="slow" id="slow" />
                <Label htmlFor="slow">Cicatrização lenta</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="concerning" id="concerning" />
                <Label htmlFor="concerning">Preocupante</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="infected" id="infected" />
                <Label htmlFor="infected">Sinais de infecção ⚠️</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Energia */}
          <div className="space-y-2">
            <Label>Nível de Energia (0 = exausta, 5 = energizada)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[formData.energy_level]}
                onValueChange={([value]) => setFormData(prev => ({ ...prev, energy_level: value }))}
                max={5}
                step={1}
                className="flex-1"
              />
              <span className="text-2xl font-bold w-8 text-center">{formData.energy_level}</span>
            </div>
          </div>

          {/* Qualidade do sono */}
          <div className="space-y-2">
            <Label>Qualidade do Sono (0 = péssimo, 10 = excelente)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[formData.sleep_quality]}
                onValueChange={([value]) => setFormData(prev => ({ ...prev, sleep_quality: value }))}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="text-2xl font-bold w-12 text-center">{formData.sleep_quality}</span>
            </div>
          </div>

          {/* Apetite */}
          <div className="space-y-2">
            <Label>Apetite</Label>
            <RadioGroup
              value={formData.appetite}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, appetite: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="appetite-none" />
                <Label htmlFor="appetite-none">Nenhum</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="appetite-low" />
                <Label htmlFor="appetite-low">Baixo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="appetite-normal" />
                <Label htmlFor="appetite-normal">Normal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="appetite-high" />
                <Label htmlFor="appetite-high">Alto</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Evacuação */}
          <div className="space-y-2">
            <Label>Evacuação</Label>
            <RadioGroup
              value={formData.bowel_movement}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, bowel_movement: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="bowel-normal" />
                <Label htmlFor="bowel-normal">Normal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="constipated" id="bowel-const" />
                <Label htmlFor="bowel-const">Constipação</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="diarrhea" id="bowel-diarr" />
                <Label htmlFor="bowel-diarr">Diarreia</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="painful" id="bowel-pain" />
                <Label htmlFor="bowel-pain">Dolorida</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Urinação */}
          <div className="space-y-2">
            <Label>Urinação</Label>
            <RadioGroup
              value={formData.urination}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, urination: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="urin-normal" />
                <Label htmlFor="urin-normal">Normal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="painful" id="urin-pain" />
                <Label htmlFor="urin-pain">Dolorida</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="frequent" id="urin-freq" />
                <Label htmlFor="urin-freq">Muito frequente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="difficult" id="urin-diff" />
                <Label htmlFor="urin-diff">Difícil</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fever"
                checked={formData.fever}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, fever: checked as boolean }))}
              />
              <Label htmlFor="fever" className="text-destructive">Estou com febre ⚠️</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="breast_pain"
                checked={formData.breast_pain}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, breast_pain: checked as boolean }))}
              />
              <Label htmlFor="breast_pain">Dor nas mamas</Label>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Como você está se sentindo hoje? Alguma preocupação específica?"
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isAdding}>
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Sintomas do Dia'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
