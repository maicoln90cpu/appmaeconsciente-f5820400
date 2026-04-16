import { useState } from 'react';

import { Loader2, ChevronRight, ChevronLeft, Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { useProfile } from '@/hooks/useProfile';
import { useToolSuggestions, type ToolSuggestionFormData } from '@/hooks/useToolSuggestions';


interface ToolSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INTEGRATION_OPTIONS = [
  'WhatsApp',
  'Email',
  'PDF',
  'Calendário',
  'Notificações Push',
  'Inteligência Artificial',
  'Compartilhamento Social',
  'Outro',
];

const PHASE_OPTIONS = [
  'Planejamento',
  '1º Trimestre',
  '2º Trimestre',
  '3º Trimestre',
  'Pós-parto',
  'Amamentação',
  'Primeira Infância (0-2 anos)',
];

const TARGET_AUDIENCE_OPTIONS = [
  'Todas as mães',
  'Mães de primeira viagem',
  'Mães com múltiplos filhos',
  'Mães que amamentam',
  'Mães que trabalham fora',
];

export const ToolSuggestionDialog = ({ open, onOpenChange }: ToolSuggestionDialogProps) => {
  const { createSuggestion } = useToolSuggestions();
  const { profile } = useProfile();
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState<ToolSuggestionFormData>({
    title: '',
    main_idea: '',
    problem_solved: '',
    main_functions: '',
    integrations: [],
    phases: [],
    target_audience: '',
    priority_rating: 3,
    reference_examples: '',
    available_for_beta: false,
    contact_email: profile?.email || '',
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    const result = await createSuggestion(formData);
    setSubmitting(false);

    if (result.success) {
      onOpenChange(false);
      // Reset form
      setFormData({
        title: '',
        main_idea: '',
        problem_solved: '',
        main_functions: '',
        integrations: [],
        phases: [],
        target_audience: '',
        priority_rating: 3,
        reference_examples: '',
        available_for_beta: false,
        contact_email: profile?.email || '',
      });
      setCurrentStep(1);
    }
  };

  const handleIntegrationToggle = (integration: string) => {
    setFormData(prev => ({
      ...prev,
      integrations: prev.integrations.includes(integration)
        ? prev.integrations.filter(i => i !== integration)
        : [...prev.integrations, integration],
    }));
  };

  const handlePhaseToggle = (phase: string) => {
    setFormData(prev => ({
      ...prev,
      phases: prev.phases.includes(phase)
        ? prev.phases.filter(p => p !== phase)
        : [...prev.phases, phase],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title.length >= 5 && formData.main_idea.length >= 50;
      case 2:
        return formData.main_functions.length >= 20 && formData.integrations.length > 0;
      case 3:
        return formData.phases.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sugerir Nova Ferramenta</DialogTitle>
          <DialogDescription>
            Passo {currentStep} de {totalSteps} - Compartilhe sua ideia conosco
          </DialogDescription>
        </DialogHeader>

        <Progress value={(currentStep / totalSteps) * 100} className="mb-4" />

        <div className="space-y-6">
          {/* Step 1: Ideia Principal */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título da Ferramenta *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Calculadora de Fraldas Inteligente"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.title.length}/100 caracteres
                </p>
              </div>

              <div>
                <Label htmlFor="main_idea">Ideia Principal * (50-500 caracteres)</Label>
                <Textarea
                  id="main_idea"
                  value={formData.main_idea}
                  onChange={e => setFormData(prev => ({ ...prev, main_idea: e.target.value }))}
                  placeholder="Descreva brevemente sua ideia e o que ela faria..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.main_idea.length}/500 caracteres
                </p>
              </div>

              <div>
                <Label htmlFor="problem_solved">Qual Problema Resolve? (opcional)</Label>
                <Textarea
                  id="problem_solved"
                  value={formData.problem_solved}
                  onChange={e => setFormData(prev => ({ ...prev, problem_solved: e.target.value }))}
                  placeholder="Que dificuldade ou necessidade essa ferramenta atenderia?"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.problem_solved?.length || 0}/500 caracteres
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Funcionalidades */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="main_functions">
                  Funcionalidades Principais * (20-1000 caracteres)
                </Label>
                <Textarea
                  id="main_functions"
                  value={formData.main_functions}
                  onChange={e => setFormData(prev => ({ ...prev, main_functions: e.target.value }))}
                  placeholder="Liste as principais funções que você imagina para esta ferramenta..."
                  rows={6}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.main_functions.length}/1000 caracteres
                </p>
              </div>

              <div>
                <Label>Integrações Desejadas * (selecione pelo menos uma)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {INTEGRATION_OPTIONS.map(integration => (
                    <div key={integration} className="flex items-center space-x-2">
                      <Checkbox
                        id={`integration-${integration}`}
                        checked={formData.integrations.includes(integration)}
                        onCheckedChange={() => handleIntegrationToggle(integration)}
                      />
                      <label
                        htmlFor={`integration-${integration}`}
                        className="text-sm cursor-pointer"
                      >
                        {integration}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="reference_examples">Referências ou Exemplos (opcional)</Label>
                <Textarea
                  id="reference_examples"
                  value={formData.reference_examples}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, reference_examples: e.target.value }))
                  }
                  placeholder="Conhece algum app ou site parecido? Compartilhe aqui..."
                  rows={2}
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.reference_examples?.length || 0}/300 caracteres
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Público e Fases */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Fases de Utilidade * (selecione pelo menos uma)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PHASE_OPTIONS.map(phase => (
                    <div key={phase} className="flex items-center space-x-2">
                      <Checkbox
                        id={`phase-${phase}`}
                        checked={formData.phases.includes(phase)}
                        onCheckedChange={() => handlePhaseToggle(phase)}
                      />
                      <label htmlFor={`phase-${phase}`} className="text-sm cursor-pointer">
                        {phase}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="target_audience">Público-Alvo Principal</Label>
                <Select
                  value={formData.target_audience}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, target_audience: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o público-alvo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_AUDIENCE_OPTIONS.map(audience => (
                      <SelectItem key={audience} value={audience}>
                        {audience}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prioridade Pessoal</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  O quanto essa ferramenta seria útil para você?
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <Button
                      key={rating}
                      type="button"
                      variant={formData.priority_rating >= rating ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, priority_rating: rating }))}
                    >
                      <Star
                        className="h-4 w-4"
                        fill={formData.priority_rating >= rating ? 'currentColor' : 'none'}
                      />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Contato e Preview */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="contact_email">Email de Contato *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={e => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="seu-email@exemplo.com"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="available_for_beta"
                  checked={formData.available_for_beta}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, available_for_beta: checked as boolean }))
                  }
                />
                <label htmlFor="available_for_beta" className="text-sm cursor-pointer">
                  Gostaria de testar a versão beta quando estiver pronta
                </label>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
                <h4 className="font-semibold">Preview da Sugestão:</h4>
                <p className="text-sm">
                  <strong>Título:</strong> {formData.title}
                </p>
                <p className="text-sm">
                  <strong>Ideia:</strong> {formData.main_idea.substring(0, 100)}...
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.phases.map(phase => (
                    <Badge key={phase} variant="secondary" className="text-xs">
                      {phase}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1 || submitting}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={() => setCurrentStep(prev => prev + 1)} disabled={!canProceed()}>
              Próximo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || !canProceed()}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Sugestão'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
