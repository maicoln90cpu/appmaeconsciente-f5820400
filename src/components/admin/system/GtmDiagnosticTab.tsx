import { useState, useCallback } from 'react';

import { Search, CheckCircle2, XCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useSiteSettings } from '@/hooks/useSiteSettings';


type StepStatus = 'pending' | 'checking' | 'success' | 'error';

interface DiagnosticStep {
  label: string;
  description: string;
  status: StepStatus;
  detail?: string;
}

export const GtmDiagnosticTab = () => {
  const { settings, isLoading } = useSiteSettings();
  const [steps, setSteps] = useState<DiagnosticStep[]>([
    {
      label: 'GTM ID Configurado',
      description: 'Verificar se existe um GTM ID salvo no banco de dados',
      status: 'pending',
    },
    {
      label: 'Script Injetado',
      description: 'Verificar se o script do GTM foi injetado no DOM da página',
      status: 'pending',
    },
    {
      label: 'DataLayer Inicializado',
      description: 'Verificar se window.dataLayer existe e está funcional',
      status: 'pending',
    },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const updateStep = useCallback((index: number, update: Partial<DiagnosticStep>) => {
    setSteps(prev => prev.map((s, i) => (i === index ? { ...s, ...update } : s)));
  }, []);

  const runDiagnostic = useCallback(async () => {
    setIsRunning(true);
    setRetryCount(0);

    // Reset all steps
    setSteps(prev =>
      prev.map(s => ({ ...s, status: 'checking' as StepStatus, detail: undefined }))
    );

    // Step 1: Check GTM ID in database
    await new Promise(r => setTimeout(r, 500));
    const gtmId = settings?.gtm_id;
    if (gtmId && gtmId.startsWith('GTM-')) {
      updateStep(0, { status: 'success', detail: `ID encontrado: ${gtmId}` });
    } else {
      updateStep(0, {
        status: 'error',
        detail: gtmId ? `ID inválido: "${gtmId}"` : 'Nenhum GTM ID configurado',
      });
      updateStep(1, { status: 'pending' });
      updateStep(2, { status: 'pending' });
      setIsRunning(false);
      return;
    }

    // Step 2: Check if script is injected in DOM (with retry)
    let scriptFound = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      setRetryCount(attempt);
      await new Promise(r => setTimeout(r, 2000));

      const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
      const inlineScripts = document.querySelectorAll('script');
      let gtmInline = false;
      inlineScripts.forEach(s => {
        if (s.textContent?.includes(gtmId)) gtmInline = true;
      });

      if (scripts.length > 0 || gtmInline) {
        scriptFound = true;
        break;
      }
    }

    if (scriptFound) {
      updateStep(1, { status: 'success', detail: 'Script GTM encontrado no DOM' });
    } else {
      updateStep(1, {
        status: 'error',
        detail: 'Script GTM não encontrado no DOM após 3 tentativas',
      });
      updateStep(2, { status: 'pending' });
      setIsRunning(false);
      return;
    }

    // Step 3: Check dataLayer
    await new Promise(r => setTimeout(r, 500));
    const dataLayer = (window as any).dataLayer;
    if (dataLayer && Array.isArray(dataLayer)) {
      updateStep(2, {
        status: 'success',
        detail: `dataLayer ativo com ${dataLayer.length} evento(s)`,
      });
    } else {
      updateStep(2, {
        status: 'error',
        detail: 'window.dataLayer não encontrado ou não é um array',
      });
    }

    setIsRunning(false);
  }, [settings, updateStep]);

  const statusIcon = (status: StepStatus) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const statusBadge = (status: StepStatus) => {
    switch (status) {
      case 'checking':
        return <Badge variant="outline">Verificando...</Badge>;
      case 'success':
        return (
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
            Configurado ✅
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="text-destructive border-destructive/30">
            Erro ❌
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Aguardando ⚠️
          </Badge>
        );
    }
  };

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Diagnóstico do Google Tag Manager
            </span>
            <Button variant="outline" size="sm" onClick={runDiagnostic} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Verificando... (tentativa{' '}
                  {retryCount}/3)
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3 w-3" /> Verificar Agora
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current GTM ID */}
            <div className="flex items-center gap-2 p-3 rounded-md border bg-muted/30">
              <span className="text-sm text-muted-foreground">GTM ID Atual:</span>
              <span className="font-mono text-sm font-medium">
                {settings?.gtm_id || 'Não configurado'}
              </span>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-md border">
                  <div className="mt-0.5">{statusIcon(step.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{step.label}</p>
                      {statusBadge(step.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                    {step.detail && (
                      <p
                        className={`text-xs mt-1 ${step.status === 'error' ? 'text-destructive' : 'text-emerald-400'}`}
                      >
                        → {step.detail}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            {steps.every(s => s.status === 'success') && (
              <div className="p-3 rounded-md border border-emerald-500/30 bg-emerald-500/5">
                <p className="text-sm text-emerald-400 font-medium">
                  ✅ GTM está totalmente funcional!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Todos os 3 verificações passaram. O rastreamento está ativo.
                </p>
              </div>
            )}

            {steps.some(s => s.status === 'error') && (
              <div className="p-3 rounded-md border border-destructive/30 bg-destructive/5">
                <p className="text-sm text-destructive font-medium">⚠️ Problemas detectados</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Verifique se o GTM ID está correto em Configurações e se o script está sendo
                  injetado corretamente.
                </p>
              </div>
            )}

            {steps.every(s => s.status === 'pending') && (
              <p className="text-sm text-muted-foreground text-center">
                Clique em "Verificar Agora" para iniciar o diagnóstico automático em 3 etapas.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GtmDiagnosticTab;
