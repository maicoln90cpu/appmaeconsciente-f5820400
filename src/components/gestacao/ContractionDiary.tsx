/**
 * @fileoverview Diário de Contrações com Timer
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useContractions } from '@/hooks/useContractions';
import {
  Timer,
  Play,
  Square,
  AlertTriangle,
  Clock,
  Activity,
  Trash2,
  Hospital,
  Loader2,
} from 'lucide-react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export const ContractionDiary = () => {
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState('');

  const {
    contractions,
    isLoading,
    isTimerRunning,
    timerSeconds,
    currentSessionId,
    startTimer,
    stopTimer,
    endSession,
    deleteContraction,
    getSessionStats,
    checkHospitalAlert,
  } = useContractions();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStopTimer = () => {
    setShowEndDialog(true);
  };

  const handleSaveContraction = () => {
    stopTimer(intensity, notes);
    setShowEndDialog(false);
    setIntensity(5);
    setNotes('');
  };

  const hospitalAlert = checkHospitalAlert();
  const sessionStats = currentSessionId ? getSessionStats(currentSessionId) : null;

  // Group contractions by session
  const sessionMap = new Map<string, typeof contractions>();
  contractions.forEach(c => {
    const key = c.session_id || 'sem-sessao';
    if (!sessionMap.has(key)) {
      sessionMap.set(key, []);
    }
    sessionMap.get(key)!.push(c);
  });

  const getIntervalFromPrevious = (index: number, list: typeof contractions) => {
    if (index >= list.length - 1) return null;
    const current = new Date(list[index].start_time);
    const previous = new Date(list[index + 1].start_time);
    return differenceInMinutes(current, previous);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hospital Alert */}
      {hospitalAlert && (
        <Alert
          variant={hospitalAlert.type === 'hospital' ? 'destructive' : 'default'}
          className="border-2"
        >
          <Hospital className="h-5 w-5" />
          <AlertTitle className="text-lg">
            {hospitalAlert.type === 'hospital' ? '🏥 Hora de ir ao hospital!' : '⚠️ Atenção'}
          </AlertTitle>
          <AlertDescription className="text-base">{hospitalAlert.message}</AlertDescription>
        </Alert>
      )}

      {/* Timer Card */}
      <Card
        className={cn(
          'transition-all duration-300',
          isTimerRunning && 'ring-2 ring-primary ring-offset-2 bg-primary/5'
        )}
      >
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Timer className="h-6 w-6" />
            Cronômetro de Contrações
          </CardTitle>
          <CardDescription>Pressione iniciar quando a contração começar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer Display */}
          <div className="text-center">
            <div
              className={cn(
                'text-7xl font-mono font-bold tabular-nums transition-colors',
                isTimerRunning ? 'text-primary animate-pulse' : 'text-muted-foreground'
              )}
            >
              {formatTime(timerSeconds)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {isTimerRunning ? 'Contração em andamento...' : 'Pronto para iniciar'}
            </p>
          </div>

          {/* Timer Button */}
          <div className="flex justify-center">
            {!isTimerRunning ? (
              <Button size="lg" className="h-20 w-20 rounded-full text-xl" onClick={startTimer}>
                <Play className="h-8 w-8" />
              </Button>
            ) : (
              <Button
                size="lg"
                variant="destructive"
                className="h-20 w-20 rounded-full text-xl animate-pulse"
                onClick={handleStopTimer}
              >
                <Square className="h-8 w-8" />
              </Button>
            )}
          </div>

          {/* Session Stats */}
          {sessionStats && sessionStats.count > 1 && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{sessionStats.count}</p>
                <p className="text-xs text-muted-foreground">Contrações</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{sessionStats.avgDuration}s</p>
                <p className="text-xs text-muted-foreground">Duração média</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{sessionStats.avgInterval}min</p>
                <p className="text-xs text-muted-foreground">Intervalo médio</p>
              </div>
            </div>
          )}

          {/* End Session Button */}
          {currentSessionId && contractions.some(c => c.session_id === currentSessionId) && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={endSession}>
                Encerrar Sessão
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Regra 5-1-1 (Quando ir ao hospital)
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • Contrações a cada <strong>5 minutos</strong> ou menos
            </li>
            <li>
              • Durando pelo menos <strong>1 minuto</strong> cada
            </li>
            <li>
              • Por pelo menos <strong>1 hora</strong>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Histórico de Contrações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contractions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma contração registrada ainda.</p>
              <p className="text-sm">Use o cronômetro acima para começar.</p>
            </div>
          ) : (
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {contractions.map((contraction, index) => (
                  <div
                    key={contraction.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {format(parseISO(contraction.start_time), 'HH:mm', { locale: ptBR })}
                        </p>
                        <Badge variant="secondary">{contraction.duration_seconds}s</Badge>
                        {contraction.intensity && (
                          <Badge variant={contraction.intensity >= 7 ? 'destructive' : 'outline'}>
                            Intensidade: {contraction.intensity}/10
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>
                          {format(parseISO(contraction.start_time), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        {getIntervalFromPrevious(index, contractions) && (
                          <span>
                            • Intervalo: {getIntervalFromPrevious(index, contractions)} min
                          </span>
                        )}
                      </div>
                      {contraction.notes && (
                        <p className="text-xs text-muted-foreground mt-1">📝 {contraction.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteContraction(contraction.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* End Contraction Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Contração</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <Label>Duração</Label>
              <p className="text-3xl font-mono font-bold text-primary">
                {formatTime(timerSeconds)}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Intensidade</Label>
                <span className="text-sm font-medium">{intensity}/10</span>
              </div>
              <Slider
                value={[intensity]}
                onValueChange={v => setIntensity(v[0])}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Leve</span>
                <span>Moderada</span>
                <span>Forte</span>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Input
                id="notes"
                placeholder="Ex: Dor nas costas, posição..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleSaveContraction}>
              Salvar Contração
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
