/**
 * @fileoverview Hook para gerenciamento do perfil do usuário
 * @module hooks/useProfile
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  /** Data de criação do perfil */
  created_at: string;
  /** Data da última atualização */
  updated_at: string;
}

const PROFILE_QUERY_KEY = ["profile"] as const;
const STALE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches profile data from Supabase
 */
const fetchProfile = async (userId: string | undefined): Promise<Profile | null> => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error loading profile:", error);
    return null;
  }

  return data;
};

/**
 * Hook para carregar e atualizar o perfil do usuário autenticado
 * Usa React Query para caching e gerenciamento de estado
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: loading, refetch } = useQuery({
    queryKey: [...PROFILE_QUERY_KEY, user?.id],
    queryFn: () => fetchProfile(user?.id),
    enabled: !!user?.id,
    staleTime: STALE_TIME,
    gcTime: 10 * 60 * 1000, // 10 minutes cache
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
      queryClient.setQueryData([...PROFILE_QUERY_KEY, user?.id], (old: Profile | null) => {
        if (!old) return old;
        return { ...old, ...updates };
      });
    },
  });

  /**
   * Atualiza parcialmente o perfil do usuário
   * 
   * @param updates - Objeto com os campos a serem atualizados
   * @returns Objeto com `error` (null se sucesso, mensagem se erro)
   */
  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      await updateMutation.mutateAsync(updates);
      return { error: null };
    } catch (error) {
      console.error("Error in updateProfile:", error);
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
