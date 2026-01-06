import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import type {
  BabyVaccinationProfile,
  VaccinationCalendar,
  BabyVaccination,
  VaccinationReminderSettings,
} from "@/types/vaccination";

export const useVaccination = () => {
  const [profiles, setProfiles] = useState<BabyVaccinationProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<BabyVaccinationProfile | null>(null);
  const [calendar, setCalendar] = useState<VaccinationCalendar[]>([]);
  const [vaccinations, setVaccinations] = useState<BabyVaccination[]>([]);
  const [settings, setSettings] = useState<VaccinationReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar perfis do bebê
      const { data: profilesData, error: profilesError } = await supabase
        .from('baby_vaccination_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setProfiles((profilesData || []) as BabyVaccinationProfile[]);
      
      if (profilesData && profilesData.length > 0) {
        const activeProfile = profilesData[0] as BabyVaccinationProfile;
        setCurrentProfile(activeProfile);

        // Carregar calendário de vacinação
        const { data: calendarData, error: calendarError } = await supabase
          .from('vaccination_calendar')
          .select('*')
          .eq('calendar_type', activeProfile.calendar_type)
          .order('age_months', { ascending: true })
          .order('dose_number', { ascending: true });

        if (calendarError) throw calendarError;
        setCalendar((calendarData || []) as VaccinationCalendar[]);

        // Carregar vacinas aplicadas
        const { data: vaccinationsData, error: vaccinationsError } = await supabase
          .from('baby_vaccinations')
          .select('*')
          .eq('baby_profile_id', activeProfile.id)
          .order('application_date', { ascending: false });

        if (vaccinationsError) throw vaccinationsError;
        setVaccinations(vaccinationsData || []);

        // Carregar configurações de lembretes
        const { data: settingsData, error: settingsError } = await supabase
          .from('vaccination_reminder_settings')
          .select('*')
          .eq('baby_profile_id', activeProfile.id)
          .maybeSingle();

        if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
        setSettings(settingsData);
      } else {
        setCurrentProfile(null);
        setCalendar([]);
        setVaccinations([]);
        setSettings(null);
      }
    } catch (error) {
      console.error('Error loading vaccination data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de vacinação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveProfile = async (profile: Partial<BabyVaccinationProfile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
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

      toast({
        title: "Sucesso",
        description: "Perfil do bebê salvo com sucesso!",
      });
      await loadData();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar perfil do bebê",
        variant: "destructive",
      });
      return { data: null, error: error.message };
    }
  };

  const addVaccination = async (vaccination: Partial<BabyVaccination>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
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

      toast({
        title: "Sucesso",
        description: "Vacina registrada com sucesso!",
      });
      await loadData();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error adding vaccination:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar vacina",
        variant: "destructive",
      });
      return { data: null, error: error.message };
    }
  };

  const updateVaccination = async (id: string, updates: Partial<BabyVaccination>) => {
    try {
      const { error } = await supabase
        .from('baby_vaccinations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Vacina atualizada com sucesso!",
      });
      await loadData();
      return { error: null };
    } catch (error: any) {
      console.error('Error updating vaccination:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar vacina",
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const deleteVaccination = async (id: string) => {
    try {
      const { error } = await supabase
        .from('baby_vaccinations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Vacina removida com sucesso!",
      });
      await loadData();
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting vaccination:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover vacina",
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const saveSettings = async (newSettings: Partial<VaccinationReminderSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
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

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });
      await loadData();
      return { error: null };
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const switchProfile = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setCurrentProfile(profile);
      await loadData();
    }
  };

  return {
    profiles,
    currentProfile,
    calendar,
    vaccinations,
    settings,
    loading,
    saveProfile,
    addVaccination,
    updateVaccination,
    deleteVaccination,
    saveSettings,
    switchProfile,
    reloadData: loadData,
  };
};
