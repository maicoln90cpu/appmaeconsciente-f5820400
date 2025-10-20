import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAchievements } from "@/hooks/useAchievements";
import type { 
  BabyFeedingLog, 
  BreastMilkStorage, 
  FeedingSettings 
} from "@/types/babyFeeding";

export const useBabyFeeding = () => {
  const [feedingLogs, setFeedingLogs] = useState<BabyFeedingLog[]>([]);
  const [storage, setStorage] = useState<BreastMilkStorage[]>([]);
  const [settings, setSettings] = useState<FeedingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { checkAchievements } = useAchievements();

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const [logsResponse, storageResponse, settingsResponse] = await Promise.all([
        supabase
          .from("baby_feeding_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("start_time", { ascending: false }),
        supabase
          .from("breast_milk_storage")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_used", false)
          .order("pumped_at", { ascending: false }),
        supabase
          .from("feeding_settings")
          .select("*")
          .eq("user_id", user.id)
          .single()
      ]);

      if (logsResponse.error) throw logsResponse.error;
      if (storageResponse.error) throw storageResponse.error;
      
      setFeedingLogs(logsResponse.data as any || []);
      setStorage(storageResponse.data as any || []);
      setSettings(settingsResponse.data as any || null);
    } catch (error: any) {
      if (error.code !== 'PGRST116') {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados de amamentação");
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Omit<FeedingSettings, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("feeding_settings")
        .upsert({
          user_id: user.id,
          ...newSettings
        })
        .select()
        .single();

      if (error) throw error;
      
      setSettings(data as any);
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações");
      throw error;
    }
  };

  const addFeedingLog = async (log: Omit<BabyFeedingLog, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("baby_feeding_logs")
        .insert({
          user_id: user.id,
          ...log
        })
        .select()
        .single();

      if (error) throw error;
      
      setFeedingLogs([data as any, ...feedingLogs]);
      
      // Update last breast side if breastfeeding
      if (log.feeding_type === 'breastfeeding' && log.breast_side && log.breast_side !== 'both') {
        await supabase
          .from("feeding_settings")
          .update({ last_breast_side: log.breast_side })
          .eq("user_id", user.id);
      }
      
      toast.success("Mamada registrada com sucesso!");
      
      // Verificar conquistas após adicionar
      setTimeout(() => checkAchievements(), 1000);
    } catch (error) {
      console.error("Erro ao adicionar registro:", error);
      toast.error("Erro ao registrar mamada");
      throw error;
    }
  };

  const updateFeedingLog = async (id: string, updates: Partial<BabyFeedingLog>) => {
    try {
      const { data, error } = await supabase
        .from("baby_feeding_logs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      setFeedingLogs(feedingLogs.map(log => log.id === id ? data as any : log));
      toast.success("Registro atualizado!");
    } catch (error) {
      console.error("Erro ao atualizar registro:", error);
      toast.error("Erro ao atualizar registro");
      throw error;
    }
  };

  const deleteFeedingLog = async (id: string) => {
    try {
      const { error } = await supabase
        .from("baby_feeding_logs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setFeedingLogs(feedingLogs.filter(log => log.id !== id));
      toast.success("Registro excluído!");
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      toast.error("Erro ao excluir registro");
      throw error;
    }
  };

  const addStorage = async (item: Omit<BreastMilkStorage, "id" | "user_id" | "created_at" | "updated_at" | "is_used" | "used_at">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("breast_milk_storage")
        .insert({
          user_id: user.id,
          is_used: false,
          ...item
        })
        .select()
        .single();

      if (error) throw error;
      
      setStorage([data as any, ...storage]);
      toast.success("Leite armazenado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar estoque:", error);
      toast.error("Erro ao armazenar leite");
      throw error;
    }
  };

  const markStorageAsUsed = async (id: string) => {
    try {
      const { error } = await supabase
        .from("breast_milk_storage")
        .update({ 
          is_used: true,
          used_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;
      
      setStorage(storage.filter(item => item.id !== id));
      toast.success("Leite marcado como usado!");
    } catch (error) {
      console.error("Erro ao marcar como usado:", error);
      toast.error("Erro ao atualizar estoque");
      throw error;
    }
  };

  const reloadData = () => {
    setLoading(true);
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    feedingLogs,
    storage,
    settings,
    loading,
    saveSettings,
    addFeedingLog,
    updateFeedingLog,
    deleteFeedingLog,
    addStorage,
    markStorageAsUsed,
    reloadData
  };
};
