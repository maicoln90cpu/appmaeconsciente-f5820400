import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  email: string;
  idade?: number;
  sexo?: string;
  foto_perfil_url?: string;
  meses_gestacao?: number;
  possui_filhos?: boolean;
  idades_filhos?: number[];
  cidade?: string;
  estado?: string;
  data_prevista_parto?: string;
  data_inicio_planejamento?: string;
  perfil_completo: boolean;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in useProfile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        return { error: error.message };
      }

      await loadProfile();
      return { error: null };
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return { error: 'Failed to update profile' };
    }
  };

  return { profile, loading, updateProfile, reloadProfile: loadProfile };
};
