/**
 * Panel showing detailed sync queue status
 * Allows users to manage pending and failed sync operations
 */

import { memo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Check,
  Loader2,
  Clock,
  Database,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { cn } from "@/lib/utils";
import { SyncTask } from "@/lib/offline-sync";

const operationLabels: Record<string, string> = {
  insert: "Adicionar",
  update: "Atualizar",
  delete: "Excluir",
};

const typeLabels: Record<string, string> = {
  baby_feeding: "Amamentação",
  baby_sleep: "Sono do Bebê",
  enxoval: "Enxoval",
  posts: "Posts",
  vaccinations: "Vacinação",
  postpartum_symptoms: "Sintomas Pós-Parto",
  milestones: "Marcos",
};

const statusConfig: Record<
  string,
  { icon: typeof Cloud; label: string; color: string }
> = {
  pending: { icon: Clock, label: "Pendente", color: "text-muted-foreground" },
  syncing: { icon: Loader2, label: "Sincronizando", color: "text-primary" },
  synced: { icon: Check, label: "Sincronizado", color: "text-green-600" },
  failed: { icon: AlertTriangle, label: "Falhou", color: "text-destructive" },
  conflict: { icon: CloudOff, label: "Conflito", color: "text-orange-600" },
};

const TaskItem = memo(
  ({
    task,
    onRetry,
    onDiscard,
  }: {
    task: SyncTask;
    onRetry: (id: string) => void;
    onDiscard: (id: string) => void;
  }) => {
    const config = statusConfig[task.status];
    const StatusIcon = config.icon;

    return (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
        <div className={cn("p-2 rounded-full bg-background", config.color)}>
          <StatusIcon
            className={cn("h-4 w-4", task.status === "syncing" && "animate-spin")}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {typeLabels[task.type] || task.type}
            </span>
            <Badge variant="outline" className="text-xs">
              {operationLabels[task.operation] || task.operation}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            {format(new Date(task.timestamp), "dd/MM HH:mm", { locale: ptBR })}
            {task.retries > 0 && ` • ${task.retries} tentativa(s)`}
          </p>

          {task.errorMessage && (
            <p className="text-xs text-destructive mt-1 line-clamp-2">
              {task.errorMessage}
            </p>
          )}
        </div>

        {task.status === "failed" && (
          <div className="flex gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => onRetry(task.id)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDiscard(task.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    );
  }
);

TaskItem.displayName = "TaskItem";

export const SyncQueuePanel = memo(() => {
  const {
    isOnline,
    tasks,
    pendingCount,
    failedCount,
    isSyncing,
    retryFailed,
    retryTask,
    discardTask,
    clearQueue,
    forceSync,
  } = useOfflineSync();

  const hasTasks = tasks.length > 0;
  const pendingTasks = tasks.filter(
    (t) => t.status === "pending" || t.status === "syncing"
  );
  const failedTasks = tasks.filter((t) => t.status === "failed");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5" />
            Sincronização Offline
          </CardTitle>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{tasks.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <p className="text-2xl font-bold text-primary">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-destructive/10">
            <p className="text-2xl font-bold text-destructive">{failedCount}</p>
            <p className="text-xs text-muted-foreground">Falhas</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={forceSync}
            disabled={!isOnline || isSyncing || pendingCount === 0}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")}
            />
            Sincronizar
          </Button>
          {failedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={retryFailed}
              disabled={!isOnline || isSyncing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          )}
          {hasTasks && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={clearQueue}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Tasks List */}
        {hasTasks ? (
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {failedTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Falhas ({failedTasks.length})
                  </h4>
                  {failedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onRetry={retryTask}
                      onDiscard={discardTask}
                    />
                  ))}
                </div>
              )}

              {pendingTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Pendentes ({pendingTasks.length})
                  </h4>
                  {pendingTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onRetry={retryTask}
                      onDiscard={discardTask}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Cloud className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma operação pendente</p>
            <p className="text-xs">Todos os dados estão sincronizados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

SyncQueuePanel.displayName = "SyncQueuePanel";
