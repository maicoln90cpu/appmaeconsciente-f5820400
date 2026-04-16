import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface PostReport {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  reason: string | null;
  created_at: string;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam ou publicidade' },
  { value: 'inappropriate', label: 'Conteúdo inapropriado' },
  { value: 'harassment', label: 'Assédio ou bullying' },
  { value: 'misinformation', label: 'Desinformação médica' },
  { value: 'other', label: 'Outro motivo' },
] as const;

export const useModeration = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Buscar blocked users
  const { data: blockedUsers = [], isLoading: loadingBlocked } = useQuery({
    queryKey: ['blocked-users', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('blocked_users')
        .select('id, blocker_id, blocked_id, reason, created_at')
        .eq('blocker_id', user.id);

      if (error) throw error;
      return data as BlockedUser[];
    },
    enabled: !!user,
  });

  // Buscar my reports
  const { data: myReports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['my-reports', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('post_reports')
        .select('id, post_id, reporter_id, reason, description, status, created_at')
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PostReport[];
    },
    enabled: !!user,
  });

  // Report a post
  const reportPost = useMutation({
    mutationFn: async ({
      postId,
      reason,
      description,
    }: {
      postId: string;
      reason: string;
      description?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('post_reports').insert({
        post_id: postId,
        reporter_id: user.id,
        reason,
        description,
      });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Você já denunciou esta postagem');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      toast.success('Denúncia enviada. Obrigada por nos ajudar!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Block a user
  const blockUser = useMutation({
    mutationFn: async ({ blockedId, reason }: { blockedId: string; reason?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('blocked_users').insert({
        blocker_id: user.id,
        blocked_id: blockedId,
        reason,
      });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Usuária já está bloqueada');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Usuária bloqueada');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Unblock a user
  const unblockUser = useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Usuária desbloqueada');
    },
  });

  // Verificar if user is blocked
  const isUserBlocked = (userId: string) => {
    return blockedUsers.some(b => b.blocked_id === userId);
  };

  // Obter blocked user IDs for filtering
  const blockedUserIds = blockedUsers.map(b => b.blocked_id);

  return {
    blockedUsers,
    blockedUserIds,
    myReports,
    isLoading: loadingBlocked || loadingReports,
    reportPost: reportPost.mutate,
    blockUser: blockUser.mutate,
    unblockUser: unblockUser.mutate,
    isUserBlocked,
    isReporting: reportPost.isPending,
    isBlocking: blockUser.isPending,
    REPORT_REASONS,
  };
};
