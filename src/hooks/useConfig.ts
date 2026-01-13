import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Config } from "@/types/enxoval";
import { useToast } from "@/hooks/useToast";

export const useConfig = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadConfig = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: configData, error: configError } = await supabase
        .from("config")
        .select("id, user_id, orcamento_total, dias_alerta_troca, created_at, updated_at")
        .eq("user_id", user.id)
        .single();

      if (configError && configError.code !== "PGRST116") {
        throw configError;
      }

      if (!configData) {
        // Criar config padrão
        const { data: newConfig, error: insertError } = await supabase
          .from("config")
          .insert({
            user_id: user.id,
            orcamento_total: 5000,
            dias_alerta_troca: 7,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Inserir limites RN padrão com os novos campos
        const defaultLimits = [
          { config_id: newConfig?.id, item: "Bodies (curta+longa)", limite: 6, quando_aumentar: "+2 se clima frio", observacoes: "Priorize tamanho P no restante do enxoval." },
          { config_id: newConfig?.id, item: "Mijões/Calças", limite: 4, quando_aumentar: "+2 se clima frio", observacoes: "Elástico suave; prefira com pé reversível." },
          { config_id: newConfig?.id, item: "Macacões", limite: 3, quando_aumentar: "+1 se clima frio", observacoes: "Abertura frontal facilita trocas." },
          { config_id: newConfig?.id, item: "Meias", limite: 6, quando_aumentar: "+2 no frio", observacoes: 'Dispensa "sapato RN".' },
          { config_id: newConfig?.id, item: "Gorro", limite: 1, quando_aumentar: "1 se frio", observacoes: "Use só em ambientes frios." },
          { config_id: newConfig?.id, item: "Luvas", limite: 0, quando_aumentar: "1 par se quiser", observacoes: "Melhor manter unhas aparadas (mais confortável)." },
          { config_id: newConfig?.id, item: "Casaquinho/Coletes", limite: 1, quando_aumentar: "1 no frio", observacoes: "Evite peças volumosas." },
          { config_id: newConfig?.id, item: "Saída de maternidade", limite: 1, quando_aumentar: "—", observacoes: "Opte por conjunto reutilizável." },
          { config_id: newConfig?.id, item: "Bodies RN manga curta", limite: 3, quando_aumentar: "+1 no calor", observacoes: "Pode combinar com manga longa para 6 no total." },
          { config_id: newConfig?.id, item: "Bodies RN manga longa", limite: 3, quando_aumentar: "+1 no frio", observacoes: "—" },
          { config_id: newConfig?.id, item: "Shorts/culotes leves", limite: 2, quando_aumentar: "+2 no calor", observacoes: "Só se for verão intenso." },
          { config_id: newConfig?.id, item: "Sapatos RN", limite: 0, quando_aumentar: "—", observacoes: "Dispensável; use meias." },
        ];

        await supabase.from("limites_rn").insert(defaultLimits);

        const { data: limits } = await supabase
          .from("limites_rn")
          .select("id, config_id, item, limite, quando_aumentar, observacoes")
          .eq("config_id", newConfig?.id);

        setConfig({
          id: newConfig?.id,
          orcamento_total: newConfig?.orcamento_total,
          dias_alerta_troca: newConfig?.dias_alerta_troca,
          limites_rn: (limits || []).map(l => ({
            id: l.id,
            item: l.item,
            limite: l.limite,
            quando_aumentar: l.quando_aumentar,
            observacoes: l.observacoes,
          })),
        });
      } else {
        const { data: limits } = await supabase
          .from("limites_rn")
          .select("id, config_id, item, limite, quando_aumentar, observacoes")
          .eq("config_id", configData.id);

        setConfig({
          id: configData.id,
          orcamento_total: configData.orcamento_total,
          dias_alerta_troca: configData.dias_alerta_troca,
          limites_rn: (limits || []).map(l => ({
            id: l.id,
            item: l.item,
            limite: l.limite,
            quando_aumentar: l.quando_aumentar,
            observacoes: l.observacoes,
          })),
        });
      }
    } catch (error: any) {
      console.error("Erro ao carregar configurações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateConfig = async (updates: Partial<Config>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !config?.id) return;

      const { error } = await supabase
        .from("config")
        .update({
          orcamento_total: updates.orcamento_total,
          dias_alerta_troca: updates.dias_alerta_troca,
        })
        .eq("id", config.id);

      if (error) throw error;

      if (updates.limites_rn) {
        // Atualizar limites
        await supabase.from("limites_rn").delete().eq("config_id", config.id);
        
        const limitsToInsert = updates.limites_rn.map((limit) => ({
          config_id: config.id,
          item: limit.item,
          limite: limit.limite,
          quando_aumentar: limit.quando_aumentar,
          observacoes: limit.observacoes,
        }));

        await supabase.from("limites_rn").insert(limitsToInsert);
      }

      await loadConfig();
      
      toast({
        title: "Sucesso",
        description: "Configurações atualizadas com sucesso!",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar configurações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as configurações.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return { config, loading, updateConfig, reloadConfig: loadConfig };
};
