import { useState, useEffect, useRef } from 'react';

import { X, ArrowRight, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTooltipProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingTooltip = ({
  steps,
  isActive,
  onComplete,
  onSkip,
}: OnboardingTooltipProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    if (!isActive || !step) {
      setIsVisible(false);
      return;
    }

    const targetElement = document.querySelector(step.target);
    if (!targetElement) {
      console.warn(`OnboardingTooltip: Target element "${step.target}" not found`);
      return;
    }

    // Highlight target element
    targetElement.classList.add('onboarding-highlight');

    // Calculate position
    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 300;
    const tooltipHeight = 150;
    const padding = 12;

    let top = 0;
    let left = 0;

    switch (step.position || 'bottom') {
      case 'top':
        top = rect.top - tooltipHeight - padding + window.scrollY;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + padding + window.scrollY;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        left = rect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        left = rect.right + padding;
        break;
    }

    // Keep tooltip within viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, top);

    setPosition({ top, left });
    setIsVisible(true);

    // Scroll target into view
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    return () => {
      targetElement.classList.remove('onboarding-highlight');
    };
  }, [currentStep, isActive, step]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isActive || !isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={onSkip} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          'fixed z-[9999] w-[300px] bg-popover border rounded-lg shadow-lg p-4',
          'animate-in fade-in-0 zoom-in-95 duration-200'
        )}
        style={{ top: position.top, left: position.left }}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6"
          onClick={onSkip}
        >
          <X className="h-3 w-3" />
        </Button>

        {/* Content */}
        <div className="pr-6">
          <h4 className="font-semibold text-sm mb-1">{step.title}</h4>
          <p className="text-xs text-muted-foreground">{step.content}</p>
        </div>

        {/* Progress and navigation */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} de {steps.length}
          </span>

          <div className="flex gap-2">
            {!isFirstStep && (
              <Button variant="ghost" size="sm" onClick={handlePrev}>
                <ArrowLeft className="h-3 w-3 mr-1" />
                Anterior
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {isLastStep ? 'Concluir' : 'Próximo'}
              {!isLastStep && <ArrowRight className="h-3 w-3 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

// CSS to add in index.css
// .onboarding-highlight {
//   position: relative;
//   z-index: 9999 !important;
//   box-shadow: 0 0 0 4px hsl(var(--primary) / 0.5), 0 0 20px hsl(var(--primary) / 0.3);
//   border-radius: 8px;
// }
