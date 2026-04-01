import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface Product {
  id: string;
  title: string;
  slug: string;
}

interface Bundle {
  id: string;
  main_product_id: string;
  bonus_product_id: string;
  bonus_duration_days: number | null;
  is_active: boolean;
  main_product?: { title: string };
  bonus_product?: { title: string };
}

interface BundleFormData {
  main_product_id: string;
  bonus_product_id: string;
  bonus_duration_days: string;
  is_active: boolean;
}

export function useBundles() {
  const queryClient = useQueryClient();

  const { data: bundles = [], isLoading: loadingBundles } = useQuery({
    queryKey: ["admin", "bundles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_bundles" as any)
        .select(`*, main_product:products!main_product_id(title), bonus_product:products!bonus_product_id(title)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Bundle[];
    },
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["admin", "products-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, slug")
        .eq("is_active", true)
        .order("title");
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ formData, editingId }: { formData: BundleFormData; editingId?: string }) => {
      const bundleData = {
        main_product_id: formData.main_product_id,
        bonus_product_id: formData.bonus_product_id,
        bonus_duration_days: formData.bonus_duration_days ? parseInt(formData.bonus_duration_days) : null,
        is_active: formData.is_active,
      };

      if (editingId) {
        const { error } = await (supabase.from("product_bundles" as any).update(bundleData).eq("id", editingId) as any);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("product_bundles" as any).insert(bundleData) as any);
        if (error) {
          if (error.code === "23505") throw new Error("DUPLICATE");
          throw error;
        }
      }
    },
    onSuccess: (_, { editingId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bundles"] });
      toast.success(editingId ? "Bundle atualizado com sucesso!" : "Bundle criado com sucesso!");
    },
    onError: (error: Error) => {
      if (error.message === "DUPLICATE") {
        toast.error("Este bundle já existe");
      } else {
        toast.error("Erro ao salvar bundle");
        logger.error("Bundle save error", error, { context: "useBundles" });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("product_bundles" as any).delete().eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bundles"] });
      toast.success("Bundle excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir bundle");
      logger.error("Bundle delete error", error, { context: "useBundles" });
    },
  });

  return {
    bundles,
    products,
    isLoading: loadingBundles || loadingProducts,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    remove: deleteMutation.mutate,
    isRemoving: deleteMutation.isPending,
  };
}

export type { Bundle, Product, BundleFormData };
