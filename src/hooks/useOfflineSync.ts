/**
 * Hook for managing offline sync status and operations
 */

import { useState, useEffect, useCallback } from "react";
import { offlineSync, SyncTask } from "@/lib/offline-sync";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";

export interface OfflineSyncState {
  isOnline: boolean;
  pendingCount: number;
  failedCount: number;
  tasks: SyncTask[];
  isSyncing: boolean;
}

// Register sync handlers for different data types
const registerDefaultHandlers = () => {
  // Baby Feeding Logs
  offlineSync.registerHandler("baby_feeding", async (task) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    if (task.operation === "insert") {
      const insertData = { ...task.data, user_id: user.id };
      const { error } = await supabase
        .from("baby_feeding_logs")
        .insert(insertData as any);
      if (error) throw error;
    } else if (task.operation === "update") {
      const { error } = await supabase
        .from("baby_feeding_logs")
        .update(task.data as any)
        .eq("id", task.data.id);
      if (error) throw error;
    } else if (task.operation === "delete") {
      const { error } = await supabase
        .from("baby_feeding_logs")
        .delete()
        .eq("id", task.data.id);
      if (error) throw error;
    }
  });

  // Baby Sleep Logs
  offlineSync.registerHandler("baby_sleep", async (task) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    if (task.operation === "insert") {
      const insertData = { ...task.data, user_id: user.id };
      const { error } = await supabase
        .from("baby_sleep_logs")
        .insert(insertData as any);
      if (error) throw error;
    } else if (task.operation === "update") {
      const { error } = await supabase
        .from("baby_sleep_logs")
        .update(task.data as any)
        .eq("id", task.data.id);
      if (error) throw error;
    } else if (task.operation === "delete") {
      const { error } = await supabase
        .from("baby_sleep_logs")
        .delete()
        .eq("id", task.data.id);
      if (error) throw error;
    }
  });

  // Enxoval Items
  offlineSync.registerHandler("enxoval", async (task) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    if (task.operation === "insert") {
      const insertData = { ...task.data, user_id: user.id };
      const { error } = await supabase
        .from("itens_enxoval")
        .insert(insertData as any);
      if (error) throw error;
    } else if (task.operation === "update") {
      const { error } = await supabase
        .from("itens_enxoval")
        .update(task.data as any)
        .eq("id", task.data.id);
      if (error) throw error;
    } else if (task.operation === "delete") {
      const { error } = await supabase
        .from("itens_enxoval")
        .delete()
        .eq("id", task.data.id);
      if (error) throw error;
    }
  });

  // Posts
  offlineSync.registerHandler("posts", async (task) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    if (task.operation === "insert") {
      const insertData = { ...task.data, user_id: user.id };
      const { error } = await supabase
        .from("posts")
        .insert(insertData as any);
      if (error) throw error;
    } else if (task.operation === "delete") {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", task.data.id);
      if (error) throw error;
    }
  });

  // Vaccinations
  offlineSync.registerHandler("vaccinations", async (task) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    if (task.operation === "insert") {
      const insertData = { ...task.data, user_id: user.id };
      const { error } = await supabase
        .from("baby_vaccinations")
        .insert(insertData as any);
      if (error) throw error;
    } else if (task.operation === "update") {
      const { error } = await supabase
        .from("baby_vaccinations")
        .update(task.data as any)
        .eq("id", task.data.id);
      if (error) throw error;
    } else if (task.operation === "delete") {
      const { error } = await supabase
        .from("baby_vaccinations")
        .delete()
        .eq("id", task.data.id);
      if (error) throw error;
    }
  });

  // Postpartum Symptoms
  offlineSync.registerHandler("postpartum_symptoms", async (task) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    if (task.operation === "insert") {
      const insertData = { ...task.data, user_id: user.id };
      const { error } = await supabase
        .from("postpartum_symptoms")
        .insert(insertData as any);
      if (error) throw error;
    } else if (task.operation === "update") {
      const { error } = await supabase
        .from("postpartum_symptoms")
        .update(task.data as any)
        .eq("id", task.data.id);
      if (error) throw error;
    }
  });

  // Milestone Records
  offlineSync.registerHandler("milestones", async (task) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    if (task.operation === "insert") {
      const insertData = { ...task.data, user_id: user.id };
      const { error } = await supabase
        .from("baby_milestone_records")
        .insert(insertData as any);
      if (error) throw error;
    } else if (task.operation === "update") {
      const { error } = await supabase
        .from("baby_milestone_records")
        .update(task.data as any)
        .eq("id", task.data.id);
      if (error) throw error;
    }
  });
};

// Initialize handlers once
let handlersRegistered = false;

export function useOfflineSync() {
  const [state, setState] = useState<OfflineSyncState>({
    isOnline: navigator.onLine,
    pendingCount: 0,
    failedCount: 0,
    tasks: [],
    isSyncing: false,
  });
  const { toast } = useToast();

  // Register handlers on first use
  useEffect(() => {
    if (!handlersRegistered) {
      registerDefaultHandlers();
      handlersRegistered = true;
    }
  }, []);

  // Listen for online/offline changes
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      toast({
        title: "Conexão restaurada",
        description: "Sincronizando dados pendentes...",
      });
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
      toast({
        title: "Modo offline",
        description: "Suas alterações serão sincronizadas quando a conexão for restaurada.",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  // Listen for sync status changes
  useEffect(() => {
    const unsubscribe = offlineSync.onStatusChange((tasks) => {
      const pendingCount = tasks.filter(
        (t) => t.status === "pending" || t.status === "syncing"
      ).length;
      const failedCount = tasks.filter((t) => t.status === "failed").length;
      const isSyncing = tasks.some((t) => t.status === "syncing");

      setState((prev) => ({
        ...prev,
        tasks,
        pendingCount,
        failedCount,
        isSyncing,
      }));
    });

    // Initial load
    offlineSync.getAllTasks().then((tasks) => {
      const pendingCount = tasks.filter(
        (t) => t.status === "pending" || t.status === "syncing"
      ).length;
      const failedCount = tasks.filter((t) => t.status === "failed").length;

      setState((prev) => ({
        ...prev,
        tasks,
        pendingCount,
        failedCount,
      }));
    });

    return unsubscribe;
  }, []);

  const queueOperation = useCallback(
    async (
      type: string,
      table: string,
      operation: "insert" | "update" | "delete",
      data: Record<string, any>
    ) => {
      return offlineSync.queueTask(type, table, operation, data);
    },
    []
  );

  const retryFailed = useCallback(async () => {
    await offlineSync.retryAllFailed();
    toast({
      title: "Tentando novamente",
      description: "Sincronizando dados pendentes...",
    });
  }, [toast]);

  const retryTask = useCallback(async (taskId: string) => {
    await offlineSync.retryTask(taskId);
  }, []);

  const discardTask = useCallback(
    async (taskId: string) => {
      await offlineSync.discardTask(taskId);
      toast({
        title: "Tarefa descartada",
        description: "A operação foi removida da fila.",
      });
    },
    [toast]
  );

  const clearQueue = useCallback(async () => {
    await offlineSync.clearQueue();
    toast({
      title: "Fila limpa",
      description: "Todas as operações pendentes foram removidas.",
    });
  }, [toast]);

  const forceSync = useCallback(async () => {
    await offlineSync.processQueue();
  }, []);

  return {
    ...state,
    queueOperation,
    retryFailed,
    retryTask,
    discardTask,
    clearQueue,
    forceSync,
  };
}
