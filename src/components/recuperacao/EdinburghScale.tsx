/**
 * @fileoverview Escala de Depressão Pós-Natal de Edinburgh (EPDS)
 */

import { useState } from 'react';

import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Heart,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Calendar,
  TrendingDown,
  TrendingUp,
  Loader2,
  Info,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

import { useEmotionalLogs } from '@/hooks/postpartum/useEmotionalLogs';


import { cn } from '@/lib/utils';


// Questões da Escala de Edinburgh
const EDINBURGH_QUESTIONS = [
  {
    id: 1,
    question: 'Eu tenho sido capaz de rir e achar graça das coisas',
    options: [
      { value: 0, label: 'Como eu sempre fiz' },
      { value: 1, label: 'Não tanto quanto antes' },
      { value: 2, label: 'Sem dúvida, menos que antes' },
      { value: 3, label: 'De jeito nenhum' },
    ],
  },
  {
    id: 2,
    question: 'Eu sinto prazer quando penso no que está por acontecer no meu dia a dia',
    options: [
      { value: 0, label: 'Como sempre senti' },
      { value: 1, label: 'Talvez menos do que antes' },
      { value: 2, label: 'Com certeza menos' },
      { value: 3, label: 'De jeito nenhum' },
    ],
  },
  {
    id: 3,
    question: 'Eu tenho me culpado sem necessidade quando as coisas saem erradas',
    options: [
      { value: 3, label: 'Sim, na maioria das vezes' },
      { value: 2, label: 'Sim, algumas vezes' },
      { value: 1, label: 'Não com muita frequência' },
      { value: 0, label: 'Não, nunca' },
    ],
  },
  {
    id: 4,
    question: 'Eu tenho me sentido ansiosa ou preocupada sem uma boa razão',
    options: [
      { value: 0, label: 'Não, de maneira alguma' },
      { value: 1, label: 'Pouquíssimas vezes' },
      { value: 2, label: 'Sim, às vezes' },
      { value: 3, label: 'Sim, muito frequentemente' },
    ],
  },
  {
    id: 5,
    question: 'Eu tenho me sentido assustada ou em pânico sem um bom motivo',
    options: [
      { value: 3, label: 'Sim, bastante' },
      { value: 2, label: 'Sim, às vezes' },
      { value: 1, label: 'Não, não muito' },
      { value: 0, label: 'Não, de jeito nenhum' },
    ],
  },
  {
    id: 6,
    question: 'Eu tenho me sentido sobrecarregada pelas tarefas e acontecimentos do meu dia a dia',
    options: [
      { value: 3, label: 'Sim. Na maioria das vezes não consigo lidar bem com eles' },
      { value: 2, label: 'Sim. Algumas vezes não consigo lidar tão bem' },
      { value: 1, label: 'Não. Na maioria das vezes consigo lidar bem' },
      { value: 0, label: 'Não. Consigo lidar com eles tão bem quanto antes' },
    ],
  },
  {
    id: 7,
    question: 'Eu tenho me sentido tão infeliz que tenho tido dificuldade para dormir',
    options: [
      { value: 3, label: 'Sim, na maioria das vezes' },
      { value: 2, label: 'Sim, algumas vezes' },
      { value: 1, label: 'Não com muita frequência' },
      { value: 0, label: 'Não, de jeito nenhum' },
    ],
  },
  {
    id: 8,
    question: 'Eu tenho me sentido triste ou muito mal',
    options: [
      { value: 3, label: 'Sim, na maioria das vezes' },
      { value: 2, label: 'Sim, muitas vezes' },
      { value: 1, label: 'Não com muita frequência' },
      { value: 0, label: 'Não, de jeito nenhum' },
    ],
  },
  {
    id: 9,
    question: 'Eu tenho me sentido tão infeliz que tenho chorado',
    options: [
      { value: 3, label: 'Sim, na maioria das vezes' },
      { value: 2, label: 'Sim, muitas vezes' },
      { value: 1, label: 'De vez em quando' },
      { value: 0, label: 'Não, nunca' },
    ],
  },
  {
    id: 10,
    question: 'A ideia de fazer mal a mim mesma passou por minha cabeça',
    options: [
      { value: 3, label: 'Sim, muitas vezes, ultimamente' },
      { value: 2, label: 'Algumas vezes nos últimos dias' },
      { value: 1, label: 'Pouquíssimas vezes, ultimamente' },
      { value: 0, label: 'Nunca' },
    ],
    isCritical: true,
  },
];

interface ScoreInterpretation {
  level: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const getScoreInterpretation = (score: number): ScoreInterpretation => {
  if (score < 10) {
    return {
      level: 'low',
      title: 'Baixo risco',
      description:
        'Seus resultados indicam que você está se sentindo bem emocionalmente. Continue cuidando de si mesma!',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    };
  } else if (score < 13) {
    return {
      level: 'medium',
      title: 'Atenção necessária',
      description:
        'Seus resultados sugerem alguns sinais de ansiedade ou tristeza. Considere conversar com alguém de confiança ou um profissional.',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    };
  } else {
    return {
      level: 'high',
      title: 'Risco aumentado',
      description:
        'Seus resultados indicam risco de depressão pós-parto. É muito importante buscar ajuda profissional. Você não está sozinha!',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
    };
  }
};

export const EdinburghScale = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { logs, isLoading, addLog } = useEmotionalLogs();

  const handleAnswer = (value: number) => {
    setAnswers({ ...answers, [currentQuestion]: value });
  };

  const handleNext = () => {
    if (currentQuestion < EDINBURGH_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
    setIsSubmitting(true);

    // Determine mood based on score
    let mood = 'neutral';
    if (totalScore < 10) mood = 'happy';
    else if (totalScore < 13) mood = 'anxious';
    else mood = 'sad';

    addLog({
      mood,
      edinburgh_score: totalScore,
      notes: notes || undefined,
      date: format(new Date(), 'yyyy-MM-dd'),
    });

    setIsSubmitting(false);
    setShowResult(true);
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setNotes('');
    setShowResult(false);
  };

  const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
  const interpretation = getScoreInterpretation(totalScore);

  // Prepare chart data from logs
  const chartData = [...(logs || [])]
    .filter(log => log.edinburgh_score !== null)
    .slice(0, 10)
    .reverse()
    .map(log => ({
      date: format(parseISO(log.date), 'dd/MM', { locale: ptBR }),
      score: log.edinburgh_score,
    }));

  // Get trend
  const getTrend = () => {
    if (!logs || logs.length < 2) return null;
    const recentLogs = logs.filter(l => l.edinburgh_score !== null).slice(0, 5);
    if (recentLogs.length < 2) return null;

    const avgRecent = recentLogs.slice(0, 2).reduce((s, l) => s + (l.edinburgh_score || 0), 0) / 2;
    const avgOlder = recentLogs.slice(-2).reduce((s, l) => s + (l.edinburgh_score || 0), 0) / 2;

    if (avgRecent < avgOlder - 1) return 'improving';
    if (avgRecent > avgOlder + 1) return 'declining';
    return 'stable';
  };

  const trend = getTrend();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Result Screen
  if (showResult) {
    return (
      <div className="space-y-6">
        <Card className={cn('border-2', interpretation.bgColor)}>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              {interpretation.level === 'low' && (
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
              )}
              {interpretation.level === 'medium' && (
                <AlertTriangle className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
              )}
              {interpretation.level === 'high' && (
                <Heart className="h-16 w-16 mx-auto text-red-500 mb-4 animate-pulse" />
              )}

              <p className="text-sm text-muted-foreground mb-2">Sua pontuação</p>
              <p className={cn('text-5xl font-bold', interpretation.color)}>{totalScore}/30</p>
              <Badge variant="outline" className={cn('mt-3', interpretation.color)}>
                {interpretation.title}
              </Badge>
            </div>

            <p className="text-center text-muted-foreground">{interpretation.description}</p>

            {interpretation.level === 'high' && (
              <Alert variant="destructive">
                <Phone className="h-4 w-4" />
                <AlertTitle>Precisa de ajuda?</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">
                    CVV (Centro de Valorização da Vida): <strong>188</strong>
                  </p>
                  <p>
                    Ligue ou acesse{' '}
                    <a href="https://cvv.org.br" className="underline" target="_blank">
                      cvv.org.br
                    </a>
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleReset}>
                Fazer Novamente
              </Button>
              <Button className="flex-1" onClick={() => setShowResult(false)}>
                Ver Histórico
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Escala de Edinburgh</h3>
              <p className="text-sm text-muted-foreground">
                Este questionário ajuda a identificar sinais de depressão pós-parto. Responda
                pensando em como você se sentiu nos <strong>últimos 7 dias</strong>, não apenas
                hoje.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline">
              Pergunta {currentQuestion + 1} de {EDINBURGH_QUESTIONS.length}
            </Badge>
            {EDINBURGH_QUESTIONS[currentQuestion].isCritical && (
              <Badge variant="destructive">Importante</Badge>
            )}
          </div>
          <Progress
            value={((currentQuestion + 1) / EDINBURGH_QUESTIONS.length) * 100}
            className="h-2"
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg font-medium">{EDINBURGH_QUESTIONS[currentQuestion].question}</p>

          <RadioGroup
            value={answers[currentQuestion]?.toString()}
            onValueChange={v => handleAnswer(parseInt(v))}
            className="space-y-3"
          >
            {EDINBURGH_QUESTIONS[currentQuestion].options.map(option => (
              <div
                key={option.value}
                className={cn(
                  'flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer',
                  answers[currentQuestion] === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-primary/50'
                )}
                onClick={() => handleAnswer(option.value)}
              >
                <RadioGroupItem
                  value={option.value.toString()}
                  id={`q${currentQuestion}-${option.value}`}
                />
                <Label
                  htmlFor={`q${currentQuestion}-${option.value}`}
                  className="flex-1 cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {currentQuestion === EDINBURGH_QUESTIONS.length - 1 && (
            <div className="pt-4 border-t">
              <Label htmlFor="notes">Observações adicionais (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Como você está se sentindo? Algo que queira registrar?"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="mt-2"
              />
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              onClick={handleNext}
              disabled={answers[currentQuestion] === undefined || isSubmitting}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {currentQuestion === EDINBURGH_QUESTIONS.length - 1 ? 'Finalizar' : 'Próxima'}
              {currentQuestion < EDINBURGH_QUESTIONS.length - 1 && (
                <ChevronRight className="h-4 w-4 ml-1" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History & Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Histórico de Avaliações
              </CardTitle>
              {trend && (
                <Badge
                  variant={
                    trend === 'improving'
                      ? 'default'
                      : trend === 'declining'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {trend === 'improving' && <TrendingDown className="h-3 w-3 mr-1" />}
                  {trend === 'declining' && <TrendingUp className="h-3 w-3 mr-1" />}
                  {trend === 'improving'
                    ? 'Melhorando'
                    : trend === 'declining'
                      ? 'Atenção'
                      : 'Estável'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis domain={[0, 30]} fontSize={12} />
                  <Tooltip />
                  <ReferenceLine y={10} stroke="#eab308" strokeDasharray="3 3" label="Atenção" />
                  <ReferenceLine y={13} stroke="#ef4444" strokeDasharray="3 3" label="Risco" />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <ScrollArea className="h-40 mt-4">
              <div className="space-y-2">
                {logs
                  ?.filter(l => l.edinburgh_score !== null)
                  .slice(0, 10)
                  .map(log => {
                    const interp = getScoreInterpretation(log.edinburgh_score || 0);
                    return (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <span className="text-sm">
                          {format(parseISO(log.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        <Badge variant="outline" className={interp.color}>
                          {log.edinburgh_score}/30
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
