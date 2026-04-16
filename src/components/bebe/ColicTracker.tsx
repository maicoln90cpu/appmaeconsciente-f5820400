import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Timer, TrendingDown, AlertTriangle, Clock, Frown } from 'lucide-react';
import { useBabyColic, COLIC_TRIGGERS, RELIEF_METHODS } from '@/hooks/useBabyColic';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ColicTrackerProps {
  babyProfileId?: string;
}

export const ColicTracker = ({ babyProfileId }: ColicTrackerProps) => {
  const { colicLogs, stats, isLoading, addColicLog, updateColicLog, isAdding } =
    useBabyColic(babyProfileId);
  const [isOpen, setIsOpen] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    intensity: 3,
    triggers: [] as string[],
    relief_methods: [] as string[],
    notes: '',
  });

  const handleStartTimer = () => {
    setIsTimerActive(true);
    setTimerStart(new Date());
  };

  const handleStopTimer = () => {
    if (!timerStart) return;

    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - timerStart.getTime()) / 60000);

    addColicLog({
      baby_profile_id: babyProfileId,
      start_time: timerStart.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      intensity: formData.intensity,
      triggers: formData.triggers,
      relief_methods: formData.relief_methods,
      notes: formData.notes || null,
    });

    setIsTimerActive(false);
    setTimerStart(null);
    setFormData({ intensity: 3, triggers: [], relief_methods: [], notes: '' });
    setIsOpen(false);
  };

  const handleManualEntry = () => {
    addColicLog({
      baby_profile_id: babyProfileId,
      start_time: new Date().toISOString(),
      intensity: formData.intensity,
      triggers: formData.triggers,
      relief_methods: formData.relief_methods,
      notes: formData.notes || null,
    });

    setFormData({ intensity: 3, triggers: [], relief_methods: [], notes: '' });
    setIsOpen(false);
  };

  const toggleTrigger = (trigger: string) => {
    setFormData(prev => ({
      ...prev,
      triggers: prev.triggers.includes(trigger)
        ? prev.triggers.filter(t => t !== trigger)
        : [...prev.triggers, trigger],
    }));
  };

  const toggleRelief = (method: string) => {
    setFormData(prev => ({
      ...prev,
      relief_methods: prev.relief_methods.includes(method)
        ? prev.relief_methods.filter(m => m !== method)
        : [...prev.relief_methods, method],
    }));
  };

  if (isLoading) {
    return <Card className="animate-pulse h-64" />;
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardContent className="p-4 text-center">
            <Frown className="h-6 w-6 mx-auto text-rose-600 mb-1" />
            <p className="text-2xl font-bold text-rose-700">{stats?.episodesThisWeek || 0}</p>
            <p className="text-xs text-rose-600">Esta semana</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-amber-600 mb-1" />
            <p className="text-2xl font-bold text-amber-700">
              {Math.round(stats?.averageDuration || 0)}m
            </p>
            <p className="text-xs text-amber-600">Duração média</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto text-purple-600 mb-1" />
            <p className="text-sm font-bold text-purple-700 truncate">
              {stats?.mostCommonTrigger || '-'}
            </p>
            <p className="text-xs text-purple-600">Gatilho comum</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-6 w-6 mx-auto text-emerald-600 mb-1" />
            <p className="text-sm font-bold text-emerald-700 truncate">
              {stats?.mostEffectiveRelief || '-'}
            </p>
            <p className="text-xs text-emerald-600">Alívio eficaz</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Frown className="h-5 w-5 text-rose-500" />
              Rastreador de Cólicas
            </CardTitle>
            <CardDescription>Registre e analise os episódios de cólica</CardDescription>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                {isTimerActive ? (
                  <Timer className="h-4 w-4 animate-pulse" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isTimerActive ? 'Em andamento' : 'Registrar'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isTimerActive ? 'Episódio em andamento' : 'Registrar Cólica'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {!isTimerActive && (
                  <div className="flex gap-2">
                    <Button onClick={handleStartTimer} variant="outline" className="flex-1 gap-2">
                      <Timer className="h-4 w-4" />
                      Iniciar Timer
                    </Button>
                    <Button onClick={handleManualEntry} className="flex-1" disabled={isAdding}>
                      Registro Rápido
                    </Button>
                  </div>
                )}

                {isTimerActive && timerStart && (
                  <div className="text-center p-4 bg-rose-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Iniciado há</p>
                    <p className="text-3xl font-bold text-rose-600">
                      {formatDistanceToNow(timerStart, { locale: ptBR })}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Intensidade: {formData.intensity}/5</Label>
                  <Slider
                    value={[formData.intensity]}
                    onValueChange={([v]) => setFormData(prev => ({ ...prev, intensity: v }))}
                    min={1}
                    max={5}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Leve</span>
                    <span>Intenso</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Possíveis Gatilhos</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLIC_TRIGGERS.map(trigger => (
                      <Badge
                        key={trigger}
                        variant={formData.triggers.includes(trigger) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTrigger(trigger)}
                      >
                        {trigger}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Métodos de Alívio Tentados</Label>
                  <div className="flex flex-wrap gap-2">
                    {RELIEF_METHODS.map(method => (
                      <Badge
                        key={method}
                        variant={formData.relief_methods.includes(method) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleRelief(method)}
                      >
                        {method}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Algo mais que você observou..."
                    rows={2}
                  />
                </div>

                {isTimerActive && (
                  <Button
                    onClick={handleStopTimer}
                    className="w-full bg-rose-600 hover:bg-rose-700"
                  >
                    Parar e Salvar
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[300px]">
            {colicLogs && colicLogs.length > 0 ? (
              <div className="space-y-3">
                {colicLogs.slice(0, 10).map(log => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                      <span className="text-lg">
                        {log.intensity && log.intensity >= 4
                          ? '😭'
                          : log.intensity && log.intensity >= 2
                            ? '😢'
                            : '😿'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {format(new Date(log.start_time), 'dd/MM HH:mm', { locale: ptBR })}
                        </span>
                        {log.duration_minutes && (
                          <Badge variant="secondary" className="text-xs">
                            {log.duration_minutes}min
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            log.intensity && log.intensity >= 4
                              ? 'border-rose-500 text-rose-600'
                              : log.intensity && log.intensity >= 2
                                ? 'border-amber-500 text-amber-600'
                                : 'border-green-500 text-green-600'
                          }
                        >
                          {log.intensity}/5
                        </Badge>
                      </div>
                      {log.triggers && log.triggers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {log.triggers.map(t => (
                            <span
                              key={t}
                              className="text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {log.notes && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">{log.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Frown className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum episódio registrado</p>
                <p className="text-sm">Use o botão acima para começar</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
