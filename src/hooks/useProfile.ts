/**
 * @fileoverview Hook para gerenciamento do perfil do usuário
 * @module hooks/useProfile
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import { QueryKeys, QueryCacheConfig } from "@/lib/query-config";

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
  /** Se o onboarding foi completado */
  onboarding_completed?: boolean;
  /** Data de conclusão do onboarding */
  onboarding_completed_at?: string;
  /** Fase da maternidade: gestante ou pos-parto */
  fase_maternidade?: string;
  /** Modo simples: oculta funções avançadas */
  simple_mode?: boolean;
  /** Data de criação do perfil */
  created_at: string;
  /** Data da última atualização */
  updated_at: string;
}

/**
 * Fetches profile data from Supabase
 */
const fetchProfile = async (userId: string | undefined): Promise<Profile | null> => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, whatsapp, idade, sexo, foto_perfil_url, meses_gestacao, possui_filhos, idades_filhos, cidade, estado, data_prevista_parto, data_inicio_planejamento, peso_atual, altura_cm, perfil_completo, delivery_date, delivery_type, postpartum_notes, onboarding_completed, onboarding_completed_at, fase_maternidade, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    logger.error("Error loading profile", error, { context: "useProfile" });
    return null;
  }

  return data;
};

/**
 * Hook para carregar e atualizar o perfil do usuário autenticado
 * Usa React Query para caching e gerenciamento de estado
 */
export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: loading, refetch } = useQuery({
    queryKey: QueryKeys.profile(user?.id ?? ''),
    queryFn: () => fetchProfile(user?.id),
    enabled: !!user?.id,
    staleTime: QueryCacheConfig.user.staleTime,
    gcTime: QueryCacheConfig.user.gcTime,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;
      return updates;
    },
    onSuccess: (updates) => {
      // Optimistically update the cache
      queryClient.setQueryData(QueryKeys.profile(user?.id ?? ''), (old: Profile | null) => {
        if (!old) return old;
        return { ...old, ...updates };
      });
    },
  });

  /**
   * Atualiza parcialmente o perfil do usuário
   */
  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      await updateMutation.mutateAsync(updates);
      return { error: null };
    } catch (error) {
      logger.error("Error in updateProfile", error, { context: "useProfile" });
      return { error: error instanceof Error ? error.message : "Failed to update profile" };
    }
  };

  const reloadProfile = () => {
    refetch();
  };

  return { 
    profile: profile ?? null, 
    loading, 
    updateProfile, 
    reloadProfile 
  };
};
