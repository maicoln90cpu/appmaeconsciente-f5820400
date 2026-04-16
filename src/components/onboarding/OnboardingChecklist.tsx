import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ChevronRight, Sparkles, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import { useOnboarding } from '@/hooks/useOnboarding';

interface OnboardingChecklistProps {
  onDismiss?: () => void;
  compact?: boolean;
}

export const OnboardingChecklist = ({ onDismiss, compact = false }: OnboardingChecklistProps) => {
  const { steps, progress, isComplete, skipOnboarding } = useOnboarding();

  const handleDismiss = async () => {
    await skipOnboarding();
    onDismiss?.();
  };

  if (isComplete) return null;

  if (compact) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Primeiros Passos</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {steps.filter(s => s.completed).length}/{steps.length}
            </span>
          </div>
          <Progress value={progress} className="h-1.5 mb-3" />
          <div className="flex flex-wrap gap-2">
            {steps
              .filter(s => !s.completed)
              .slice(0, 2)
              .map(step => (
                <Button key={step.key} variant="outline" size="sm" asChild className="h-8 text-xs">
                  <Link to={step.path || '#'}>
                    <span className="mr-1">{step.icon}</span>
                    {step.title}
                  </Link>
                </Button>
              ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Primeiros Passos</CardTitle>
              <CardDescription>Complete para desbloquear o badge "Bem-vinda!"</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mr-2 -mt-2"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dispensar</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map(step => (
            <Link
              key={step.key}
              to={step.path || '#'}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-all',
                'hover:bg-muted/50',
                step.completed ? 'bg-primary/5 text-muted-foreground' : 'bg-muted/30'
              )}
            >
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}

              <span className="text-xl shrink-0">{step.icon}</span>

              <div className="flex-1 min-w-0">
                <p className={cn('font-medium text-sm', step.completed && 'line-through')}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">{step.description}</p>
              </div>

              {!step.completed && (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </Link>
          ))}
        </div>

        {/* Reward hint */}
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <span className="text-xl">🏆</span>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Complete todos os passos para ganhar <strong>50 XP</strong> e o badge "Bem-vinda!"
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
