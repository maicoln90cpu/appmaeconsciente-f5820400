import { useEffect, useState } from 'react';

import { WifiOff, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface CachedDataInfo {
  name: string;
  available: boolean;
  lastSync?: string;
}

const Offline = () => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedData, setCachedData] = useState<CachedDataInfo[]>([]);
  const [pendingSync, setPendingSync] = useState(0);

  // Verificar dados em cache
  useEffect(() => {
    const checkCachedData = async () => {
      const dataTypes: CachedDataInfo[] = [
        { name: 'Perfil', available: !!localStorage.getItem('user-profile') },
        { name: 'Configurações', available: !!localStorage.getItem('app-settings') },
        { name: 'Dados do bebê', available: !!localStorage.getItem('baby-data') },
      ];

      // Verificar cache do Service Worker
      if ('caches' in window) {
        try {
          const cache = await caches.open('supabase-api-cache');
          const keys = await cache.keys();
          if (keys.length > 0) {
            dataTypes.push({
              name: 'Dados sincronizados',
              available: true,
              lastSync: new Date().toLocaleTimeString('pt-BR'),
            });
          }
        } catch {
          // Cache não disponível
        }
      }

      // Verificar fila de sync pendente
      const syncQueue = localStorage.getItem('offline-sync-queue');
      if (syncQueue) {
        try {
          const queue = JSON.parse(syncQueue);
          setPendingSync(Array.isArray(queue) ? queue.length : 0);
        } catch {
          setPendingSync(0);
        }
      }

      setCachedData(dataTypes.filter(d => d.available));
    };

    checkCachedData();
  }, []);

  // Monitorar mudanças de conectividade
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-redirect após 2 segundos quando voltar online
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);

    // Tentar fazer uma requisição simples para verificar conexão
    try {
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
      });

      if (response.ok) {
        window.location.href = '/dashboard';
        return;
      }
    } catch {
      // Ainda offline
    }

    setIsRetrying(false);
  };

  // Se voltou online, mostrar mensagem de sucesso
  if (isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-accent p-4">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-primary">Conexão Restaurada!</CardTitle>
            <CardDescription>Redirecionando para o dashboard...</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={100} className="h-2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-secondary p-4 animate-pulse">
              <WifiOff className="h-12 w-12 text-secondary-foreground" />
            </div>
          </div>
          <CardTitle>Você está offline</CardTitle>
          <CardDescription>Algumas funcionalidades podem estar limitadas</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Dados disponíveis offline */}
          {cachedData.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Disponível offline:
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                {cachedData.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {item.name}
                    {item.lastSync && (
                      <span className="text-xs text-muted-foreground">
                        (sincronizado às {item.lastSync})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Itens pendentes de sync */}
          {pendingSync > 0 && (
            <div className="rounded-lg bg-secondary p-4 space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2 text-secondary-foreground">
                <Clock className="h-4 w-4" />
                Aguardando sincronização:
              </h3>
              <p className="text-sm text-secondary-foreground/80">
                {pendingSync}{' '}
                {pendingSync === 1 ? 'item será sincronizado' : 'itens serão sincronizados'} quando
                a conexão retornar
              </p>
            </div>
          )}

          {/* Dicas */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">Dicas:</p>
            <ul className="space-y-1 text-xs">
              <li>✓ Verifique sua conexão Wi-Fi ou dados móveis</li>
              <li>✓ Seus dados serão sincronizados automaticamente</li>
              <li>✓ Você pode continuar visualizando dados já carregados</li>
            </ul>
          </div>

          {/* Botão de retry */}
          <Button onClick={handleRetry} className="w-full" disabled={isRetrying} size="lg">
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Verificando conexão...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </>
            )}
          </Button>

          {/* Link para voltar (se tiver histórico) */}
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => window.history.back()}
          >
            Voltar para a página anterior
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Offline;
