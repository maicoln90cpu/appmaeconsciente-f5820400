import { useState, useEffect, useCallback } from 'react';

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CloudOff,
  Loader2,
  RefreshCw,
  Trash2,
  Wifi,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { useOfflineSync } from '@/hooks/useOfflineSync';

import { cn } from '@/lib/utils';

interface SyncQueueManagerProps {
  className?: string;
}

const TASK_TYPE_LABELS: Record<string, string> = {
  baby_feeding: 'Registro de Mamada',
  baby_sleep: 'Registro de Sono',
  enxoval: 'Item do Enxoval',
  posts: 'Post da Comunidade',
  vaccinations: 'Vacina',
  postpartum_symptoms: 'Sintoma Pós-Parto',
  milestones: 'Marco de Desenvolvimento',
  comments: 'Comentário',
  tickets: 'Ticket de Suporte',
  contractions: 'Contração',
  emotional_logs: 'Registro Emocional',
};

const OPERATION_LABELS: Record<string, string> = {
  insert: 'Criar',
  update: 'Atualizar',
  delete: 'Excluir',
};

export function SyncQueueManager({ className }: SyncQueueManagerProps) {
  const {
    isOnline,
    pendingCount,
    failedCount,
    tasks,
    isSyncing,
    retryFailed,
    retryTask,
    discardTask,
    clearQueue,
    forceSync,
  } = useOfflineSync();

  const [isOpen, setIsOpen] = useState(false);
  const totalPending = pendingCount + failedCount;

  // Calcular progresso de sync
  const syncProgress = tasks.length > 0
    ? ((tasks.filter(t => t.status === 'synced').length / tasks.length) * 100)
    : 100;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Hoje às ${formatTime(timestamp)}`;
    }
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'syncing':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'synced':
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'syncing':
        return <Badge variant="default">Sincronizando</Badge>;
      case 'synced':
        return <Badge variant="outline" className="border-primary text-primary">Sincronizado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Se não há items pendentes e está online, não mostrar o botão
  if (totalPending === 0 && isOnline) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-2 relative',
            !isOnline && 'border-destructive text-destructive',
            failedCount > 0 && 'border-destructive',
            className
          )}
        >
          {isOnline ? (
            isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wifi className="h-4 w-4" />
            )
          ) : (
            <CloudOff className="h-4 w-4" />
          )}
          
          {totalPending > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {totalPending}
            </span>
          )}
          
          <span className="hidden sm:inline">
            {isOnline ? (isSyncing ? 'Sincronizando...' : 'Sync') : 'Offline'}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5 text-primary" />
                Fila de Sincronização
              </>
            ) : (
              <>
                <CloudOff className="h-5 w-5 text-destructive" />
                Modo Offline
              </>
            )}
          </SheetTitle>
          <SheetDescription>
            {isOnline
              ? 'Gerencie suas operações pendentes'
              : 'Suas alterações serão sincronizadas quando a conexão for restaurada'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3">
              <div className="text-2xl font-bold text-primary">{pendingCount}</div>
              <div className="text-xs text-muted-foreground">Pendentes</div>
            </Card>
            <Card className="p-3">
              <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'syncing').length}</div>
              <div className="text-xs text-muted-foreground">Sincronizando</div>
            </Card>
            <Card className={cn('p-3', failedCount > 0 && 'border-destructive')}>
              <div className={cn('text-2xl font-bold', failedCount > 0 && 'text-destructive')}>
                {failedCount}
              </div>
              <div className="text-xs text-muted-foreground">Falharam</div>
            </Card>
          </div>

          {/* Progress Bar */}
          {isSyncing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={forceSync}
              disabled={!isOnline || isSyncing || pendingCount === 0}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isSyncing && 'animate-spin')} />
              Sincronizar Agora
            </Button>
            
            {failedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={retryFailed}
                disabled={!isOnline || isSyncing}
              >
                Tentar Novamente
              </Button>
            )}
          </div>

          {/* Task List */}
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma operação pendente</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <Card key={task.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        {getStatusIcon(task.status)}
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {OPERATION_LABELS[task.operation] || task.operation}{' '}
                            {TASK_TYPE_LABELS[task.type] || task.type}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(task.timestamp)}
                          </div>
                          {task.errorMessage && (
                            <div className="text-xs text-destructive mt-1">
                              {task.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        {getStatusBadge(task.status)}
                        
                        {task.status === 'failed' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => retryTask(task.id)}
                              disabled={!isOnline}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => discardTask(task.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {task.retries > 0 && task.status !== 'synced' && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Tentativas: {task.retries}/5
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Clear Queue */}
          {tasks.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-destructive hover:text-destructive"
              onClick={clearQueue}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Toda a Fila
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default SyncQueueManager;
