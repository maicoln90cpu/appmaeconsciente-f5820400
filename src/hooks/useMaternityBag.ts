/**
 * @fileoverview Hook para gerenciamento da mala da maternidade
 * @module hooks/useMaternityBag
 * 
 * Provê operações CRUD com React Query para categorias e itens
 */

import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import { QueryKeys, QueryCacheConfig } from "@/lib/query-config";
import { toast } from "sonner";

export interface MaternityBagCategory {
  id: string;
  user_id: string;
  name: string;
  icon?: string;
  delivery_type_filter?: "cesarean" | "normal" | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MaternityBagItem {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  quantity: number;
  checked: boolean;
  notes?: string;
  cesarean_only: boolean;
  normal_only: boolean;
  created_at: string;
  updated_at: string;
}

// Dados padrão para inicialização
const DEFAULT_CATEGORIES = [
  { name: "Mãe", icon: "👩", display_order: 0 },
  { name: "Bebê", icon: "👶", display_order: 1 },
  { name: "Acompanhante", icon: "👨", display_order: 2 },
];

const DEFAULT_ITEMS: Record<string, string[]> = {
  "Mãe": [
    "Camisola ou pijama",
    "Roupão",
    "Chinelo antiderrapante",
    "Sutiã de amamentação",
    "Absorventes pós-parto",
    "Calcinha pós-parto",
  ],
  "Bebê": [
    "Body manga curta",
    "Body manga longa",
    "Mijão ou calça",
    "Macacão",
    "Meia",
    "Toalha",
  ],
  "Acompanhante": [
    "Documento de identidade",
    "Roupa confortável",
    "Chinelo",
    "Carregador de celular",
  ],
};

export const useMaternityBag = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query para categorias
  const categoriesQuery = useQuery({
    queryKey: user ? QueryKeys.maternityBagCategories(user.id) : ['maternity-bag-categories'],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("maternity_bag_categories")
        .select("id, user_id, name, icon, delivery_type_filter, display_order, created_at, updated_at")
        .eq("user_id", user.id)
        .order("display_order");

      if (error) throw error;
      return (data || []) as MaternityBagCategory[];
    },
    enabled: !!user,
    ...QueryCacheConfig.user,
  });

  // Query para itens
  const itemsQuery = useQuery({
    queryKey: user ? QueryKeys.maternityBagItems(user.id) : ['maternity-bag-items'],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("maternity_bag_items")
        .select("id, user_id, category_id, name, quantity, checked, notes, cesarean_only, normal_only, created_at, updated_at")
        .eq("user_id", user.id);

      if (error) throw error;
      return (data || []) as MaternityBagItem[];
    },
    enabled: !!user,
    ...QueryCacheConfig.user,
  });

  const categories = categoriesQuery.data ?? [];
  const items = itemsQuery.data ?? [];
  const loading = categoriesQuery.isLoading || itemsQuery.isLoading;

  // Inicializar mala padrão
  const initializeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");

      const categoryMap: Record<string, string> = {};

      for (const cat of DEFAULT_CATEGORIES) {
        const { data, error } = await supabase
          .from("maternity_bag_categories")
          .insert({
            user_id: user.id,
            name: cat.name,
            icon: cat.icon,
            display_order: cat.display_order,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) categoryMap[cat.name] = data.id;
      }

      // Inserir itens padrão
      for (const [categoryName, itemNames] of Object.entries(DEFAULT_ITEMS)) {
        for (const itemName of itemNames) {
          await supabase.from("maternity_bag_items").insert({
            user_id: user.id,
            category_id: categoryMap[categoryName],
            name: itemName,
            quantity: 1,
            checked: false,
          });
        }
      }

      return categoryMap;
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: QueryKeys.maternityBagCategories(user.id) });
        queryClient.invalidateQueries({ queryKey: QueryKeys.maternityBagItems(user.id) });
      }
    },
    onError: (error) => {
      logger.error("Erro ao inicializar mala", error, { context: "useMaternityBag" });
    }
  });

  // Auto-inicializar se não houver categorias
  const shouldInitialize = !loading && categories.length === 0 && user;
  if (shouldInitialize && !initializeMutation.isPending) {
    initializeMutation.mutate();
  }

  // Mutation para adicionar item
  const addItemMutation = useMutation({
    mutationFn: async ({
      categoryId,
      name,
      quantity = 1,
      cesareanOnly = false,
      normalOnly = false,
    }: {
      categoryId: string;
      name: string;
      quantity?: number;
      cesareanOnly?: boolean;
      normalOnly?: boolean;
    }) => {
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("maternity_bag_items")
        .insert({
          user_id: user.id,
          category_id: categoryId,
          name,
          quantity,
          checked: false,
          cesarean_only: cesareanOnly,
          normal_only: normalOnly,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: QueryKeys.maternityBagItems(user.id) });
      }
      toast("Item adicionado!", { description: `${data.name} foi adicionado à sua mala.` });
    },
    onError: () => {
      toast.error("Erro ao adicionar item", { description: "Não foi possível adicionar o item." });
    }
  });

  // Mutation para atualizar item
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: Partial<MaternityBagItem> }) => {
      const { data, error } = await supabase
        .from("maternity_bag_items")
        .update(updates)
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ itemId, updates }) => {
      if (!user) return;
      
      await queryClient.cancelQueries({ queryKey: QueryKeys.maternityBagItems(user.id) });
      
      const previousItems = queryClient.getQueryData<MaternityBagItem[]>(QueryKeys.maternityBagItems(user.id));
      
      queryClient.setQueryData<MaternityBagItem[]>(
        QueryKeys.maternityBagItems(user.id),
        (old) => old?.map(item => item.id === itemId ? { ...item, ...updates } : item) ?? []
      );
      
      return { previousItems };
    },
    onError: (_, __, context) => {
      if (context?.previousItems && user) {
        queryClient.setQueryData(QueryKeys.maternityBagItems(user.id), context.previousItems);
      }
      toast.error("Erro ao atualizar item", { description: "Não foi possível atualizar o item." });
    },
    onSettled: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: QueryKeys.maternityBagItems(user.id) });
      }
    }
  });

  // Mutation para deletar item
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("maternity_bag_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      return itemId;
    },
    onMutate: async (itemId) => {
      if (!user) return;
      
      await queryClient.cancelQueries({ queryKey: QueryKeys.maternityBagItems(user.id) });
      
      const previousItems = queryClient.getQueryData<MaternityBagItem[]>(QueryKeys.maternityBagItems(user.id));
      
      queryClient.setQueryData<MaternityBagItem[]>(
        QueryKeys.maternityBagItems(user.id),
        (old) => old?.filter(item => item.id !== itemId) ?? []
      );
      
      return { previousItems };
    },
    onSuccess: () => {
      toast("Item removido", { description: "O item foi removido da sua mala." });
    },
    onError: (_, __, context) => {
      if (context?.previousItems && user) {
        queryClient.setQueryData(QueryKeys.maternityBagItems(user.id), context.previousItems);
      }
      toast.error("Erro ao remover item", { description: "Não foi possível remover o item." });
    },
    onSettled: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: QueryKeys.maternityBagItems(user.id) });
      }
    }
  });

  // Helper functions
  const addItem = (
    categoryId: string,
    name: string,
    quantity: number = 1,
    cesareanOnly: boolean = false,
    normalOnly: boolean = false
  ) => addItemMutation.mutate({ categoryId, name, quantity, cesareanOnly, normalOnly });

  const updateItem = (itemId: string, updates: Partial<MaternityBagItem>) => 
    updateItemMutation.mutate({ itemId, updates });

  const deleteItem = (itemId: string) => deleteItemMutation.mutate(itemId);

  const toggleItemChecked = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      updateItem(itemId, { checked: !item.checked });
    }
  };

  const getItemsByCategory = useCallback((categoryId: string) => {
    return items.filter((item) => item.category_id === categoryId);
  }, [items]);

  const getProgress = useMemo(() => {
    if (items.length === 0) return 0;
    const checkedCount = items.filter((item) => item.checked).length;
    return Math.round((checkedCount / items.length) * 100);
  }, [items]);

  const reloadMaternityBag = useCallback(() => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: QueryKeys.maternityBagCategories(user.id) });
      queryClient.invalidateQueries({ queryKey: QueryKeys.maternityBagItems(user.id) });
    }
  }, [user, queryClient]);

  return {
    categories,
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    toggleItemChecked,
    getItemsByCategory,
    getProgress: () => getProgress,
    reloadMaternityBag,
  };
};
