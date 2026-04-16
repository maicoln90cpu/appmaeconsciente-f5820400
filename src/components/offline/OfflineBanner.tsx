/**
 * Offline status banner component
 * Shows connection status and pending sync operations
 */

import { memo } from 'react';
import { WifiOff, CloudOff, RefreshCw, AlertCircle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';

export const OfflineBanner = memo(() => {
  const { isOnline, pendingCount, failedCount, isSyncing, retryFailed, forceSync } =
    useOfflineSync();

  // Don't show anything if online and no pending tasks
  if (isOnline && pendingCount === 0 && failedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50',
        'rounded-lg border p-4 shadow-lg backdrop-blur-sm',
        !isOnline
          ? 'bg-destructive/10 border-destructive/30'
          : failedCount > 0
            ? 'bg-orange-500/10 border-orange-500/30'
            : 'bg-primary/10 border-primary/30'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-full',
            !isOnline
              ? 'bg-destructive/20 text-destructive'
              : failedCount > 0
                ? 'bg-orange-500/20 text-orange-600'
                : 'bg-primary/20 text-primary'
          )}
        >
          {!isOnline ? (
            <WifiOff className="h-4 w-4" />
          ) : isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : failedCount > 0 ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CloudOff className="h-4 w-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {!isOnline
              ? 'Você está offline'
              : isSyncing
                ? 'Sincronizando...'
                : failedCount > 0
                  ? 'Falha na sincronização'
                  : 'Sincronização pendente'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {!isOnline
              ? 'Suas alterações serão salvas localmente'
              : failedCount > 0
                ? `${failedCount} operação(ões) falharam`
                : `${pendingCount} operação(ões) pendente(s)`}
          </p>
        </div>

        {isOnline && (failedCount > 0 || pendingCount > 0) && (
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0"
            onClick={failedCount > 0 ? retryFailed : forceSync}
            disabled={isSyncing}
          >
            <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
          </Button>
        )}
      </div>
    </div>
  );
});

OfflineBanner.displayName = 'OfflineBanner';
