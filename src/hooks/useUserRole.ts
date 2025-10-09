import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'user';

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
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
