import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";

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

export const useMaternityBag = () => {
  const [categories, setCategories] = useState<MaternityBagCategory[]>([]);
  const [items, setItems] = useState<MaternityBagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Initialize default maternity bag
  const initializeDefaultMaternityBag = useCallback(async (userId: string) => {
    try {
      const defaultCategories = [
        { name: "Mãe", icon: "👩", display_order: 0 },
        { name: "Bebê", icon: "👶", display_order: 1 },
        { name: "Acompanhante", icon: "👨", display_order: 2 },
      ];

      const categoryMap: Record<string, string> = {};

      for (const cat of defaultCategories) {
        const { data, error } = await supabase
          .from("maternity_bag_categories")
          .insert({
            user_id: userId,
            name: cat.name,
            icon: cat.icon,
            display_order: cat.display_order,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) categoryMap[cat.name] = data.id;
      }

      // Default items
      const defaultMotherItems = [
        "Camisola ou pijama",
        "Roupão",
        "Chinelo antiderrapante",
        "Sutiã de amamentação",
        "Absorventes pós-parto",
        "Calcinha pós-parto",
      ];

      const defaultBabyItems = [
        "Body manga curta",
        "Body manga longa",
        "Mijão ou calça",
        "Macacão",
        "Meia",
        "Toalha",
      ];

      const defaultCompanionItems = [
        "Documento de identidade",
        "Roupa confortável",
        "Chinelo",
        "Carregador de celular",
      ];

      for (const itemName of defaultMotherItems) {
        await supabase.from("maternity_bag_items").insert({
          user_id: userId,
          category_id: categoryMap["Mãe"],
          name: itemName,
          quantity: 1,
          checked: false,
        });
      }

      for (const itemName of defaultBabyItems) {
        await supabase.from("maternity_bag_items").insert({
          user_id: userId,
          category_id: categoryMap["Bebê"],
          name: itemName,
          quantity: 1,
          checked: false,
        });
      }

      for (const itemName of defaultCompanionItems) {
        await supabase.from("maternity_bag_items").insert({
          user_id: userId,
          category_id: categoryMap["Acompanhante"],
          name: itemName,
          quantity: 1,
          checked: false,
        });
      }
    } catch (error) {
      logger.error("Erro ao inicializar mala", error, { context: "useMaternityBag" });
    }
  }, []);

  // Load categories and items from database
  const loadMaternityBag = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("maternity_bag_categories")
        .select("id, user_id, name, icon, delivery_type_filter, display_order, created_at, updated_at")
        .order("display_order");

      if (categoriesError) throw categoriesError;

      // Load items
      const { data: itemsData, error: itemsError } = await supabase
        .from("maternity_bag_items")
        .select("id, user_id, category_id, name, quantity, checked, notes, cesarean_only, normal_only, created_at, updated_at");

      if (itemsError) throw itemsError;

      setCategories((categoriesData || []) as MaternityBagCategory[]);
      setItems((itemsData || []) as MaternityBagItem[]);

      // If no categories exist, initialize defaults
      if (!categoriesData || categoriesData.length === 0) {
        await initializeDefaultMaternityBag(user.id);
        // Reload after initialization
        const { data: newCategoriesData } = await supabase
          .from("maternity_bag_categories")
          .select("id, user_id, name, icon, delivery_type_filter, display_order, created_at, updated_at")
          .order("display_order");
        const { data: newItemsData } = await supabase
          .from("maternity_bag_items")
          .select("id, user_id, category_id, name, quantity, checked, notes, cesarean_only, normal_only, created_at, updated_at");
        
        setCategories((newCategoriesData || []) as MaternityBagCategory[]);
        setItems((newItemsData || []) as MaternityBagItem[]);
      }
    } catch (error) {
      logger.error("Erro ao carregar mala da maternidade", error, { context: "useMaternityBag" });
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar sua mala da maternidade.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, initializeDefaultMaternityBag]);

  // Add item
  const addItem = async (
    categoryId: string,
    name: string,
    quantity: number = 1,
    cesareanOnly: boolean = false,
    normalOnly: boolean = false
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

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

      if (data) {
        setItems([...items, data]);
        toast({
          title: "Item adicionado!",
          description: `${name} foi adicionado à sua mala.`,
        });
      }
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      toast({
        title: "Erro ao adicionar item",
        description: "Não foi possível adicionar o item.",
        variant: "destructive",
      });
    }
  };

  // Update item
  const updateItem = async (itemId: string, updates: Partial<MaternityBagItem>) => {
    try {
      const { data, error } = await supabase
        .from("maternity_bag_items")
        .update(updates)
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setItems(items.map((item) => (item.id === itemId ? data : item)));
      }
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      toast({
        title: "Erro ao atualizar item",
        description: "Não foi possível atualizar o item.",
        variant: "destructive",
      });
    }
  };

  // Delete item
  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("maternity_bag_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setItems(items.filter((item) => item.id !== itemId));
      toast({
        title: "Item removido",
        description: "O item foi removido da sua mala.",
      });
    } catch (error) {
      console.error("Erro ao deletar item:", error);
      toast({
        title: "Erro ao remover item",
        description: "Não foi possível remover o item.",
        variant: "destructive",
      });
    }
  };

  // Toggle item checked status
  const toggleItemChecked = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    await updateItem(itemId, { checked: !item.checked });
  };

  // Get items by category
  const getItemsByCategory = (categoryId: string) => {
    return items.filter((item) => item.category_id === categoryId);
  };

  // Get progress percentage
  const getProgress = () => {
    if (items.length === 0) return 0;
    const checkedCount = items.filter((item) => item.checked).length;
    return Math.round((checkedCount / items.length) * 100);
  };

  useEffect(() => {
    loadMaternityBag();
  }, [loadMaternityBag]);

  return {
    categories,
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    toggleItemChecked,
    getItemsByCategory,
    getProgress,
    reloadMaternityBag: loadMaternityBag,
  };
};
