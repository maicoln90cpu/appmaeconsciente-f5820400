import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface JaundiceLog {
  id: string;
  user_id: string;
  baby_profile_id: string | null;
  log_date: string;
  kramer_zone: number;
  skin_color: string | null;
  sclera_color: string | null;
  feeding_well: boolean;
  alert_signs: string[];
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useJaundiceLogs = (babyProfileId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["jaundice-logs", babyProfileId];

  const { data: logs = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("jaundice_logs")
        .select("*")
        .order("log_date", { ascending: false });

      if (babyProfileId) {
        query = query.eq("baby_profile_id", babyProfileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as JaundiceLog[];
    },
    enabled: !!user,
  });

  const addLog = useMutation({
    mutationFn: async (log: Omit<JaundiceLog, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("jaundice_logs")
        .insert({ ...log, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Registro de icterícia salvo!");
    },
    onError: () => toast.error("Erro ao salvar registro"),
  });

  const deleteLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("jaundice_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Registro removido");
    },
    onError: () => toast.error("Erro ao remover registro"),
  });

  // Check if latest log has danger signs
  const latestLog = logs[0];
  const hasDangerSigns = latestLog && (
    latestLog.kramer_zone >= 4 ||
    !latestLog.feeding_well ||
    (latestLog.alert_signs && latestLog.alert_signs.length > 0)
  );

  return { logs, isLoading, addLog, deleteLog, latestLog, hasDangerSigns };
};
