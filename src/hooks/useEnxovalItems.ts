import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EnxovalItem, Config } from "@/types/enxoval";
import { useToast } from "@/hooks/useToast";
import {
  calculatePriority,
  calculateSubtotalPlanned,
  calculateSubtotalPaid,
  calculateSavings,
  calculateSavingsPercent,
} from "@/lib/calculations";
import { useAuth } from "@/contexts/AuthContext";
import logger from "@/lib/logger";

const ITEMS_PER_PAGE = 50;

export const useEnxovalItems = (config: Config | null) => {
  const [items, setItems] = useState<EnxovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const processItem = useCallback((dbItem: any, config: Config | null): EnxovalItem => {
    const subtotalPlanned = calculateSubtotalPlanned(dbItem.qtd_planejada, dbItem.preco_planejado);
    const subtotalPaid = calculateSubtotalPaid(
      dbItem.qtd_comprada,
      dbItem.preco_unit_pago,
      dbItem.frete,
      dbItem.desconto
    );
    const savings = calculateSavings(subtotalPlanned, subtotalPaid);
    const savingsPercent = calculateSavingsPercent(subtotalPlanned, subtotalPaid);

    // Verificar excesso RN
    const limite = config?.limites_rn.find((l) => l.item.toLowerCase() === dbItem.item.toLowerCase());
    const excessoRN = dbItem.tamanho === "RN" && limite && dbItem.qtd_comprada > limite.limite;

    // Verificar supérfluo comprado
    const superfluoComprado = dbItem.necessidade === "Não" && dbItem.status === "Comprado";

    // Verificar alerta de troca
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
  }, []);

  const loadItems = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (pageNum > 0) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const from = pageNum * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from("itens_enxoval")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Check if there are more items
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE);

      const processedItems = (data || []).map((item) => processItem(item, config));
      
      if (append) {
        setItems(prev => [...prev, ...processedItems]);
      } else {
        setItems(processedItems);
      }
      setPage(pageNum);
    } catch (error: any) {
      logger.error("Erro ao carregar itens:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os itens.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, config, processItem, toast]);

  // Load more items (infinite scroll)
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadItems(page + 1, true);
    }
  }, [loadingMore, hasMore, page, loadItems]);

  const addItem = useCallback(async (item: Omit<EnxovalItem, "id">) => {
    if (!user) return;

    try {
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

      // Atualização otimista - adicionar ao início da lista
      if (newItem) {
        const processedItem = processItem(newItem, config);
        setItems(prev => [processedItem, ...prev]);
      }
      
      toast({
        title: "Sucesso",
        description: "Item adicionado com sucesso!",
      });
    } catch (error: any) {
      logger.error("Erro ao adicionar item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item.",
        variant: "destructive",
      });
    }
  }, [user, config, processItem, toast]);

  const updateItem = useCallback(async (item: EnxovalItem) => {
    try {
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

      // Atualização otimista
      const updatedItem = processItem({
        ...item,
        prioridade: priority,
        data: item.date,
        categoria: item.category,
        necessidade: item.necessity,
        tamanho: item.size,
        qtd_planejada: item.plannedQty,
        preco_planejado: item.plannedPrice,
        qtd_comprada: item.boughtQty,
        preco_unit_pago: item.unitPricePaid,
        loja: item.store,
        obs: item.notes,
        origem: item.origin,
        data_limite_troca: item.dataLimiteTroca,
        etapa_maes: item.etapaMaes,
      }, config);
      
      setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
      
      toast({
        title: "Sucesso",
        description: "Item atualizado com sucesso!",
      });
    } catch (error: any) {
      logger.error("Erro ao atualizar item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o item.",
        variant: "destructive",
      });
    }
  }, [config, processItem, toast]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      // Atualização otimista
      setItems(prev => prev.filter(i => i.id !== id));

      const { error } = await supabase.from("itens_enxoval").delete().eq("id", id);

      if (error) {
        // Reverter se falhar
        await loadItems(0, false);
        throw error;
      }
      
      toast({
        title: "Sucesso",
        description: "Item removido com sucesso!",
      });
    } catch (error: any) {
      logger.error("Erro ao remover item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o item.",
        variant: "destructive",
      });
    }
  }, [loadItems, toast]);

  useEffect(() => {
    if (config) {
      loadItems(0, false);
    }
  }, [config]);

  return { 
    items, 
    loading, 
    loadingMore,
    hasMore,
    loadMore,
    addItem, 
    updateItem, 
    deleteItem, 
    reloadItems: () => loadItems(0, false) 
  };
};
