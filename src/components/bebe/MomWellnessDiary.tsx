import { useState, useEffect } from 'react';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, TrendingUp, Moon, Zap, Brain, Utensils } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';


import { useMomWellness } from '@/hooks/useMomWellness';


const MOOD_LABELS = ['', '😢 Muito mal', '😔 Mal', '😐 Regular', '🙂 Bem', '😊 Muito bem'];
const ENERGY_LABELS = ['', '🔋 Exausta', '😩 Cansada', '😌 Normal', '💪 Disposta', '⚡ Energizada'];
const ANXIETY_LABELS = ['', '😌 Tranquila', '😐 Leve', '😟 Moderada', '😰 Alta', '😱 Muito alta'];
const APPETITE_OPTIONS = [
  { value: 'none', label: 'Sem apetite' },
  { value: 'low', label: 'Pouco apetite' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Muito apetite' },
];

export const MomWellnessDiary = () => {
  const { logs, isLoading, upsertLog, todayLog, weeklyAvg } = useMomWellness();

  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [pain, setPain] = useState(0);
  const [sleepHours, setSleepHours] = useState(6);
  const [appetite, setAppetite] = useState('normal');
  const [anxiety, setAnxiety] = useState(1);
  const [notes, setNotes] = useState('');

  // Load today's data if exists
  useEffect(() => {
    if (todayLog) {
      setMood(todayLog.mood);
      setEnergy(todayLog.energy);
      setPain(todayLog.pain);
      setSleepHours(todayLog.sleep_hours);
      setAppetite(todayLog.appetite);
      setAnxiety(todayLog.anxiety);
      setNotes(todayLog.notes || '');
    }
  }, [todayLog]);

  const handleSave = () => {
    upsertLog.mutate({
      log_date: new Date().toISOString().split('T')[0],
      mood,
      energy,
      pain,
      sleep_hours: sleepHours,
      appetite,
      anxiety,
      notes: notes || null,
    });
  };

  // Prepare chart data (reversed for chronological order)
  const chartData = [...logs]
    .reverse()
    .slice(-14)
    .map(log => ({
      date: format(new Date(log.log_date), 'dd/MM'),
      Humor: log.mood,
      Energia: log.energy,
      Ansiedade: log.anxiety,
      Dor: log.pain / 2, // Scale to match 0-5
    }));

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Daily check-in form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-pink-500" />
            Como você está hoje?
          </CardTitle>
          <CardDescription>
            {todayLog
              ? 'Você já registrou hoje — atualize se quiser'
              : 'Registre rapidamente como se sente'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Mood */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Heart className="h-4 w-4" /> Humor: {MOOD_LABELS[mood]}
            </Label>
            <Slider value={[mood]} onValueChange={([v]) => setMood(v)} min={1} max={5} step={1} />
          </div>

          {/* Energy */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4" /> Energia: {ENERGY_LABELS[energy]}
            </Label>
            <Slider
              value={[energy]}
              onValueChange={([v]) => setEnergy(v)}
              min={1}
              max={5}
              step={1}
            />
          </div>

          {/* Anxiety */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Brain className="h-4 w-4" /> Ansiedade: {ANXIETY_LABELS[anxiety]}
            </Label>
            <Slider
              value={[anxiety]}
              onValueChange={([v]) => setAnxiety(v)}
              min={1}
              max={5}
              step={1}
            />
          </div>

          {/* Pain */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Dor: {pain === 0 ? 'Nenhuma 😊' : `${pain}/10`}
            </Label>
            <Slider value={[pain]} onValueChange={([v]) => setPain(v)} min={0} max={10} step={1} />
          </div>

          {/* Sleep hours */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Moon className="h-4 w-4" /> Horas de sono: {sleepHours}h
            </Label>
            <Slider
              value={[sleepHours]}
              onValueChange={([v]) => setSleepHours(v)}
              min={0}
              max={14}
              step={0.5}
            />
          </div>

          {/* Appetite */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Utensils className="h-4 w-4" /> Apetite
            </Label>
            <Select value={appetite} onValueChange={setAppetite}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPETITE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <Textarea
            placeholder="Como foi seu dia? Algo que queira lembrar..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
          />

          <Button onClick={handleSave} disabled={upsertLog.isPending} className="w-full">
            {upsertLog.isPending
              ? 'Salvando...'
              : todayLog
                ? 'Atualizar registro'
                : 'Salvar registro'}
          </Button>
        </CardContent>
      </Card>

      {/* Weekly averages */}
      {weeklyAvg && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Médias da semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl">{MOOD_LABELS[Math.round(weeklyAvg.mood)].split(' ')[0]}</p>
                <p className="text-xs text-muted-foreground mt-1">Humor</p>
                <p className="text-sm font-medium">{weeklyAvg.mood}/5</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl">
                  {ENERGY_LABELS[Math.round(weeklyAvg.energy)].split(' ')[0]}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Energia</p>
                <p className="text-sm font-medium">{weeklyAvg.energy}/5</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl">😴</p>
                <p className="text-xs text-muted-foreground mt-1">Sono</p>
                <p className="text-sm font-medium">{weeklyAvg.sleep}h</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl">
                  {weeklyAvg.pain > 5 ? '😣' : weeklyAvg.pain > 2 ? '😕' : '😊'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Dor</p>
                <p className="text-sm font-medium">{weeklyAvg.pain}/10</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl">
                  {ANXIETY_LABELS[Math.round(weeklyAvg.anxiety)].split(' ')[0]}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Ansiedade</p>
                <p className="text-sm font-medium">{weeklyAvg.anxiety}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend chart */}
      {chartData.length >= 3 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tendência (últimos 14 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="Humor"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Energia"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Ansiedade"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
