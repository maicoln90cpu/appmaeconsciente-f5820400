import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Timer, Baby, Milk } from 'lucide-react';
import type { BabyFeedingLog, FeedingSettings } from '@/types/babyFeeding';

interface RegistroMamadaProps {
  settings: FeedingSettings | null;
  onAddLog: (
    log: Omit<BabyFeedingLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => Promise<unknown>;
}

export const RegistroMamada = ({ settings, onAddLog }: RegistroMamadaProps) => {
  const [feedingType, setFeedingType] = useState<'breastfeeding' | 'bottle' | 'pumping'>(
    'breastfeeding'
  );
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [startTime, setStartTime] = useState<string>('');
  const [breastSide, setBreastSide] = useState<'left' | 'right'>('left');
  const [formData, setFormData] = useState({
    volume_ml: '',
    milk_type: 'breast_milk' as const,
    temperature: 'warm' as const,
    leftover_ml: '',
    notes: '',
  });

  const suggestedSide = settings?.last_breast_side === 'left' ? 'right' : 'left';

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = (side: 'left' | 'right') => {
    setBreastSide(side);
    setStartTime(new Date().toISOString());
    setIsTimerRunning(true);
    setTimerSeconds(0);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const endTime = new Date().toISOString();
    const durationMinutes = Math.floor(timerSeconds / 60);

    const logData: Omit<BabyFeedingLog, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
      baby_name: settings?.baby_name,
      feeding_type: feedingType,
      start_time: startTime || endTime,
      end_time: endTime,
      duration_minutes: durationMinutes > 0 ? durationMinutes : undefined,
      breast_side: feedingType === 'breastfeeding' ? breastSide : undefined,
      volume_ml: formData.volume_ml ? parseInt(formData.volume_ml) : undefined,
      milk_type: feedingType === 'bottle' ? formData.milk_type : undefined,
      temperature: feedingType === 'bottle' ? formData.temperature : undefined,
      leftover_ml: formData.leftover_ml ? parseInt(formData.leftover_ml) : undefined,
      notes: formData.notes || undefined,
    };

    await onAddLog(logData);

    // Reset form
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setStartTime('');
    setFormData({
      volume_ml: '',
      milk_type: 'breast_milk',
      temperature: 'warm',
      leftover_ml: '',
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Tipo de Alimentação */}
      <Card className="p-6">
        <div className="grid grid-cols-3 gap-4">
          <Button
            type="button"
            variant={feedingType === 'breastfeeding' ? 'default' : 'outline'}
            onClick={() => setFeedingType('breastfeeding')}
            className="flex flex-col gap-2 h-auto py-4"
          >
            <Baby className="h-6 w-6" />
            <span>Amamentação</span>
          </Button>
          <Button
            type="button"
            variant={feedingType === 'bottle' ? 'default' : 'outline'}
            onClick={() => setFeedingType('bottle')}
            className="flex flex-col gap-2 h-auto py-4"
          >
            <Milk className="h-6 w-6" />
            <span>Mamadeira</span>
          </Button>
          <Button
            type="button"
            variant={feedingType === 'pumping' ? 'default' : 'outline'}
            onClick={() => setFeedingType('pumping')}
            className="flex flex-col gap-2 h-auto py-4"
          >
            <Timer className="h-6 w-6" />
            <span>Ordenha</span>
          </Button>
        </div>
      </Card>

      {/* Timer para Amamentação */}
      {feedingType === 'breastfeeding' && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Timer de Amamentação
            </h3>

            {settings?.last_breast_side && !isTimerRunning && (
              <p className="text-sm text-muted-foreground">
                💡 Próxima mamada sugerida: seio {suggestedSide === 'left' ? 'esquerdo' : 'direito'}
              </p>
            )}

            <div className="text-4xl font-bold text-center py-8">{formatTime(timerSeconds)}</div>

            {!isTimerRunning ? (
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => startTimer('left')} size="lg">
                  Iniciar Esquerdo
                </Button>
                <Button onClick={() => startTimer('right')} size="lg">
                  Iniciar Direito
                </Button>
              </div>
            ) : (
              <Button onClick={stopTimer} size="lg" variant="destructive" className="w-full">
                Parar Timer
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Formulário */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {feedingType === 'bottle' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="volume">Volume (ml)</Label>
                <Input
                  id="volume"
                  type="number"
                  value={formData.volume_ml}
                  onChange={e => setFormData({ ...formData, volume_ml: e.target.value })}
                  placeholder="Ex: 120"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="milk_type">Tipo de Leite</Label>
                <Select
                  value={formData.milk_type}
                  onValueChange={(value: any) => setFormData({ ...formData, milk_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breast_milk">Leite Materno</SelectItem>
                    <SelectItem value="formula">Fórmula</SelectItem>
                    <SelectItem value="mixed">Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperatura</Label>
                <Select
                  value={formData.temperature}
                  onValueChange={(value: any) => setFormData({ ...formData, temperature: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warm">Morna</SelectItem>
                    <SelectItem value="room">Ambiente</SelectItem>
                    <SelectItem value="cold">Gelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leftover">Sobrou (ml)</Label>
                <Input
                  id="leftover"
                  type="number"
                  value={formData.leftover_ml}
                  onChange={e => setFormData({ ...formData, leftover_ml: e.target.value })}
                  placeholder="Ex: 20"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: Adormeceu rápido, regurgitou um pouco..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" size="lg">
            Registrar{' '}
            {feedingType === 'breastfeeding'
              ? 'Amamentação'
              : feedingType === 'bottle'
                ? 'Mamadeira'
                : 'Ordenha'}
          </Button>
        </form>
      </Card>

      {/* Mensagem Motivacional */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <p className="text-sm text-center italic">
          💝 Você está nutrindo com amor — o resto é aprendizado.
        </p>
      </Card>
    </div>
  );
};
