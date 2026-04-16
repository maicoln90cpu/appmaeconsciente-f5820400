/**
 * @fileoverview Hook para gerenciamento de dados de sono do bebê
 * Utiliza useBabyLogs como base para operações CRUD
 * @module hooks/useBabySleep
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBabyLogs } from "@/hooks/useBabyLogs";
import { logger } from "@/lib/logger";
import type { BabySleepLog, BabySleepSettings, BabySleepMilestone } from "@/types/babySleep";
import { toast } from "sonner";

const log = logger.scoped("useBabySleep");

export const useBabySleep = () => {
  const [settings, setSettings] = useState<BabySleepSettings | null>(null);
  const [milestones, setMilestones] = useState<BabySleepMilestone[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Usar hook base para logs de sono
  const {
    data: sleepLogs,
    loading: logsLoading,
    add: addLog,
    update: updateLog,
    remove: removeLog,
    reload: reloadLogs,
  } = useBabyLogs<BabySleepLog>({
    tableName: "baby_sleep_logs",
    orderBy: { column: "sleep_start", ascending: false },
    entityName: "Registro de sono",
    checkAchievementsOnAdd: true,
  });

  // Carregar configurações e marcos separadamente
  const loadSettingsAndMilestones = useCallback(async () => {
    try {
      setSettingsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      
      if (!user) {
        setSettings(null);
        setMilestones([]);
        toast.error("Erro", { description: "Você precisa estar logado para acessar este recurso." });
        return;
      }

      const [settingsResponse, milestonesResponse] = await Promise.all([
        supabase
          .from("baby_sleep_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("baby_sleep_milestones")
          .select("*")
          .order("age_range_start")
      ]);

      setSettings(settingsResponse.data as BabySleepSettings || null);
      
      if (milestonesResponse.error) throw milestonesResponse.error;
      setMilestones(milestonesResponse.data as BabySleepMilestone[] || []);
    } catch (error) {
      log.error("Erro ao carregar configurações e marcos", error);
      toast.error("Erro ao carregar dados", { description: "Erro ao carregar configurações de sono" });
    } finally {
      setSettingsLoading(false);
    }
  }, [toast]);

  const saveSettings = useCallback(async (
    newSettings: Omit<BabySleepSettings, "id" | "user_id" | "created_at" | "updated_at">
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("baby_sleep_settings")
        .upsert({
          ...newSettings,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setSettings(data as BabySleepSettings);
      toast("Configurações salvas", { description: "Suas configurações foram atualizadas com sucesso!" });
      
      return data;
    } catch (error) {
      log.error("Erro ao salvar configurações", error);
      toast.error("Erro ao salvar configurações", { description: "Não foi possível salvar as configurações" });
      throw error;
    }
  }, [toast]);

  const addSleepLog = useCallback(async (
    logData: Omit<BabySleepLog, "id" | "user_id" | "created_at" | "updated_at">
  ) => {
    return await addLog(logData as Record<string, unknown>);
  }, [addLog]);

  const updateSleepLog = useCallback(async (id: string, updates: Partial<BabySleepLog>) => {
    return await updateLog(id, updates as Record<string, unknown>);
  }, [updateLog]);

  const deleteSleepLog = useCallback(async (id: string) => {
    await removeLog(id);
  }, [removeLog]);

  const reloadData = useCallback(async () => {
    await Promise.all([reloadLogs(), loadSettingsAndMilestones()]);
  }, [reloadLogs, loadSettingsAndMilestones]);

  useEffect(() => {
    loadSettingsAndMilestones();
  }, [loadSettingsAndMilestones]);

  return {
    sleepLogs,
    settings,
    milestones,
    loading: logsLoading || settingsLoading,
    saveSettings,
    addSleepLog,
    updateSleepLog,
    deleteSleepLog,
    reloadData,
  };
};
