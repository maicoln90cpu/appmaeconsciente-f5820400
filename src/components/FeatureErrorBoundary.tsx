import React, { Component, ErrorInfo, ReactNode } from 'react';

import { AlertTriangle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { captureError, addBreadcrumb } from '@/lib/sentry';

interface Props {
  children: ReactNode;
  featureName: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary granular por feature/rota.
 * Diferente do ErrorBoundary global, este mostra um card inline
 * permitindo que o resto da app continue funcionando.
 */
export class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    addBreadcrumb('Feature error boundary triggered', 'error', {
      feature: this.props.featureName,
      componentStack: errorInfo.componentStack?.slice(0, 500),
    });

    captureError(error, {
      component: `FeatureErrorBoundary:${this.props.featureName}`,
      extra: {
        componentStack: errorInfo.componentStack,
        featureName: this.props.featureName,
      },
    });

    if (import.meta.env.DEV) {
      console.error(`[${this.props.featureName}] Error:`, error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-3">
                <div className="rounded-full p-3 bg-destructive/10">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-lg">Erro em {this.props.featureName}</CardTitle>
              <CardDescription>
                {this.props.fallbackMessage ??
                  'Ocorreu um problema nesta seção. O restante do app continua funcionando normalmente.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-2">
              <Button onClick={this.handleRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </CardContent>
            {import.meta.env.DEV && this.state.error && (
              <CardContent className="pt-0">
                <details className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
                  <summary className="cursor-pointer font-medium">Detalhes (dev)</summary>
                  <pre className="whitespace-pre-wrap break-words mt-1 max-h-32 overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </details>
              </CardContent>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
