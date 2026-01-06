/**
 * @fileoverview Hook para verificação de roles/permissões do usuário
 * @module hooks/useUserRole
 */

import { useState, useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";

/**
 * Tipos de role disponíveis no sistema
 * - `admin`: Acesso total ao painel administrativo
 * - `user`: Usuário comum com acesso às funcionalidades básicas
 */
export type UserRole = 'admin' | 'user';

/**
 * Hook para verificar o role do usuário autenticado
 * 
 * Consulta a tabela `user_roles` para determinar se o usuário
 * possui permissões de administrador.
 * 
 * @returns Objeto contendo:
 * - `role`: Role atual do usuário ('admin' | 'user' | null)
 * - `isAdmin`: Boolean indicando se é administrador
 * - `loading`: Estado de carregamento
 * 
 * @example
 * ```tsx
 * const { isAdmin, loading } = useUserRole();
 * 
 * if (loading) return <Spinner />;
 * 
 * if (isAdmin) {
 *   return <AdminDashboard />;
 * }
 * return <UserDashboard />;
 * ```
 */
export const useUserRole = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    /**
     * Busca o role do usuário na tabela user_roles
     * Um usuário pode ter múltiplos roles, mas basta ter 'admin'
     * para ser considerado administrador
     */
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('user');
          setIsAdmin(false);
        } else if (data && data.length > 0) {
          // Verifica se possui pelo menos um role 'admin'
          const hasAdminRole = data.some(r => r.role === 'admin');
          setIsAdmin(hasAdminRole);
          setRole(hasAdminRole ? 'admin' : 'user');
        } else {
          setRole('user');
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error in useUserRole:', error);
        setRole('user');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  return { role, isAdmin, loading };
};
