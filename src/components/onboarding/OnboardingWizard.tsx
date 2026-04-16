import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import { useOnboarding, ONBOARDING_STEPS } from '@/hooks/useOnboarding';
import { useProfile } from '@/hooks/useProfile';

const WIZARD_STEPS = [
  {
    title: 'Bem-vinda ao Mãe Consciente! 🌸',
    description:
      'Estamos muito felizes em ter você aqui. Vamos te guiar pelos primeiros passos para aproveitar ao máximo nossa plataforma.',
    image: '👶',
  },
  {
    title: 'Organize seu Enxoval 🛍️',
    description:
      'Planeje e acompanhe todas as compras do enxoval do seu bebê com controle de orçamento e listas inteligentes.',
    image: '📋',
  },
  {
    title: 'Acompanhe o Desenvolvimento 📈',
    description:
      'Registre mamadas, sono e marcos de desenvolvimento. Visualize relatórios e compartilhe com o pediatra.',
    image: '📊',
  },
  {
    title: 'Conecte-se com outras Mães 👥',
    description:
      'Participe de nossa comunidade acolhedora, compartilhe experiências e receba apoio de outras mães.',
    image: '💬',
  },
  {
    title: 'Vamos Começar! 🚀',
    description:
      'Complete os primeiros passos para desbloquear conquistas e fazer parte da nossa comunidade!',
    image: '🏆',
  },
];

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
}

export const OnboardingWizard = ({ open, onClose }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  const { skipOnboarding } = useOnboarding();

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleSkip = async () => {
    await skipOnboarding();
    onClose();
  };

  const handleStart = () => {
    onClose();
    navigate('/dashboard');
  };

  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;
  const step = WIZARD_STEPS[currentStep];
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Progress bar */}
        <div className="px-6 pt-4">
          <Progress value={progress} className="h-1" />
        </div>

        {/* Close/Skip button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 h-8 w-8"
          onClick={handleSkip}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Pular onboarding</span>
        </Button>

        {/* Content */}
        <div
          className={cn(
            'px-6 py-8 transition-all duration-150',
            isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
          )}
        >
          {/* Emoji/Image */}
          <div className="text-center mb-6">
            <span className="text-7xl block animate-bounce-slow">{step.image}</span>
          </div>

          <DialogHeader className="text-center space-y-3">
            <DialogTitle className="text-2xl font-bold">{step.title}</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {step.description}
            </DialogDescription>
          </DialogHeader>

          {/* Last step: Show checklist preview */}
          {isLastStep && (
            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium text-center mb-3">Seus primeiros passos:</p>
              <div className="space-y-2">
                {ONBOARDING_STEPS.slice(0, 3).map(item => (
                  <div
                    key={item.key}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm">{item.title}</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground text-center">
                  +{ONBOARDING_STEPS.length - 3} mais...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 pb-4">
          {WIZARD_STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                'h-2 rounded-full transition-all',
                index === currentStep
                  ? 'w-6 bg-primary'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
              aria-label={`Ir para passo ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center p-4 bg-muted/30 border-t">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          {isLastStep ? (
            <Button onClick={handleStart} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Começar!
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-1">
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
