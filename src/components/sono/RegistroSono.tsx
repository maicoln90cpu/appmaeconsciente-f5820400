import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Square, Save } from 'lucide-react';
import { BabySleepLog, SleepLocation, WakeupMood, MomMood } from '@/types/babySleep';
import { toast } from 'sonner';
import { useAutoSave } from '@/hooks/useAutoSave';
import { DraftIndicator } from '@/components/ui/draft-indicator';

interface RegistroSonoProps {
  onSave: (log: Omit<BabySleepLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<any>;
  babyName?: string;
  babyAgeMonths?: number;
}

type SleepFormData = {
  sleepStart: string;
  sleepEnd: string;
  location: SleepLocation;
  wakeupMood: WakeupMood;
  momMood: MomMood;
  notes: string;
};

export const RegistroSono = ({ onSave, babyName, babyAgeMonths }: RegistroSonoProps) => {
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sleepStart, setSleepStart] = useState('');
  const [sleepEnd, setSleepEnd] = useState('');
  const [location, setLocation] = useState<SleepLocation>('berco');
  const [wakeupMood, setWakeupMood] = useState<WakeupMood>('calmo');
  const [momMood, setMomMood] = useState<MomMood>('descansada');
  const [notes, setNotes] = useState('');

  // Auto-save for sleep records
  const {
    isSaving,
    hasSavedRecently,
    lastSavedAt,
    availableDrafts,
    triggerAutoSave,
    deleteDraft,
    loadDraftById,
    deleteDraftById,
  } = useAutoSave<SleepFormData>({
    type: 'sleep-log',
    enabled: true,
    debounceMs: 2000,
    minDataCheck: data => !!data.sleepStart,
    onDraftLoaded: data => {
      const { __userId, __savedAt, ...cleanData } = data as SleepFormData & {
        __userId?: string;
        __savedAt?: number;
      };
      if (cleanData.sleepStart) setSleepStart(cleanData.sleepStart);
      if (cleanData.sleepEnd) setSleepEnd(cleanData.sleepEnd);
      if (cleanData.location) setLocation(cleanData.location);
      if (cleanData.wakeupMood) setWakeupMood(cleanData.wakeupMood);
      if (cleanData.momMood) setMomMood(cleanData.momMood);
      if (cleanData.notes) setNotes(cleanData.notes);
    },
  });

  // Trigger auto-save when form data changes
  useEffect(() => {
    if (sleepStart) {
      triggerAutoSave({ sleepStart, sleepEnd, location, wakeupMood, momMood, notes });
    }
  }, [sleepStart, sleepEnd, location, wakeupMood, momMood, notes, triggerAutoSave]);

  // Handle draft load
  const handleLoadDraft = useCallback(
    async (id: string) => {
      await loadDraftById(id);
      toast('Rascunho carregado', { description: 'Os dados do rascunho foram restaurados.' });
    },
    [loadDraftById]
  );

  const startTimer = () => {
    const now = new Date();
    setStartTime(now);
    setIsTimerActive(true);
    setSleepStart(now.toISOString().slice(0, 16));
    toast('Temporizador iniciado', { description: 'O sono do bebê está sendo registrado.' });
  };

  const stopTimer = () => {
    if (startTime) {
      const now = new Date();
      setSleepEnd(now.toISOString().slice(0, 16));
      setIsTimerActive(false);
      toast('Temporizador pausado', { description: 'Preencha os detalhes e salve o registro.' });
    }
  };

  const handleSubmit = async () => {
    if (!sleepStart) {
      toast.error('Erro', { description: 'Preencha o horário de início do sono.' });
      return;
    }

    const start = new Date(sleepStart);
    const end = sleepEnd ? new Date(sleepEnd) : null;
    const durationMinutes = end ? Math.round((end.getTime() - start.getTime()) / 60000) : undefined;

    // Determinar tipo de sono baseado no horário
    const hour = start.getHours();
    const sleepType = hour >= 20 || hour < 6 ? 'noturno' : 'diurno';

    const log: Omit<BabySleepLog, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
      baby_name: babyName,
      baby_age_months: babyAgeMonths,
      sleep_start: start.toISOString(),
      sleep_end: end?.toISOString(),
      duration_minutes: durationMinutes,
      sleep_type: sleepType,
      location,
      wakeup_mood: wakeupMood,
      mom_mood: momMood,
      notes: notes || undefined,
    };

    await onSave(log);

    // Delete draft after successful save
    await deleteDraft();

    // Limpar formulário
    setSleepStart('');
    setSleepEnd('');
    setNotes('');
    setStartTime(null);
    setIsTimerActive(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>📝 Registrar Sono</CardTitle>
            <CardDescription>
              Use o temporizador ou adicione manualmente os horários
            </CardDescription>
          </div>
          <DraftIndicator
            isSaving={isSaving}
            hasSavedRecently={hasSavedRecently}
            lastSavedAt={lastSavedAt}
            availableDrafts={availableDrafts}
            onLoadDraft={handleLoadDraft}
            onDeleteDraft={deleteDraftById}
            onDeleteCurrentDraft={deleteDraft}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {!isTimerActive ? (
            <Button onClick={startTimer} className="flex-1">
              <Play className="mr-2 h-4 w-4" />
              Iniciar Sono
            </Button>
          ) : (
            <Button onClick={stopTimer} variant="destructive" className="flex-1">
              <Square className="mr-2 h-4 w-4" />
              Encerrar Sono
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sleep-start">Início do Sono</Label>
            <Input
              id="sleep-start"
              type="datetime-local"
              value={sleepStart}
              onChange={e => setSleepStart(e.target.value)}
              disabled={isTimerActive}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sleep-end">Fim do Sono</Label>
            <Input
              id="sleep-end"
              type="datetime-local"
              value={sleepEnd}
              onChange={e => setSleepEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Local do Sono</Label>
          <Select value={location} onValueChange={value => setLocation(value as SleepLocation)}>
            <SelectTrigger id="location">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="berco">🛏️ Berço</SelectItem>
              <SelectItem value="colo">🤱 Colo</SelectItem>
              <SelectItem value="carrinho">🚼 Carrinho</SelectItem>
              <SelectItem value="cama_compartilhada">👨‍👩‍👦 Cama Compartilhada</SelectItem>
              <SelectItem value="outro">📍 Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wakeup-mood">Humor do Bebê ao Acordar</Label>
            <Select value={wakeupMood} onValueChange={value => setWakeupMood(value as WakeupMood)}>
              <SelectTrigger id="wakeup-mood">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calmo">😌 Calmo</SelectItem>
                <SelectItem value="chorando">😢 Chorando</SelectItem>
                <SelectItem value="agitado">😫 Agitado</SelectItem>
                <SelectItem value="neutro">😐 Neutro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mom-mood">Como Você Está</Label>
            <Select value={momMood} onValueChange={value => setMomMood(value as MomMood)}>
              <SelectTrigger id="mom-mood">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="descansada">😊 Descansada</SelectItem>
                <SelectItem value="cansada">😴 Cansada</SelectItem>
                <SelectItem value="exausta">😵 Exausta</SelectItem>
                <SelectItem value="neutra">😐 Neutra</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            placeholder="Ex: Acordou chorando, dormiu após mamar..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={handleSubmit} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Salvar Registro
        </Button>

        <div className="mt-6 p-4 bg-accent/10 rounded-lg">
          <p className="text-sm text-muted-foreground italic text-center">
            💙 Você está fazendo o seu melhor. Cada noite conta.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
