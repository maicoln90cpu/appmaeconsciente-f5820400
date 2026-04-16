/**
 * @fileoverview Hook base genérico para operações CRUD de logs de bebê
 * @module hooks/useBabyLogs
 */

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { useAchievements } from "@/hooks/useAchievements";
import { logger } from "@/lib/logger";
import type { Database } from "@/integrations/supabase/types";

type BabyLogTable = 
  | 'baby_feeding_logs' 
  | 'baby_sleep_logs' 
  | 'baby_colic_logs'
  | 'baby_medication_logs'
  | 'baby_routine_logs';

interface UseBabyLogsOptions {
  tableName: BabyLogTable;
  orderBy?: { column: string; ascending?: boolean };
  additionalFilters?: Record<string, string | number | boolean>;
  entityName: string;
  checkAchievementsOnAdd?: boolean;
}

interface UseBabyLogsReturn<T> {
  data: T[];
  loading: boolean;
  add: (item: Record<string, unknown>) => Promise<T>;
  update: (id: string, updates: Record<string, unknown>) => Promise<T>;
  remove: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useBabyLogs<T extends { id: string }>({
  tableName,
  orderBy = { column: "created_at", ascending: false },
  additionalFilters = {},
  entityName,
  checkAchievementsOnAdd = true,
}: UseBabyLogsOptions): UseBabyLogsReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkAchievements } = useAchievements();
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      
      if (!user) {
        setData([]);
        return;
      }

      // Using any to bypass type complexity
      const query = supabase
        .from(tableName)
        .select("*")
        .eq("user_id", user.id) as any;

      // Aplicar filtros adicionais
      let finalQuery = query;
      Object.entries(additionalFilters).forEach(([key, value]) => {
        finalQuery = finalQuery.eq(key, value);
      });

      // Aplicar ordenação
      finalQuery = finalQuery.order(orderBy.column, { ascending: orderBy.ascending ?? false });

      const { data: result, error } = await finalQuery;

      if (error) throw error;
      setData((result || []) as T[]);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code !== 'PGRST116') {
        logger.error(`Error loading ${entityName}`, error);
        toast({
          title: "Erro",
          description: `Erro ao carregar ${entityName}`,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [tableName, orderBy.column, orderBy.ascending, JSON.stringify(additionalFilters), entityName, toast]);

  const add = useCallback(async (item: Record<string, unknown>): Promise<T> => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) throw new Error("Não autenticado");

    const { data: result, error } = await (supabase
      .from(tableName)
      .insert({
        user_id: user.id,
        ...item,
      } as any)
      .select()
      .single() as any);

    if (error) {
      logger.error(`Error adding ${entityName}`, error);
      toast({
        title: "Erro",
        description: `Erro ao adicionar ${entityName}`,
        variant: "destructive",
      });
      throw error;
    }

    const newItem = result as T;
    setData(prev => [newItem, ...prev]);
    
    toast({
      title: "Sucesso",
      description: `${entityName} registrado(a) com sucesso!`,
    });

    if (checkAchievementsOnAdd) {
      setTimeout(() => checkAchievements(), 1000);
    }

    return newItem;
  }, [tableName, entityName, checkAchievementsOnAdd, checkAchievements, toast]);

  const update = useCallback(async (id: string, updates: Record<string, unknown>): Promise<T> => {
    const { data: result, error } = await (supabase
      .from(tableName)
      .update(updates as any)
      .eq("id", id)
      .select()
      .single() as any);

    if (error) {
      logger.error(`Error updating ${entityName}`, error);
      toast({
        title: "Erro",
        description: `Erro ao atualizar ${entityName}`,
        variant: "destructive",
      });
      throw error;
    }

    const updatedItem = result as T;
    setData(prev => prev.map(item => item.id === id ? updatedItem : item));
    
    toast({
      title: "Sucesso",
      description: `${entityName} atualizado(a)!`,
    });

    return updatedItem;
  }, [tableName, entityName, toast]);

  const remove = useCallback(async (id: string): Promise<void> => {
    const { error } = await (supabase
      .from(tableName)
      .delete()
      .eq("id", id) as any);

    if (error) {
      logger.error(`Error removing ${entityName}`, error);
      toast({
        title: "Erro",
        description: `Erro ao excluir ${entityName}`,
        variant: "destructive",
      });
      throw error;
    }

    setData(prev => prev.filter(item => item.id !== id));
    
    toast({
      title: "Sucesso",
      description: `${entityName} excluído(a)!`,
    });
  }, [tableName, entityName, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    add,
    update,
    remove,
    reload: loadData,
  };
}
