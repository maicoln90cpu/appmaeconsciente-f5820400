/**
 * @fileoverview Hook para gerenciamento do perfil do usuário
 * @module hooks/useProfile
 */

import { useState, useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";

/**
 * Interface que representa o perfil completo do usuário
 * Contém informações pessoais, de gestação e pós-parto
 */
export interface Profile {
  /** ID único do perfil (mesmo ID do usuário auth) */
  id: string;
  /** Email do usuário */
  email: string;
  /** Nome completo */
  full_name?: string;
  /** Número de WhatsApp */
  whatsapp?: string;
  /** Idade em anos */
  idade?: number;
  /** Sexo/gênero */
  sexo?: string;
  /** URL da foto de perfil */
  foto_perfil_url?: string;
  /** Meses de gestação (1-9) */
  meses_gestacao?: number;
  /** Se possui outros filhos */
  possui_filhos?: boolean;
  /** Idades dos outros filhos em anos */
  idades_filhos?: number[];
  /** Cidade de residência */
  cidade?: string;
  /** Estado/UF */
  estado?: string;
  /** Data prevista para o parto */
  data_prevista_parto?: string;
  /** Data de início do planejamento do enxoval */
  data_inicio_planejamento?: string;
  /** Peso atual em kg */
  peso_atual?: number;
  /** Altura em centímetros */
  altura_cm?: number;
  /** Se o perfil está completo com informações obrigatórias */
  perfil_completo: boolean;
  /** Data real do parto (pós-parto) */
  delivery_date?: string;
  /** Tipo de parto: normal ou cesárea */
  delivery_type?: string;
  /** Notas sobre recuperação pós-parto */
  postpartum_notes?: string;
  /** Semana de pós-parto (calculada) */
  postpartum_week?: number;
  /** Data de criação do perfil */
  created_at: string;
  /** Data da última atualização */
  updated_at: string;
}

/**
 * Hook para carregar e atualizar o perfil do usuário autenticado
 * 
 * @returns Objeto contendo:
 * - `profile`: Dados do perfil ou null se não carregado
 * - `loading`: Estado de carregamento
 * - `updateProfile`: Função para atualizar o perfil
 * - `reloadProfile`: Função para recarregar os dados do perfil
 * 
 * @example
 * ```tsx
 * const { profile, loading, updateProfile } = useProfile();
 * 
 * if (loading) return <Spinner />;
 * 
 * const handleSave = async () => {
 *   const { error } = await updateProfile({ full_name: 'Novo Nome' });
 *   if (!error) console.log('Salvo!');
 * };
 * ```
 */
export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Carrega o perfil do usuário autenticado do banco de dados
   * @internal
   */
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
        .maybeSingle();

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

  /**
   * Atualiza parcialmente o perfil do usuário
   * 
   * @param updates - Objeto com os campos a serem atualizados
   * @returns Objeto com `error` (null se sucesso, mensagem se erro)
   */
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
