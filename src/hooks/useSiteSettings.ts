import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QueryKeys, QueryCacheConfig } from "@/lib/query-config";
import { toast } from "sonner";

export interface SiteSettings {
  id: string;
  gtm_id: string | null;
  support_whatsapp: string | null;
  custom_domain: string | null;
  support_email: string | null;
  system_timezone: string | null;
  ai_insights_enabled: boolean | null;
  badges_enabled: boolean | null;
  created_at: string;
  updated_at: string;
}

export const useSiteSettings = () => {
  const queryClient = useQueryClient();

  const queryKey = QueryKeys.siteSettings();

  const { data: settings, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("id, gtm_id, support_whatsapp, custom_domain, support_email, system_timezone, ai_insights_enabled, badges_enabled, created_at, updated_at")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from("site_settings")
          .insert({ gtm_id: 'GTM-K9TPFGCJ' })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newData as unknown as SiteSettings;
      }
      
      return data as unknown as SiteSettings;
    },
    staleTime: QueryCacheConfig.reference.staleTime,
    gcTime: QueryCacheConfig.reference.gcTime,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<SiteSettings, "id" | "created_at" | "updated_at">>) => {
      if (!settings?.id) {
        throw new Error("Settings not loaded");
      }

      const { data, error } = await supabase
        .from("site_settings")
        .update(updates)
        .eq("id", settings.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast("Configurações atualizadas", { description: "As configurações foram salvas com sucesso." });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar", { description: error.message });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: (gtmId: string) => updateSettingsMutation.mutate({ gtm_id: gtmId }),
    updateAllSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
  };
};
