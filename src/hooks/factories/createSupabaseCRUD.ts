import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getAuthenticatedUser } from '@/hooks/useAuthenticatedAction';

import { logger } from '@/lib/logger';

import { supabase } from '@/integrations/supabase/client';


type OrderDirection = 'asc' | 'desc';

interface CRUDMessages {
  addSuccess?: string;
  addError?: string;
  updateSuccess?: string;
  updateError?: string;
  deleteSuccess?: string;
  deleteError?: string;
}

interface CRUDOptions<T> {
  /** Nome da tabela no Supabase */
  tableName: string;
  /** Chave para o React Query */
  queryKey: QueryKey;
  /** Campo para ordenação (default: created_at) */
  orderBy?: string;
  /** Direção da ordenação (default: desc) */
  orderDirection?: OrderDirection;
  /** Filtros adicionais para a query */
  additionalFilters?: Record<string, unknown>;
  /** Callback após sucesso no add */
  onAddSuccess?: (data: T) => void;
  /** Callback após sucesso no update */
  onUpdateSuccess?: (data: T) => void;
  /** Callback após sucesso no delete */
  onDeleteSuccess?: (id: string) => void;
  /** Mensagens customizadas */
  messages?: CRUDMessages;
}

/**
 * Factory para criar hooks de CRUD genéricos com React Query.
 * Elimina código duplicado em hooks que seguem o padrão query + add + update + delete.
 *
 * ## Hooks Migrados para esta Factory:
 * - useBabyAppointments (consultas/agendamentos do bebê)
 * - useBabyColic (registros de cólica)
 * - useGrowthMeasurements (medições de crescimento)
 * - usePostpartumAppointments (consultas pós-parto)
 *
 * ## Hooks que NÃO devem ser migrados (lógica complexa):
 * - useBabyMedications (múltiplas queries, lógica de logs)
 * - useBabyRoutines (múltiplas queries, filtragem por dia)
 * - useContractions (timer, lógica de sessão)
 * - useFoodIntroduction (auto-detect alérgenos)
 * - useTickets (validação Zod, rate limiting)
 * - useToolSuggestions (criação de ticket vinculado)
 * - useEmotionalLogs (alertas de Edinburgh Scale)
 * - usePostpartumSymptoms (alertas de sintomas)
 * - useBodyImageLog (upload de arquivos)
 * - useRecoveryChecklist (template de semanas)
 * - useDevelopmentMilestones (cálculos complexos, upsert)
 *
 * @example
 * // Definir o tipo da entidade
 * type EmotionalLog = Database['public']['Tables']['emotional_logs']['Row'];
 * type EmotionalLogInsert = Database['public']['Tables']['emotional_logs']['Insert'];
 *
 * export const useEmotionalLogsBase = createSupabaseCRUD<EmotionalLog, EmotionalLogInsert>({
 *   tableName: 'emotional_logs',
 *   queryKey: ['emotional-logs'],
 *   orderBy: 'date',
 *   messages: {
 *     addSuccess: 'Registro emocional salvo',
 *   },
 * });
 */
export function createSupabaseCRUD<T extends { id: string }, InsertT = Partial<T>>(
  options: CRUDOptions<T>
) {
  const {
    tableName,
    queryKey,
    orderBy = 'created_at',
    orderDirection = 'desc',
    additionalFilters = {},
    onAddSuccess,
    onUpdateSuccess,
    onDeleteSuccess,
    messages = {},
  } = options;

  return function useCRUD() {
    const queryClient = useQueryClient();

    // Query principal
    const { data, isLoading, error, refetch } = useQuery({
      queryKey,
      queryFn: async (): Promise<T[]> => {
        const userId = await getAuthenticatedUser();

        let query = (supabase.from(tableName as any).select('*') as any).eq('user_id', userId);

        // Aplicar filtros adicionais
        Object.entries(additionalFilters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        // Ordenação
        const { data, error } = await query.order(orderBy, { ascending: orderDirection === 'asc' });

        if (error) throw error;
        return data as T[];
      },
    });

    // Mutation para adicionar
    const addMutation = useMutation({
      mutationFn: async (item: Omit<InsertT, 'user_id'>): Promise<T> => {
        const userId = await getAuthenticatedUser();

        const { data, error } = await (supabase
          .from(tableName as any)
          .insert({ ...item, user_id: userId } as any)
          .select()
          .single() as any);

        if (error) throw error;
        return data as T;
      },
      onSuccess: data => {
        queryClient.invalidateQueries({ queryKey });
        toast('Sucesso', { description: messages.addSuccess ?? 'Item adicionado com sucesso' });
        onAddSuccess?.(data);
      },
      onError: error => {
        logger.error('Add error', error, { context: 'createSupabaseCRUD', data: { tableName } });
        toast.error('Erro', { description: messages.addError ?? 'Erro ao adicionar item' });
      },
    });

    // Mutation para atualizar
    const updateMutation = useMutation({
      mutationFn: async ({ id, ...updates }: { id: string } & Partial<T>): Promise<T> => {
        const { data, error } = await (supabase
          .from(tableName as any)
          .update(updates as any)
          .eq('id', id)
          .select()
          .single() as any);

        if (error) throw error;
        return data as T;
      },
      onSuccess: data => {
        queryClient.invalidateQueries({ queryKey });
        toast('Sucesso', { description: messages.updateSuccess ?? 'Item atualizado com sucesso' });
        onUpdateSuccess?.(data);
      },
      onError: error => {
        logger.error('Update error', error, { context: 'createSupabaseCRUD', data: { tableName } });
        toast.error('Erro', { description: messages.updateError ?? 'Erro ao atualizar item' });
      },
    });

    // Mutation para deletar
    const deleteMutation = useMutation({
      mutationFn: async (id: string): Promise<string> => {
        const { error } = await (supabase
          .from(tableName as any)
          .delete()
          .eq('id', id) as any);

        if (error) throw error;
        return id;
      },
      onSuccess: id => {
        queryClient.invalidateQueries({ queryKey });
        toast('Sucesso', { description: messages.deleteSuccess ?? 'Item removido com sucesso' });
        onDeleteSuccess?.(id);
      },
      onError: error => {
        logger.error('Delete error', error, { context: 'createSupabaseCRUD', data: { tableName } });
        toast.error('Erro', { description: messages.deleteError ?? 'Erro ao remover item' });
      },
    });

    return {
      data: data ?? ([] as T[]),
      isLoading,
      error,
      refetch,
      add: addMutation.mutate,
      addAsync: addMutation.mutateAsync,
      isAdding: addMutation.isPending,
      update: updateMutation.mutate,
      updateAsync: updateMutation.mutateAsync,
      isUpdating: updateMutation.isPending,
      remove: deleteMutation.mutate,
      removeAsync: deleteMutation.mutateAsync,
      isRemoving: deleteMutation.isPending,
    };
  };
}
