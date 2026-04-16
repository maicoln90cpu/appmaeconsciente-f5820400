/**
 * @fileoverview Calculadora DPP (Data Provável do Parto)
 */

import { useState, useEffect } from 'react';

import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Baby,
  Clock,
  Heart,
  CheckCircle2,
  Circle,
  Loader2,
  Calculator,
  Target,
  Sparkles,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  usePregnancyInfo,
  calculateDueDate,
  calculateGestationalAge,
  PREGNANCY_MILESTONES,
} from '@/hooks/usePregnancyInfo';


import { cn } from '@/lib/utils';

export const DueDateCalculator = () => {
  const [lmpDate, setLmpDate] = useState('');
  const [ultrasoundDueDate, setUltrasoundDueDate] = useState('');
  const [dueSource, setDueSource] = useState<'lmp' | 'ultrasound'>('lmp');

  const {
    pregnancyInfo,
    isLoading,
    savePregnancyInfo,
    isSaving,
    getCurrentGestationalAge,
    getEffectiveDueDate,
    getDaysUntilDue,
    getCurrentTrimester,
    getCompletedMilestones,
    getNextMilestone,
  } = usePregnancyInfo();

  // Initialize form with existing data
  useEffect(() => {
    if (pregnancyInfo) {
      if (pregnancyInfo.last_menstrual_period) {
        setLmpDate(pregnancyInfo.last_menstrual_period);
      }
      if (pregnancyInfo.ultrasound_due_date) {
        setUltrasoundDueDate(pregnancyInfo.ultrasound_due_date);
      }
      setDueSource((pregnancyInfo.due_date_source as 'lmp' | 'ultrasound') || 'lmp');
    }
  }, [pregnancyInfo]);

  const handleCalculate = () => {
    const dueDate = lmpDate ? format(calculateDueDate(new Date(lmpDate)), 'yyyy-MM-dd') : undefined;

    savePregnancyInfo({
      last_menstrual_period: lmpDate || undefined,
      due_date: dueDate,
      due_date_source: dueSource,
      ultrasound_due_date: ultrasoundDueDate || undefined,
    });
  };

  const gestationalAge = getCurrentGestationalAge();
  const effectiveDueDate = getEffectiveDueDate();
  const daysUntilDue = getDaysUntilDue();
  const trimester = getCurrentTrimester();
  const completedMilestones = getCompletedMilestones();
  const nextMilestone = getNextMilestone();

  // Progress percentage (40 weeks = 100%)
  const progressPercent = gestationalAge ? Math.min(100, (gestationalAge.weeks / 40) * 100) : 0;

  // Trimester colors
  const trimesterColors = {
    1: 'text-pink-500',
    2: 'text-purple-500',
    3: 'text-blue-500',
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
      {/* Calculator Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calculadora DPP
          </CardTitle>
          <CardDescription>
            Data Provável do Parto (Regra de Naegele: DUM + 280 dias)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs
            defaultValue="lmp"
            value={dueSource}
            onValueChange={v => setDueSource(v as 'lmp' | 'ultrasound')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="lmp">Pela DUM</TabsTrigger>
              <TabsTrigger value="ultrasound">Por Ultrassom</TabsTrigger>
            </TabsList>

            <TabsContent value="lmp" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="lmp">Data da Última Menstruação (DUM)</Label>
                <Input
                  id="lmp"
                  type="date"
                  value={lmpDate}
                  onChange={e => setLmpDate(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Primeiro dia do último ciclo menstrual
                </p>
              </div>

              {lmpDate && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">DPP Calculada:</p>
                  <p className="text-2xl font-bold text-primary">
                    {format(calculateDueDate(new Date(lmpDate)), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ultrasound" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="ultrasound">DPP pelo Ultrassom</Label>
                <Input
                  id="ultrasound"
                  type="date"
                  value={ultrasoundDueDate}
                  onChange={e => setUltrasoundDueDate(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Data estimada informada no ultrassom
                </p>
              </div>

              <div>
                <Label htmlFor="lmp2">DUM (opcional)</Label>
                <Input
                  id="lmp2"
                  type="date"
                  value={lmpDate}
                  onChange={e => setLmpDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </TabsContent>
          </Tabs>

          <Button
            className="w-full"
            onClick={handleCalculate}
            disabled={isSaving || (!lmpDate && !ultrasoundDueDate)}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Salvar e Calcular
          </Button>
        </CardContent>
      </Card>

      {/* Countdown Card */}
      {effectiveDueDate && gestationalAge && (
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="pt-6 space-y-6">
            {/* Main Countdown */}
            <div className="text-center space-y-2">
              <Baby className="h-12 w-12 mx-auto text-primary" />
              <div className="space-y-1">
                <p className="text-muted-foreground">Seu bebê chega em aproximadamente</p>
                <p className="text-5xl font-bold text-primary">{daysUntilDue} dias</p>
                <p className="text-lg font-medium">
                  {format(parseISO(effectiveDueDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Gestational Age */}
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold">{gestationalAge.weeks}</p>
                <p className="text-sm text-muted-foreground">semanas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{gestationalAge.days}</p>
                <p className="text-sm text-muted-foreground">dias</p>
              </div>
            </div>

            {/* Trimester Badge */}
            {trimester && (
              <div className="flex justify-center">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-base px-4 py-1',
                    trimesterColors[trimester as keyof typeof trimesterColors]
                  )}
                >
                  {trimester}º Trimestre
                </Badge>
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso da gestação</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 semanas</span>
                <span>40 semanas</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones Timeline */}
      {gestationalAge && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Linha do Tempo da Gestação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Next Milestone Highlight */}
            {nextMilestone && (
              <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">Próximo Marco</span>
                </div>
                <p className="font-medium">
                  Semana {nextMilestone.week}: {nextMilestone.title}
                </p>
                <p className="text-sm text-muted-foreground">{nextMilestone.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Faltam {nextMilestone.week - gestationalAge.weeks} semanas
                </p>
              </div>
            )}

            <ScrollArea className="h-64">
              <div className="space-y-4">
                {PREGNANCY_MILESTONES.map(milestone => {
                  const isCompleted = milestone.week <= gestationalAge.weeks;
                  const isCurrent = milestone.week === gestationalAge.weeks;

                  return (
                    <div
                      key={milestone.week}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg transition-colors',
                        isCompleted && 'bg-primary/5',
                        isCurrent && 'bg-primary/10 ring-1 ring-primary'
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Semana {milestone.week}</span>
                          {isCurrent && (
                            <Badge variant="default" className="text-xs">
                              Você está aqui
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold text-sm">{milestone.title}</p>
                        <p className="text-xs text-muted-foreground">{milestone.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!pregnancyInfo?.last_menstrual_period && !pregnancyInfo?.due_date && (
        <Card className="bg-muted/50">
          <CardContent className="py-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Configure sua DPP</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Insira a data da sua última menstruação ou a DPP informada pelo seu médico para
              começar a acompanhar sua gestação.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
