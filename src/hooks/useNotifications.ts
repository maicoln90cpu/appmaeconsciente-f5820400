import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { useAuth } from "@/contexts/AuthContext";
import { QueryKeys, QueryCacheConfig } from "@/lib/query-config";

export interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read?: boolean;
  read_at?: string;
}

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const queryKey = QueryKeys.notifications(user?.id ?? '');

  // Query principal para notificações
  const { data: notifications = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async (): Promise<Notification[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_notifications')
        .select(`
          id,
          is_read,
          read_at,
          notifications (
            id,
            title,
            message,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error loading notifications', error, { context: 'useNotifications' });
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.notifications?.id ?? item.id,
        title: item.notifications?.title ?? '',
        message: item.notifications?.message ?? '',
        created_at: item.notifications?.created_at ?? '',
        is_read: item.is_read,
        read_at: item.read_at
      }));
    },
    enabled: !!user,
    staleTime: QueryCacheConfig.dynamic.staleTime,
    gcTime: QueryCacheConfig.dynamic.gcTime,
  });

  // Contagem de não lidas (memoizada)
  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.is_read).length, 
    [notifications]
  );

  // Mutation para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('notification_id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      logger.error('Error marking notification as read', error, { context: 'useNotifications' });
    }
  });

  // Setup realtime com filtro de user_id para segurança
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, queryKey]);

  return { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead: markAsReadMutation.mutate, 
    reloadNotifications: () => queryClient.invalidateQueries({ queryKey })
  };
};
