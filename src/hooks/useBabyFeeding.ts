/**
 * @fileoverview Hook para gerenciamento de dados de amamentação do bebê
 * Utiliza useBabyLogs como base para operações CRUD
 * @module hooks/useBabyFeeding
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBabyLogs } from '@/hooks/useBabyLogs';
import { logger } from '@/lib/logger';
import type { BabyFeedingLog, BreastMilkStorage, FeedingSettings } from '@/types/babyFeeding';
import { toast } from 'sonner';

const log = logger.scoped('useBabyFeeding');

export const useBabyFeeding = () => {
  const [storage, setStorage] = useState<BreastMilkStorage[]>([]);
  const [settings, setSettings] = useState<FeedingSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Usar hook base para logs de amamentação
  const {
    data: feedingLogs,
    loading: logsLoading,
    add: addLog,
    update: updateLog,
    remove: removeLog,
    reload: reloadLogs,
  } = useBabyLogs<BabyFeedingLog>({
    tableName: 'baby_feeding_logs',
    orderBy: { column: 'start_time', ascending: false },
    entityName: 'Mamada',
    checkAchievementsOnAdd: true,
  });

  // Carregar configurações e estoque separadamente
  const loadSettingsAndStorage = useCallback(async () => {
    try {
      setSettingsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        setStorage([]);
        setSettings(null);
        return;
      }

      const [storageResponse, settingsResponse] = await Promise.all([
        supabase
          .from('breast_milk_storage')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_used', false)
          .order('pumped_at', { ascending: false }),
        supabase.from('feeding_settings').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      if (storageResponse.error) throw storageResponse.error;

      setStorage((storageResponse.data as BreastMilkStorage[]) || []);
      setSettings((settingsResponse.data as FeedingSettings) || null);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code !== 'PGRST116') {
        log.error('Erro ao carregar configurações e estoque', error);
        toast.error('Erro', { description: 'Erro ao carregar dados de amamentação' });
      }
    } finally {
      setSettingsLoading(false);
    }
  }, [toast]);

  const saveSettings = useCallback(
    async (newSettings: Omit<FeedingSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) throw new Error('Não autenticado');

        const { data, error } = await supabase
          .from('feeding_settings')
          .upsert({
            user_id: user.id,
            ...newSettings,
          })
          .select()
          .single();

        if (error) throw error;

        setSettings(data as FeedingSettings);
        toast('Sucesso', { description: 'Configurações salvas com sucesso!' });

        return data;
      } catch (error) {
        log.error('Erro ao salvar configurações', error);
        toast.error('Erro', { description: 'Erro ao salvar configurações' });
        throw error;
      }
    },
    [toast]
  );

  const addFeedingLog = useCallback(
    async (logData: Omit<BabyFeedingLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const result = await addLog(logData as Record<string, unknown>);

      // Update last breast side if breastfeeding
      if (
        logData.feeding_type === 'breastfeeding' &&
        logData.breast_side &&
        logData.breast_side !== 'both'
      ) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            await supabase
              .from('feeding_settings')
              .update({ last_breast_side: logData.breast_side })
              .eq('user_id', userData.user.id);
          }
        } catch (error) {
          log.warn('Erro ao atualizar último lado', error);
        }
      }

      return result;
    },
    [addLog]
  );

  const updateFeedingLog = useCallback(
    async (id: string, updates: Partial<BabyFeedingLog>) => {
      return await updateLog(id, updates as Record<string, unknown>);
    },
    [updateLog]
  );

  const deleteFeedingLog = useCallback(
    async (id: string) => {
      await removeLog(id);
    },
    [removeLog]
  );

  const addStorage = useCallback(
    async (
      item: Omit<
        BreastMilkStorage,
        'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_used' | 'used_at'
      >
    ) => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) throw new Error('Não autenticado');

        const { data, error } = await supabase
          .from('breast_milk_storage')
          .insert({
            user_id: user.id,
            is_used: false,
            ...item,
          })
          .select()
          .single();

        if (error) throw error;

        setStorage(prev => [data as BreastMilkStorage, ...prev]);
        toast('Sucesso', { description: 'Leite armazenado com sucesso!' });

        return data;
      } catch (error) {
        log.error('Erro ao adicionar estoque', error);
        toast.error('Erro', { description: 'Erro ao armazenar leite' });
        throw error;
      }
    },
    [toast]
  );

  const markStorageAsUsed = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from('breast_milk_storage')
          .update({
            is_used: true,
            used_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;

        setStorage(prev => prev.filter(item => item.id !== id));
        toast('Sucesso', { description: 'Leite marcado como usado!' });
      } catch (error) {
        log.error('Erro ao marcar como usado', error);
        toast.error('Erro', { description: 'Erro ao atualizar estoque' });
        throw error;
      }
    },
    [toast]
  );

  const reloadData = useCallback(async () => {
    await Promise.all([reloadLogs(), loadSettingsAndStorage()]);
  }, [reloadLogs, loadSettingsAndStorage]);

  useEffect(() => {
    loadSettingsAndStorage();
  }, [loadSettingsAndStorage]);

  return {
    feedingLogs,
    storage,
    settings,
    loading: logsLoading || settingsLoading,
    saveSettings,
    addFeedingLog,
    updateFeedingLog,
    deleteFeedingLog,
    addStorage,
    markStorageAsUsed,
    reloadData,
  };
};
