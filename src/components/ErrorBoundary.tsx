import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, WifiOff, Bug } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { captureError, addBreadcrumb } from "@/lib/sentry";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  maxRetries?: number;
  retryDelay?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
  retryCount: number;
  isOffline: boolean;
  errorType: 'network' | 'chunk' | 'runtime' | 'unknown';
}

// Error categorization for better UX
const categorizeError = (error: Error): State['errorType'] => {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();
  
  if (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('load failed') ||
    message.includes('net::err_')
  ) {
    return 'network';
  }
  
  if (
    message.includes('loading chunk') ||
    message.includes('loading css chunk') ||
    message.includes('dynamically imported module')
  ) {
    return 'chunk';
  }
  
  return 'runtime';
};

// Error messages by type
const ERROR_MESSAGES: Record<State['errorType'], { title: string; description: string; icon: typeof AlertTriangle }> = {
  network: {
    title: 'Problema de Conexão',
    description: 'Parece que você está offline ou com conexão instável. Verifique sua internet e tente novamente.',
    icon: WifiOff,
  },
  chunk: {
    title: 'Atualização Disponível',
    description: 'Uma nova versão do aplicativo está disponível. Recarregue a página para atualizar.',
    icon: RefreshCw,
  },
  runtime: {
    title: 'Ops! Algo deu errado',
    description: 'Encontramos um erro inesperado. Nossa equipe foi notificada automaticamente.',
    icon: Bug,
  },
  unknown: {
    title: 'Erro Inesperado',
    description: 'Ocorreu um problema desconhecido. Tente recarregar a página.',
    icon: AlertTriangle,
  },
};

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
  
  static defaultProps = {
    maxRetries: 3,
    retryDelay: 1000,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      retryCount: 0,
      isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
      errorType: 'unknown',
    };
  }

  componentDidMount() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleOnline = () => {
    this.setState({ isOffline: false });
    // Auto-retry on reconnection if we had a network error
    if (this.state.hasError && this.state.errorType === 'network') {
      this.handleRetry();
    }
  };

  handleOffline = () => {
    this.setState({ isOffline: true });
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorType: categorizeError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorType = categorizeError(error);
    
    // Add breadcrumb before capturing
    addBreadcrumb("Error boundary triggered", "error", {
      componentStack: errorInfo.componentStack?.slice(0, 500),
      errorType,
    });
    
    // Capture to Sentry with full context
    captureError(error, {
      component: "ErrorBoundary",
      extra: {
        componentStack: errorInfo.componentStack,
        errorMessage: error.message,
        errorName: error.name,
        errorType,
        retryCount: this.state.retryCount,
      },
    });
    
    // Track in analytics
    analytics.track({
      name: "error_boundary_triggered",
      properties: {
        error: error.message,
        errorType,
        stack: error.stack?.slice(0, 1000),
        componentStack: errorInfo.componentStack?.slice(0, 500),
        retryCount: this.state.retryCount,
      },
    });

    this.setState({
      error,
      errorInfo,
      errorType,
    });
    
    // Auto-retry for chunk loading errors (new deployment)
    if (errorType === 'chunk' && this.state.retryCount < (this.props.maxRetries ?? 3)) {
      this.scheduleAutoRetry();
    }
    
    // Log in development
    if (import.meta.env.DEV) {
      console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }
  }

  scheduleAutoRetry = () => {
    const delay = (this.props.retryDelay ?? 1000) * Math.pow(2, this.state.retryCount);
    
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      retryCount: 0,
    });
    
    this.props.onReset?.();
    window.location.href = "/";
  };

  handleRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
    
    this.setState(prev => ({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleReload = () => {
    // Force reload from server, bypassing cache
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Allow custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { errorType, isOffline, retryCount } = this.state;
      const maxRetries = this.props.maxRetries ?? 3;
      const errorConfig = ERROR_MESSAGES[errorType];
      const IconComponent = errorConfig.icon;
      const isAutoRetrying = errorType === 'chunk' && retryCount < maxRetries;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className={`rounded-full p-4 ${
                  errorType === 'network' ? 'bg-yellow-500/10' :
                  errorType === 'chunk' ? 'bg-blue-500/10' :
                  'bg-destructive/10'
                }`}>
                  <IconComponent className={`h-12 w-12 ${
                    errorType === 'network' ? 'text-yellow-500' :
                    errorType === 'chunk' ? 'text-blue-500' :
                    'text-destructive'
                  }`} />
                </div>
              </div>
              <CardTitle>{errorConfig.title}</CardTitle>
              <CardDescription>
                {isOffline 
                  ? 'Você está offline. Conecte-se à internet para continuar.'
                  : errorConfig.description
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAutoRetrying && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Tentando reconectar... ({retryCount}/{maxRetries})</span>
                </div>
              )}
              
              {import.meta.env.DEV && this.state.error && (
                <details className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                  <summary className="cursor-pointer font-medium mb-2">
                    Detalhes do erro (desenvolvimento)
                  </summary>
                  <pre className="whitespace-pre-wrap break-words overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2">
                {errorType === 'chunk' ? (
                  <Button 
                    onClick={this.handleReload} 
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar Página
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={this.handleRetry} 
                      variant="outline" 
                      className="flex-1"
                      disabled={isOffline}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Tentar Novamente
                    </Button>
                    <Button onClick={this.handleReset} className="flex-1">
                      <Home className="h-4 w-4 mr-2" />
                      Voltar ao Início
                    </Button>
                  </>
                )}
              </div>
              
              {retryCount > 0 && retryCount < maxRetries && (
                <p className="text-xs text-center text-muted-foreground">
                  Tentativa {retryCount} de {maxRetries}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
