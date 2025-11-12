import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PartnerAccess {
  id: string;
  user_id: string;
  partner_email: string;
  access_token: string;
  is_active: boolean;
  granted_at: string;
  expires_at: string | null;
  last_accessed: string | null;
  created_at: string;
  updated_at: string;
}

export const usePartnerAccess = () => {
  const queryClient = useQueryClient();

  const { data: partnerAccesses, isLoading } = useQuery({
    queryKey: ['partner-access'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // @ts-ignore - types will be updated after migration
      const { data, error } = await supabase
        // @ts-ignore
        .from('partner_access')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // @ts-ignore
      return data as PartnerAccess[];
    },
  });

  const grantAccess = useMutation({
    mutationFn: async ({ 
      partner_email, 
      expires_in_days 
    }: { 
      partner_email: string; 
      expires_in_days?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const expires_at = expires_in_days 
        ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // @ts-ignore
      const { data, error } = await supabase
        // @ts-ignore
        .from('partner_access')
        .insert({ 
          user_id: user.id,
          partner_email,
          expires_at
        })
        .select()
        .single();

      if (error) throw error;
      // @ts-ignore
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-access'] });
      toast.success('Acesso concedido ao parceiro/cuidador 💕');
    },
    onError: (error: any) => {
      toast.error('Erro ao conceder acesso: ' + error.message);
    },
  });

  const revokeAccess = useMutation({
    mutationFn: async (accessId: string) => {
      // @ts-ignore
      const { error } = await supabase
        // @ts-ignore
        .from('partner_access')
        .update({ is_active: false })
        .eq('id', accessId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-access'] });
      toast.success('Acesso revogado');
    },
    onError: () => {
      toast.error('Erro ao revogar acesso');
    },
  });

  const getShareLink = (token: string) => {
    return `${window.location.origin}/recuperacao-parceiro/${token}`;
  };

  return {
    partnerAccesses,
    isLoading,
    grantAccess: grantAccess.mutate,
    revokeAccess: revokeAccess.mutate,
    getShareLink,
  };
};
