import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EnxovalItem, Config } from "@/types/enxoval";
import { useToast } from "@/hooks/use-toast";
import {
  calculatePriority,
  calculateSubtotalPlanned,
  calculateSubtotalPaid,
  calculateSavings,
  calculateSavingsPercent,
} from "@/lib/calculations";

export const useEnxovalItems = (config: Config | null) => {
  const [items, setItems] = useState<EnxovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const processItem = (dbItem: any, config: Config | null): EnxovalItem => {
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
  };

  const loadItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // @ts-ignore
      const { data, error } = await supabase
        // @ts-ignore
        .from("itens_enxoval")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const processedItems = (data || []).map((item) => processItem(item, config));
      setItems(processedItems);
    } catch (error: any) {
      console.error("Erro ao carregar itens:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os itens.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item: Omit<EnxovalItem, "id">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const priority = calculatePriority(item.necessity);

      // @ts-ignore
      const { error } = await supabase
        // @ts-ignore
        .from("itens_enxoval")
        // @ts-ignore
        .insert({
        // @ts-ignore
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
      });

      if (error) throw error;

      await loadItems();
      
      toast({
        title: "Sucesso",
        description: "Item adicionado com sucesso!",
      });
    } catch (error: any) {
      console.error("Erro ao adicionar item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item.",
        variant: "destructive",
      });
    }
  };

  const updateItem = async (item: EnxovalItem) => {
    try {
      const priority = calculatePriority(item.necessity);

      // @ts-ignore
      const { error } = await supabase
        // @ts-ignore
        .from("itens_enxoval")
        // @ts-ignore
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

      await loadItems();
      
      toast({
        title: "Sucesso",
        description: "Item atualizado com sucesso!",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o item.",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (id: string) => {
    try {
      // @ts-ignore
      const { error } = await supabase.from("itens_enxoval").delete().eq("id", id);

      if (error) throw error;

      await loadItems();
      
      toast({
        title: "Sucesso",
        description: "Item removido com sucesso!",
      });
    } catch (error: any) {
      console.error("Erro ao remover item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o item.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (config) {
      loadItems();
    }
  }, [config]);

  return { items, loading, addItem, updateItem, deleteItem, reloadItems: loadItems };
};
