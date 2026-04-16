import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface ProductMapping {
  id: string;
  hotmart_product_id: string;
  internal_product_id: string;
  product_title: string;
  access_duration_days?: number | null;
}

interface NewMappingData {
  hotmart_id: string;
  product_id: string;
  access_duration_days: number | null;
  is_lifetime: boolean;
}

export function useHotmartMappings() {
  const queryClient = useQueryClient();

  const { data: mappings = [], isLoading: loadingMappings } = useQuery({
    queryKey: ['admin', 'hotmart-mappings'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('hotmart_product_mapping' as any)
        .select(
          `id, hotmart_product_id, internal_product_id, products:internal_product_id (title, access_duration_days)`
        ) as any);
      if (error) throw error;
      return (data ?? []).map((m: any) => ({
        id: m.id,
        hotmart_product_id: m.hotmart_product_id,
        internal_product_id: m.internal_product_id,
        product_title: m.products?.title || 'Produto Deletado',
        access_duration_days: m.products?.access_duration_days,
      })) as ProductMapping[];
    },
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['admin', 'hotmart-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, is_free')
        .eq('is_free', false)
        .order('title');
      if (error) throw error;
      return data ?? [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (mapping: NewMappingData) => {
      const { error: mappingError } = await (supabase
        .from('hotmart_product_mapping' as any)
        .insert({
          hotmart_product_id: mapping.hotmart_id,
          internal_product_id: mapping.product_id,
        }) as any);
      if (mappingError) throw mappingError;

      const accessDuration = mapping.is_lifetime ? null : mapping.access_duration_days;
      const { error: productError } = await supabase
        .from('products')
        .update({ access_duration_days: accessDuration } as any)
        .eq('id', mapping.product_id);
      if (productError) throw productError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'hotmart-mappings'] });
      toast('Mapeamento criado com sucesso!');
    },
    onError: error => {
      logger.error('Add mapping error', error, { context: 'useHotmartMappings' });
      toast.error('Erro ao criar mapeamento');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('hotmart_product_mapping' as any)
        .delete()
        .eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'hotmart-mappings'] });
      toast('Mapeamento deletado');
    },
    onError: error => {
      logger.error('Delete mapping error', error, { context: 'useHotmartMappings' });
      toast.error('Erro ao deletar mapeamento');
    },
  });

  return {
    mappings,
    products,
    isLoading: loadingMappings || loadingProducts,
    addMapping: addMutation.mutate,
    addMappingAsync: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    deleteMapping: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

export type { ProductMapping, NewMappingData };
