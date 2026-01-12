import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logger from "@/lib/logger";
import type {
  BabyVaccinationProfile,
  VaccinationCalendar,
  BabyVaccination,
  VaccinationReminderSettings,
} from "@/types/vaccination";
import { useAuth } from "@/contexts/AuthContext";

export const useVaccination = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Query para perfis do bebê
  const profilesQuery = useQuery({
    queryKey: ['vaccination-profiles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('baby_vaccination_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        logger.error('Error loading profiles', error, { context: 'useVaccination' });
        throw error;
      }
      return data as BabyVaccinationProfile[];
    },
    enabled: !!user
  });

  // Perfil atual (selecionado ou primeiro da lista)
  const currentProfile = useMemo(() => {
    if (!profilesQuery.data?.length) return null;
    if (selectedProfileId) {
      return profilesQuery.data.find(p => p.id === selectedProfileId) ?? profilesQuery.data[0];
    }
    return profilesQuery.data[0];
  }, [profilesQuery.data, selectedProfileId]);

  // Query para calendário (depende do perfil)
  const calendarQuery = useQuery({
    queryKey: ['vaccination-calendar', currentProfile?.calendar_type],
    queryFn: async () => {
      if (!currentProfile) return [];
      
      const { data, error } = await supabase
        .from('vaccination_calendar')
        .select('*')
        .eq('calendar_type', currentProfile.calendar_type)
        .order('age_months', { ascending: true })
        .order('dose_number', { ascending: true });
      
      if (error) {
        logger.error('Error loading calendar', error, { context: 'useVaccination' });
        throw error;
      }
      return data as VaccinationCalendar[];
    },
    enabled: !!currentProfile,
    staleTime: 1000 * 60 * 30 // 30 minutes - calendar data rarely changes
  });

  // Query para vacinas aplicadas (depende do perfil)
  const vaccinationsQuery = useQuery({
    queryKey: ['baby-vaccinations', currentProfile?.id],
    queryFn: async () => {
      if (!currentProfile) return [];
      
      const { data, error } = await supabase
        .from('baby_vaccinations')
        .select('*')
        .eq('baby_profile_id', currentProfile.id)
        .order('application_date', { ascending: false });
      
      if (error) {
        logger.error('Error loading vaccinations', error, { context: 'useVaccination' });
        throw error;
      }
      return data as BabyVaccination[];
    },
    enabled: !!currentProfile
  });

  // Query para configurações de lembretes
  const settingsQuery = useQuery({
    queryKey: ['vaccination-settings', currentProfile?.id],
    queryFn: async () => {
      if (!currentProfile) return null;
      
      const { data, error } = await supabase
        .from('vaccination_reminder_settings')
        .select('*')
        .eq('baby_profile_id', currentProfile.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        logger.error('Error loading settings', error, { context: 'useVaccination' });
        throw error;
      }
      return data as VaccinationReminderSettings | null;
    },
    enabled: !!currentProfile
  });

  // Mutation para salvar perfil
  const saveProfileMutation = useMutation({
    mutationFn: async (profile: Partial<BabyVaccinationProfile>) => {
      if (!user) throw new Error('Usuário não autenticado');

      const profileData = {
        ...profile,
        user_id: user.id,
      } as any;

      const { data, error } = await supabase
        .from('baby_vaccination_profiles')
        .upsert([profileData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccination-profiles'] });
      toast.success("Perfil do bebê salvo com sucesso!");
    },
    onError: (error) => {
      logger.error('Error saving profile', error, { context: 'useVaccination' });
      toast.error("Erro ao salvar perfil do bebê");
    }
  });

  // Mutation para adicionar vacinação
  const addVaccinationMutation = useMutation({
    mutationFn: async (vaccination: Partial<BabyVaccination>) => {
      if (!user) throw new Error('Usuário não autenticado');
      if (!currentProfile) throw new Error('Nenhum perfil de bebê selecionado');

      const vaccinationData = {
        ...vaccination,
        user_id: user.id,
        baby_profile_id: currentProfile.id,
      } as any;

      const { data, error } = await supabase
        .from('baby_vaccinations')
        .insert([vaccinationData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-vaccinations', currentProfile?.id] });
      toast.success("Vacina registrada com sucesso!");
    },
    onError: (error) => {
      logger.error('Error adding vaccination', error, { context: 'useVaccination' });
      toast.error("Erro ao registrar vacina");
    }
  });

  // Mutation para atualizar vacinação
  const updateVaccinationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BabyVaccination> }) => {
      const { error } = await supabase
        .from('baby_vaccinations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-vaccinations', currentProfile?.id] });
      toast.success("Vacina atualizada com sucesso!");
    },
    onError: (error) => {
      logger.error('Error updating vaccination', error, { context: 'useVaccination' });
      toast.error("Erro ao atualizar vacina");
    }
  });

  // Mutation para deletar vacinação
  const deleteVaccinationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('baby_vaccinations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-vaccinations', currentProfile?.id] });
      toast.success("Vacina removida com sucesso!");
    },
    onError: (error) => {
      logger.error('Error deleting vaccination', error, { context: 'useVaccination' });
      toast.error("Erro ao remover vacina");
    }
  });

  // Mutation para salvar configurações
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<VaccinationReminderSettings>) => {
      if (!user) throw new Error('Usuário não autenticado');
      if (!currentProfile) throw new Error('Nenhum perfil de bebê selecionado');

      const settingsData = {
        ...newSettings,
        user_id: user.id,
        baby_profile_id: currentProfile.id,
      };

      const { error } = await supabase
        .from('vaccination_reminder_settings')
        .upsert(settingsData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccination-settings', currentProfile?.id] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      logger.error('Error saving settings', error, { context: 'useVaccination' });
      toast.error("Erro ao salvar configurações");
    }
  });

  // Função para trocar perfil
  const switchProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
  };

  // Wrapper functions to maintain API compatibility
  const saveProfile = async (profile: Partial<BabyVaccinationProfile>) => {
    try {
      const data = await saveProfileMutation.mutateAsync(profile);
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  const addVaccination = async (vaccination: Partial<BabyVaccination>) => {
    try {
      const data = await addVaccinationMutation.mutateAsync(vaccination);
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  const updateVaccination = async (id: string, updates: Partial<BabyVaccination>) => {
    try {
      await updateVaccinationMutation.mutateAsync({ id, updates });
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const deleteVaccination = async (id: string) => {
    try {
      await deleteVaccinationMutation.mutateAsync(id);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const saveSettings = async (newSettings: Partial<VaccinationReminderSettings>) => {
    try {
      await saveSettingsMutation.mutateAsync(newSettings);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  return {
    profiles: profilesQuery.data ?? [],
    currentProfile,
    calendar: calendarQuery.data ?? [],
    vaccinations: vaccinationsQuery.data ?? [],
    settings: settingsQuery.data ?? null,
    loading: profilesQuery.isLoading,
    saveProfile,
    addVaccination,
    updateVaccination,
    deleteVaccination,
    saveSettings,
    switchProfile,
    reloadData: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccination-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['vaccination-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['baby-vaccinations'] });
      queryClient.invalidateQueries({ queryKey: ['vaccination-settings'] });
    },
  };
};
