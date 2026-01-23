import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { QueryKeys, QueryCacheConfig } from "@/lib/query-config";

export interface SiteSettings {
  id: string;
  gtm_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useSiteSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = QueryKeys.siteSettings();

  const { data: settings, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("id, gtm_id, created_at, updated_at")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      // If no settings exist, create default
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from("site_settings")
          .insert({ gtm_id: 'GTM-K9TPFGCJ' })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newData as SiteSettings;
      }
      
      return data as SiteSettings;
    },
    staleTime: QueryCacheConfig.reference.staleTime,
    gcTime: QueryCacheConfig.reference.gcTime,
  });

  const updateSettings = useMutation({
    mutationFn: async (gtmId: string) => {
      if (!settings?.id) {
        throw new Error("Settings not loaded");
      }

      const { data, error } = await supabase
        .from("site_settings")
        .update({ gtm_id: gtmId })
        .eq("id", settings.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Configurações atualizadas",
        description: "O GTM ID foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
};
