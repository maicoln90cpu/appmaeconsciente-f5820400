import { useState } from 'react';

import { AlertCircle, Heart, Baby, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OnboardingMonitorProps {
  open: boolean;
  onComplete: () => void;
}

const ONBOARDING_STEPS = [
  {
    title: 'Bem-vinda ao Monitor de Desenvolvimento! 💕',
    icon: Heart,
    content: (
      <div className="space-y-4">
        <p className="text-foreground">
          Este é um espaço de acompanhamento com amor, não de comparação ou paranoia.
        </p>
        <Alert className="border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-950/20">
          <AlertCircle className="h-4 w-4 text-pink-600 dark:text-pink-400" />
          <AlertTitle className="text-pink-800 dark:text-pink-300">Importante saber</AlertTitle>
          <AlertDescription className="text-pink-700 dark:text-pink-400">
            Cada bebê tem seu próprio ritmo único e especial. As idades apresentadas são referências
            médias, não regras absolutas.
          </AlertDescription>
        </Alert>
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">Este monitor foi criado para:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Celebrar cada conquista do seu bebê</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Registrar momentos especiais com fotos e vídeos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Facilitar a conversa com o pediatra</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Dar dicas de estímulo respeitoso</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: 'Áreas do Desenvolvimento',
    icon: Baby,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Acompanhamos 5 áreas principais do desenvolvimento infantil:
        </p>
        <div className="grid gap-3">
          <Card className="border-l-4 border-l-chart-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🦵</span>
                <h4 className="font-semibold text-foreground">Motor Grosso</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Grandes movimentos: rolar, sentar, engatinhar, andar
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-chart-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">✋</span>
                <h4 className="font-semibold text-foreground">Motor Fino</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Movimentos precisos: pegar objetos, pinça, encaixar
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-chart-3">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🗣️</span>
                <h4 className="font-semibold text-foreground">Linguagem</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Comunicação: balbucios, primeiras palavras, frases
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-chart-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🧠</span>
                <h4 className="font-semibold text-foreground">Cognitivo</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Pensamento: causa-efeito, permanência do objeto, resolução
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-chart-5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">💞</span>
                <h4 className="font-semibold text-foreground">Social/Emocional</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Interação: sorrisos, apego, empatia, imitação
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    title: 'Como Usar com Amor e Sem Paranoia',
    icon: BookOpen,
    content: (
      <div className="space-y-4">
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Lembre-se sempre</AlertTitle>
          <AlertDescription className="text-amber-700">
            Prematuridade, estimulação, temperamento e individualidade influenciam o ritmo. Não
            compare, apenas observe e celebre!
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">1</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Registre as conquistas</h4>
              <p className="text-sm text-muted-foreground">
                Quando seu bebê alcançar um marco, marque como alcançado e adicione uma foto
                especial
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">2</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Use as dicas de estímulo</h4>
              <p className="text-sm text-muted-foreground">
                Cada marco tem sugestões de atividades respeitosas para fazer com seu bebê
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">3</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Configure alertas gentis</h4>
              <p className="text-sm text-muted-foreground">
                Receba lembretes carinhosos se algum marco precisar de atenção
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">4</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                Leve ao pediatra quando necessário
              </h4>
              <p className="text-sm text-muted-foreground">
                Gere relatórios para facilitar a conversa nas consultas
              </p>
            </div>
          </div>
        </div>

        <Alert className="border-pink-200 bg-pink-50">
          <Heart className="h-4 w-4 text-pink-600" />
          <AlertDescription className="text-pink-700">
            <strong>Confie no seu instinto materno.</strong> Se algo te preocupa, mesmo que não
            esteja "atrasado", converse com o pediatra. Você conhece seu bebê melhor que ninguém.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
];

export const OnboardingMonitor = ({ open, onComplete }: OnboardingMonitorProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = ONBOARDING_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <Dialog open={open} onOpenChange={open => !open && onComplete()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <StepIcon className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">{step.title}</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Passo {currentStep + 1} de {ONBOARDING_STEPS.length} do tutorial do Monitor de
            Desenvolvimento
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">{step.content}</div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-1">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep === ONBOARDING_STEPS.length - 1 ? (
                'Começar'
              ) : (
                <>
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
