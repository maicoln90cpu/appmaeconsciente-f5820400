/**
 * @fileoverview Hook para verificação de roles/permissões do usuário
 * @module hooks/useUserRole
 */

import { useQuery } from '@tanstack/react-query';

import { QueryKeys, QueryCacheConfig } from '@/lib/query-config';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Tipos de role disponíveis no sistema
 * - `admin`: Acesso total ao painel administrativo
 * - `user`: Usuário comum com acesso às funcionalidades básicas
 */
export type UserRole = 'admin' | 'user';

interface UserRoleData {
  role: UserRole;
  isAdmin: boolean;
}

/**
 * Hook para verificar o role do usuário autenticado
 */
export const useUserRole = () => {
  const { user } = useAuth();

  const { data, isLoading: loading } = useQuery<UserRoleData>({
    queryKey: QueryKeys.userRoles(user?.id ?? ''),
    queryFn: async (): Promise<UserRoleData> => {
      if (!user) {
        return { role: 'user', isAdmin: false };
      }

      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user role:', error);
        return { role: 'user', isAdmin: false };
      }

      if (roles && roles.length > 0) {
        const hasAdminRole = roles.some(r => r.role === 'admin');
        return {
          role: hasAdminRole ? 'admin' : 'user',
          isAdmin: hasAdminRole,
        };
      }

      return { role: 'user', isAdmin: false };
    },
    enabled: !!user,
    staleTime: QueryCacheConfig.user.staleTime,
    gcTime: QueryCacheConfig.user.gcTime,
  });

  return {
    role: data?.role ?? null,
    isAdmin: data?.isAdmin ?? false,
    loading,
  };
};
