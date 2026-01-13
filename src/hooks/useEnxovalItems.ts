/**
 * @fileoverview Hook para gerenciamento de itens do enxoval
 * @module hooks/useEnxovalItems
 * 
 * Provê operações CRUD com React Query, atualização otimista e paginação
 * para a lista de itens do enxoval do usuário.
 */

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EnxovalItem, Config } from "@/types/enxoval";
import { toast } from "sonner";
import {
  calculatePriority,
  calculateSubtotalPlanned,
  calculateSubtotalPaid,
  calculateSavings,
  calculateSavingsPercent,
} from "@/lib/calculations";
import { useAuth } from "@/contexts/AuthContext";
import logger from "@/lib/logger";

/** Quantidade de itens carregados por página */
const ITEMS_PER_PAGE = 50;

/**
 * Hook para gerenciar itens do enxoval com React Query
 * 
 * @param config - Configuração do usuário (limites RN, dias alerta)
 * @returns Objeto com items, estados e funções de manipulação
 */
export const useEnxovalItems = (config: Config | null) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  /**
   * Processa um item do banco de dados para o formato do frontend
   */
  const processItem = useCallback((dbItem: any): EnxovalItem => {
    const subtotalPlanned = calculateSubtotalPlanned(dbItem.qtd_planejada, dbItem.preco_planejado);
    const subtotalPaid = calculateSubtotalPaid(
      dbItem.qtd_comprada,
      dbItem.preco_unit_pago,
      dbItem.frete,
      dbItem.desconto
    );
    const savings = calculateSavings(subtotalPlanned, subtotalPaid);
    const savingsPercent = calculateSavingsPercent(subtotalPlanned, subtotalPaid);

    // Verificar se excede limite RN (itens tamanho recém-nascido)
    const limite = config?.limites_rn?.find((l) => l.item.toLowerCase() === dbItem.item.toLowerCase());
    const excessoRN = dbItem.tamanho === "RN" && limite && dbItem.qtd_comprada > limite.limite;

    // Verificar se é item supérfluo que foi comprado (possível arrependimento)
    const superfluoComprado = dbItem.necessidade === "Não" && dbItem.status === "Comprado";

    // Verificar proximidade do prazo de troca
    let alertaTroca = false;
    if (dbItem.data_limite_troca && config) {
      const today = new Date();
      const dataLimite = new Date(dbItem.data_limite_troca);
      const diffDays = Math.ceil((dataLimite.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      alertaTroca = diffDays <= config.dias_alerta_troca && diffDays >= 0;
    }

    return {
      id: dbItem.id,
      date: dbItem.data,
      category: dbItem.categoria,
      item: dbItem.item,
      necessity: dbItem.necessidade,
      priority: dbItem.prioridade,
      size: dbItem.tamanho,
      plannedQty: dbItem.qtd_planejada,
      plannedPrice: dbItem.preco_planejado,
      boughtQty: dbItem.qtd_comprada,
      unitPricePaid: dbItem.preco_unit_pago,
      frete: dbItem.frete,
      desconto: dbItem.desconto,
      precoReferencia: dbItem.preco_referencia,
      subtotalPlanned,
      subtotalPaid,
      savings,
      savingsPercent,
      store: dbItem.loja,
      link: dbItem.link,
      status: dbItem.status,
      origin: dbItem.origem,
      dataLimiteTroca: dbItem.data_limite_troca,
      notes: dbItem.obs,
      excessoRN,
      superfluoComprado,
      alertaTroca,
      etapaMaes: dbItem.etapa_maes,
      classificacao: dbItem.classificacao,
      emocao: dbItem.emocao,
      tags: dbItem.tags || [],
    };
  }, [config]);

  // Query infinita para paginação
  const {
    data,
    isLoading: loading,
    isFetchingNextPage: loadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ['enxoval-items', user?.id, config?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user) return { items: [], nextPage: null };

      const from = pageParam * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from("itens_enxoval")
        .select("id, user_id, data, categoria, item, necessidade, prioridade, tamanho, qtd_planejada, preco_planejado, qtd_comprada, preco_unit_pago, frete, desconto, preco_referencia, status, loja, link, origem, data_limite_troca, obs, etapa_maes, classificacao, emocao, tags, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        logger.error("Erro ao carregar itens", error, { context: 'useEnxovalItems' });
        throw error;
      }

      return {
        items: (data || []).map(item => processItem(item)),
        nextPage: (data?.length || 0) === ITEMS_PER_PAGE ? pageParam + 1 : null
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user && !!config,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Flatten dos items paginados
  const items = useMemo(() => 
    data?.pages.flatMap(page => page.items) ?? [],
    [data]
  );

  // Mutation para adicionar com optimistic update
  const addItemMutation = useMutation({
    mutationFn: async (item: Omit<EnxovalItem, "id">) => {
      if (!user) throw new Error('Não autenticado');

      const priority = calculatePriority(item.necessity);

      const { data: newItem, error } = await supabase
        .from("itens_enxoval")
        .insert({
          user_id: user.id,
          data: item.date || null,
          categoria: item.category,
          item: item.item,
          necessidade: item.necessity,
          prioridade: priority,
          tamanho: item.size || null,
          qtd_planejada: item.plannedQty,
          preco_planejado: item.plannedPrice,
          qtd_comprada: item.boughtQty,
          preco_unit_pago: item.unitPricePaid,
          frete: item.frete,
          desconto: item.desconto,
          preco_referencia: item.precoReferencia,
          status: item.status,
          loja: item.store || null,
          link: item.link || null,
          origem: item.origin || null,
          data_limite_troca: item.dataLimiteTroca || null,
          obs: item.notes || null,
          etapa_maes: item.etapaMaes || null,
          classificacao: item.classificacao || null,
          emocao: item.emocao || null,
          tags: item.tags || [],
        })
        .select()
        .single();

      if (error) throw error;
      return newItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enxoval-items'] });
      toast.success("Item adicionado com sucesso!");
    },
    onError: (error) => {
      logger.error("Erro ao adicionar item", error, { context: 'useEnxovalItems' });
      toast.error("Não foi possível adicionar o item.");
    }
  });

  // Mutation para atualizar
  const updateItemMutation = useMutation({
    mutationFn: async (item: EnxovalItem) => {
      const priority = calculatePriority(item.necessity);

      const { error } = await supabase
        .from("itens_enxoval")
        .update({
          data: item.date || null,
          categoria: item.category,
          item: item.item,
          necessidade: item.necessity,
          prioridade: priority,
          tamanho: item.size || null,
          qtd_planejada: item.plannedQty,
          preco_planejado: item.plannedPrice,
          qtd_comprada: item.boughtQty,
          preco_unit_pago: item.unitPricePaid,
          frete: item.frete,
          desconto: item.desconto,
          preco_referencia: item.precoReferencia,
          status: item.status,
          loja: item.store || null,
          link: item.link || null,
          origem: item.origin || null,
          data_limite_troca: item.dataLimiteTroca || null,
          obs: item.notes || null,
          etapa_maes: item.etapaMaes || null,
          classificacao: item.classificacao || null,
          emocao: item.emocao || null,
          tags: item.tags || [],
        })
        .eq("id", item.id);

      if (error) throw error;
      return item;
    },
    onMutate: async (updatedItem) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['enxoval-items'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['enxoval-items', user?.id, config?.id]);

      // Optimistically update to the new value
      queryClient.setQueryData(['enxoval-items', user?.id, config?.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((item: EnxovalItem) =>
              item.id === updatedItem.id ? processItem({
                ...updatedItem,
                prioridade: calculatePriority(updatedItem.necessity),
                data: updatedItem.date,
                categoria: updatedItem.category,
                necessidade: updatedItem.necessity,
                tamanho: updatedItem.size,
                qtd_planejada: updatedItem.plannedQty,
                preco_planejado: updatedItem.plannedPrice,
                qtd_comprada: updatedItem.boughtQty,
                preco_unit_pago: updatedItem.unitPricePaid,
                loja: updatedItem.store,
                obs: updatedItem.notes,
                origem: updatedItem.origin,
                data_limite_troca: updatedItem.dataLimiteTroca,
                etapa_maes: updatedItem.etapaMaes,
              }) : item
            )
          }))
        };
      });

      return { previousData };
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['enxoval-items', user?.id, config?.id], context.previousData);
      }
      logger.error("Erro ao atualizar item", error, { context: 'useEnxovalItems' });
      toast.error("Não foi possível atualizar o item.");
    },
    onSuccess: () => {
      toast.success("Item atualizado com sucesso!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['enxoval-items'] });
    }
  });

  // Mutation para deletar com optimistic update
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("itens_enxoval").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['enxoval-items'] });

      const previousData = queryClient.getQueryData(['enxoval-items', user?.id, config?.id]);

      // Optimistically remove the item
      queryClient.setQueryData(['enxoval-items', user?.id, config?.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.filter((item: EnxovalItem) => item.id !== deletedId)
          }))
        };
      });

      return { previousData };
    },
    onError: (error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['enxoval-items', user?.id, config?.id], context.previousData);
      }
      logger.error("Erro ao remover item", error, { context: 'useEnxovalItems' });
      toast.error("Não foi possível remover o item.");
    },
    onSuccess: () => {
      toast.success("Item removido com sucesso!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['enxoval-items'] });
    }
  });

  // Load more function
  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      fetchNextPage();
    }
  }, [hasMore, loadingMore, fetchNextPage]);

  return { 
    /** Lista de itens processados */
    items, 
    /** Carregamento inicial */
    loading, 
    /** Carregando mais itens */
    loadingMore,
    /** Se há mais itens para carregar */
    hasMore: hasMore ?? false,
    /** Função para carregar próxima página */
    loadMore,
    /** Adicionar novo item */
    addItem: addItemMutation.mutateAsync, 
    /** Atualizar item existente */
    updateItem: updateItemMutation.mutateAsync, 
    /** Remover item */
    deleteItem: deleteItemMutation.mutateAsync, 
    /** Recarregar lista do início */
    reloadItems: () => refetch()
  };
};
