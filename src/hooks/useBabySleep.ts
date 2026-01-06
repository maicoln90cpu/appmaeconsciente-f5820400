import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BabySleepLog, BabySleepSettings, BabySleepMilestone } from "@/types/babySleep";
import { useToast } from "@/hooks/useToast";
import { useAchievements } from "@/hooks/useAchievements";

export const useBabySleep = () => {
  const [sleepLogs, setSleepLogs] = useState<BabySleepLog[]>([]);
  const [settings, setSettings] = useState<BabySleepSettings | null>(null);
  const [milestones, setMilestones] = useState<BabySleepMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkAchievements } = useAchievements();
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para acessar este recurso.",
          variant: "destructive",
        });
        return;
      }

      // Carregar configurações
      const { data: settingsData } = await supabase
        .from("baby_sleep_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setSettings(settingsData);

      // Carregar registros de sono
      const { data: logsData, error: logsError } = await supabase
        .from("baby_sleep_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("sleep_start", { ascending: false });

      if (logsError) throw logsError;
      setSleepLogs((logsData as BabySleepLog[]) || []);

      // Carregar marcos de sono
      const { data: milestonesData, error: milestonesError } = await supabase
        .from("baby_sleep_milestones")
        .select("*")
        .order("age_range_start");

      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData || []);

    } catch (error: any) {
      console.error("Error loading sleep data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const saveSettings = async (newSettings: Omit<BabySleepSettings, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
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

      setSettings(data);
      toast({
        title: "Configurações salvas",
        description: "Suas configurações foram atualizadas com sucesso!",
      });
      
      return data;
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const addSleepLog = async (log: Omit<BabySleepLog, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("baby_sleep_logs")
        .insert({
          ...log,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setSleepLogs(prev => [data as BabySleepLog, ...prev]);
      toast({
        title: "Registro salvo",
        description: "O registro de sono foi adicionado com sucesso!",
      });
      
      // Verificar conquistas após adicionar
      setTimeout(() => checkAchievements(), 1000);
      
      return data;
    } catch (error: any) {
      console.error("Error adding sleep log:", error);
      toast({
        title: "Erro ao adicionar registro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateSleepLog = async (id: string, updates: Partial<BabySleepLog>) => {
    try {
      const { data, error } = await supabase
        .from("baby_sleep_logs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setSleepLogs(prev => prev.map(log => log.id === id ? (data as BabySleepLog) : log));
      toast({
        title: "Registro atualizado",
        description: "O registro de sono foi atualizado com sucesso!",
      });
      
      return data;
    } catch (error: any) {
      console.error("Error updating sleep log:", error);
      toast({
        title: "Erro ao atualizar registro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteSleepLog = async (id: string) => {
    try {
      const { error } = await supabase
        .from("baby_sleep_logs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSleepLogs(prev => prev.filter(log => log.id !== id));
      toast({
        title: "Registro excluído",
        description: "O registro de sono foi removido com sucesso!",
      });
    } catch (error: any) {
      console.error("Error deleting sleep log:", error);
      toast({
        title: "Erro ao excluir registro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    sleepLogs,
    settings,
    milestones,
    loading,
    saveSettings,
    addSleepLog,
    updateSleepLog,
    deleteSleepLog,
    reloadData: loadData,
  };
};
