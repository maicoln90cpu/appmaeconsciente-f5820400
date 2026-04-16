/**
 * Hook for offline-capable data fetching
 * Provides automatic caching and offline fallback for Supabase queries
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { offlineCache } from "@/lib/offline-cache";
import { offlineSync } from "@/lib/offline-sync";
import { toast } from "sonner";

export interface UseOfflineDataOptions<T> {
  tableName: string;
  userId: string | null;
  enabled?: boolean;
  maxCacheAge?: number;
  orderBy?: { column: string; ascending?: boolean };
  filters?: Array<{ column: string; value: any; operator?: string }>;
  onSuccess?: (data: T[]) => void;
  onError?: (error: Error) => void;
}

export interface UseOfflineDataResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  isOffline: boolean;
  isCached: boolean;
  refetch: () => Promise<void>;
  addItem: (item: Omit<T, "id" | "user_id" | "created_at" | "updated_at">) => Promise<T | null>;
  updateItem: (id: string, updates: Partial<T>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export function useOfflineData<T extends { id: string }>({
  tableName,
  userId,
  enabled = true,
  maxCacheAge = 24 * 60 * 60 * 1000, // 24 hours
  orderBy,
  filters = [],
  onSuccess,
  onError,
}: UseOfflineDataOptions<T>): UseOfflineDataResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isCached, setIsCached] = useState(false);
  const fetchingRef = useRef(false);

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!enabled || !userId || fetchingRef.current) return;
    
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Try to fetch from network first
      if (navigator.onLine) {
        let query = supabase
          .from(tableName as any)
          .select("*")
          .eq("user_id", userId);

        // Apply additional filters
        filters.forEach((filter) => {
          if (filter.operator === "neq") {
            query = query.neq(filter.column, filter.value);
          } else if (filter.operator === "in") {
            query = query.in(filter.column, filter.value);
          } else {
            query = query.eq(filter.column, filter.value);
          }
        });

        // Apply ordering
        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
        }

        const { data: fetchedData, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        const typedData = (fetchedData as unknown as T[]) || [];
        setData(typedData);
        setIsCached(false);

        // Cache the data for offline use
        await offlineCache.cacheData(tableName, userId, typedData);

        onSuccess?.(typedData);
      } else {
        // Fallback to cached data when offline
        const cachedData = await offlineCache.getCachedData<T>(
          tableName,
          userId,
          maxCacheAge
        );

        if (cachedData) {
          setData(cachedData);
          setIsCached(true);
          onSuccess?.(cachedData);
        } else {
          setData([]);
          toast.error("Modo offline", { description: "Não há dados em cache disponíveis." });
        }
      }
    } catch (err: any) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err);
      onError?.(err);

      // Try cached data as fallback
      if (userId) {
        const cachedData = await offlineCache.getCachedData<T>(
          tableName,
          userId,
          maxCacheAge
        );

        if (cachedData) {
          setData(cachedData);
          setIsCached(true);
          toast("Usando dados em cache", { description: "Houve um erro de conexão. Mostrando dados salvos." });
        }
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [enabled, userId, tableName, maxCacheAge, orderBy, filters, toast, onSuccess, onError]);

  const addItem = useCallback(
    async (item: Omit<T, "id" | "user_id" | "created_at" | "updated_at">): Promise<T | null> => {
      if (!userId) return null;

      // Optimistic update with temporary ID
      const tempId = `temp_${Date.now()}`;
      const optimisticItem = {
        ...item,
        id: tempId,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as T;

      setData((prev) => [optimisticItem, ...prev]);

      if (navigator.onLine) {
        try {
          const { data: newItem, error } = await supabase
            .from(tableName as any)
            .insert({ ...item, user_id: userId })
            .select()
            .single();

          if (error) throw error;

          // Replace optimistic item with real item
          setData((prev) =>
            prev.map((d) => (d.id === tempId ? (newItem as unknown as T) : d))
          );

          // Update cache
          await offlineCache.cacheData(tableName, userId, data);

          return newItem as unknown as T;
        } catch (err: any) {
          // Revert optimistic update on error
          setData((prev) => prev.filter((d) => d.id !== tempId));
          throw err;
        }
      } else {
        // Queue for offline sync
        await offlineSync.queueTask(
          tableName.replace("baby_", "baby_").replace("_logs", ""),
          tableName,
          "insert",
          { ...item, tempId }
        );

        toast("Salvo offline", { description: "Será sincronizado quando a conexão for restaurada." });

        return optimisticItem;
      }
    },
    [userId, tableName, data, toast]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<T>): Promise<void> => {
      if (!userId) return;

      // Optimistic update
      const previousData = [...data];
      setData((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
      );

      if (navigator.onLine) {
        try {
          const { error } = await supabase
            .from(tableName as any)
            .update(updates as any)
            .eq("id", id);

          if (error) throw error;

          // Update cache
          await offlineCache.cacheData(tableName, userId, data);
        } catch (err: any) {
          // Revert on error
          setData(previousData);
          throw err;
        }
      } else {
        // Queue for offline sync
        await offlineSync.queueTask(
          tableName.replace("baby_", "baby_").replace("_logs", ""),
          tableName,
          "update",
          { id, ...updates }
        );

        toast("Atualização salva offline", { description: "Será sincronizado quando a conexão for restaurada." });
      }
    },
    [userId, tableName, data, toast]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      if (!userId) return;

      // Optimistic delete
      const previousData = [...data];
      setData((prev) => prev.filter((d) => d.id !== id));

      if (navigator.onLine) {
        try {
          const { error } = await supabase
            .from(tableName as any)
            .delete()
            .eq("id", id);

          if (error) throw error;

          // Update cache
          await offlineCache.cacheData(
            tableName,
            userId,
            data.filter((d) => d.id !== id)
          );
        } catch (err: any) {
          // Revert on error
          setData(previousData);
          throw err;
        }
      } else {
        // Queue for offline sync
        await offlineSync.queueTask(
          tableName.replace("baby_", "baby_").replace("_logs", ""),
          tableName,
          "delete",
          { id }
        );

        toast("Exclusão salva offline", { description: "Será sincronizado quando a conexão for restaurada." });
      }
    },
    [userId, tableName, data, toast]
  );

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch when coming back online
  useEffect(() => {
    if (!isOffline && enabled && userId) {
      fetchData();
    }
  }, [isOffline, enabled, userId, fetchData]);

  return {
    data,
    loading,
    error,
    isOffline,
    isCached,
    refetch: fetchData,
    addItem,
    updateItem,
    deleteItem,
  };
}
