import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

/**
 * Hook centralizado para ações autenticadas.
 * Elimina a necessidade de repetir `supabase.auth.getUser()` em cada função.
 * 
 * @example
 * const { executeAuthenticated, getUserId } = useAuthenticatedAction();
 * 
 * const handleSave = async () => {
 *   await executeAuthenticated(async (userId) => {
 *     await supabase.from('table').insert({ user_id: userId, ...data });
 *   });
 * };
 */
export const useAuthenticatedAction = () => {

  /**
   * Obtém o ID do usuário atual de forma assíncrona.
   * Retorna null se não autenticado.
   */
  const getUserId = useCallback(async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  }, []);

  /**
   * Executa uma ação apenas se o usuário estiver autenticado.
   * Mostra toast de erro se não autenticado.
   * 
   * @param action Função a ser executada com o userId
   * @param options Opções de customização
   * @returns Resultado da ação ou null se não autenticado
   */
  const executeAuthenticated = useCallback(async <T>(
    action: (userId: string) => Promise<T>,
    options?: {
      silentError?: boolean;
      errorMessage?: string;
    }
  ): Promise<T | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        if (!options?.silentError) {
          toast.error("Não autenticado", { description: options?.errorMessage ?? "Você precisa estar logado para realizar esta ação." });
        }
        return null;
      }
      
      return await action(user.id);
    } catch (error) {
      logger.error("Error in authenticated action", error, { context: "useAuthenticatedAction" });
      throw error;
    }
  }, [toast]);

  /**
   * Verifica se o usuário está autenticado (síncrono check via cache).
   * Para verificações que precisam de garantia, use getUserId ou executeAuthenticated.
   */
  const requireAuth = useCallback(async (): Promise<string> => {
    const userId = await getUserId();
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return userId;
  }, [getUserId]);

  return {
    getUserId,
    executeAuthenticated,
    requireAuth,
  };
};

/**
 * Função utilitária para obter o usuário atual (para uso em queryFn do React Query)
 * Lança erro se não autenticado.
 */
export const getAuthenticatedUser = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
};
