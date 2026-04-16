import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { CreateUserDialog } from "./CreateUserDialog";
import {
  UserFilters,
  UserCard,
  NoSearchResults,
  NoUsersRegistered,
  UserLoading,
  UserError,
  UserData,
  ProductData,
  ProductAccessData,
  UserFiltersState,
  AccessGrantState,
} from "./user-management";
import { toast } from "sonner";

export const UserManagement = () => {
  const queryClient = useQueryClient();
  
  // Filter and sort state
  const [filters, setFilters] = useState<UserFiltersState>({
    searchTerm: "",
    roleFilter: "all",
    sortBy: "date",
    sortOrder: "desc",
  });

  // Access grant state
  const [accessState, setAccessState] = useState<AccessGrantState>({
    selectedUser: null,
    selectedProduct: "",
    accessDuration: 30,
    lifetimeAccess: false,
  });

  // Queries
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          perfil_completo,
          created_at,
          updated_at,
          is_virtual,
          user_roles (
            id,
            role
          )
        `)
        .neq("is_virtual", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = data.map(u => u.id);
      const { data: activities, error: actError } = await supabase
        .rpc('get_user_last_activities', { user_ids: userIds });

      if (actError) console.error('Erro ao buscar atividades:', actError);

      const activityMap = new Map(
        (activities || []).map((a: any) => [a.user_id, a])
      );

      return data.map((user) => {
        const activity = activityMap.get(user.id);
        return {
          ...user,
          lastActivity: activity?.last_activity ? new Date(activity.last_activity) : null,
          hasUsedTools: activity?.has_used_tools || false,
        } as UserData;
      });
    },
  });

  const { data: products } = useQuery<ProductData[]>({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, access_duration_days")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: productAccess } = useQuery<Record<string, ProductAccessData[]>>({
    queryKey: ["user-product-access"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_product_access")
        .select(`
          user_id,
          product_id,
          expires_at,
          products (
            title
          )
        `);

      if (error) throw error;

      return (data || []).reduce((acc: Record<string, ProductAccessData[]>, item: any) => {
        if (!acc[item.user_id]) acc[item.user_id] = [];
        acc[item.user_id].push({
          product_id: item.product_id,
          product_title: item.products?.title || "Produto desconhecido",
          expires_at: item.expires_at,
        });
        return acc;
      }, {});
    },
  });

  // Mutations
  const grantAccessMutation = useMutation({
    mutationFn: async ({ userId, productId, expiresAt }: { userId: string; productId: string; expiresAt: string | null }) => {
      const { error } = await supabase
        .from('user_product_access')
        .upsert({ user_id: userId, product_id: productId, expires_at: expiresAt }, { onConflict: 'user_id,product_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-product-access'] });
      toast("Acesso concedido com sucesso");
      setAccessState(prev => ({ ...prev, selectedUser: null, selectedProduct: "" }));
    },
    onError: (error: any) => toast.error("Erro ao conceder acesso", { description: error.message }),
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async ({ userId, productId }: { userId: string; productId: string }) => {
      const { error } = await supabase
        .from('user_product_access')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-product-access'] });
      toast("Acesso revogado com sucesso");
    },
    onError: (error: any) => toast.error("Erro ao revogar acesso", { description: error.message }),
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      if (isAdmin) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast("Role atualizado");
    },
    onError: () => toast.error("Erro ao atualizar role"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("delete-user-admin", { body: { userId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast("Usuário excluído com sucesso");
    },
    onError: (error: any) => toast.error("Erro ao excluir usuário", { description: error.message }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` });
      if (error) throw error;
    },
    onSuccess: () => toast("Email de recuperação enviado"),
    onError: () => toast.error("Erro ao enviar email de recuperação"),
  });

  // Handlers
  const handleGrantAccess = (userId: string) => {
    if (!accessState.selectedProduct) {
      toast.error("Selecione um produto");
      return;
    }

    let expiresAt: string | null = null;
    if (!accessState.lifetimeAccess) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + accessState.accessDuration);
      expiresAt = expirationDate.toISOString();
    }

    grantAccessMutation.mutate({ userId, productId: accessState.selectedProduct, expiresAt });
    setAccessState(prev => ({ ...prev, accessDuration: 30, lifetimeAccess: false }));
  };

  // Memoized filtered users
  const filteredAndSortedUsers = useMemo(() => {
    if (!users) return [];

    const filtered = users.filter(user => {
      const matchesSearch = user.email.toLowerCase().includes(filters.searchTerm.toLowerCase());
      if (filters.roleFilter === "all") return matchesSearch;

      const isAdmin = Array.isArray(user.user_roles) && user.user_roles.some((r) => r?.role === "admin");
      if (filters.roleFilter === "admin") return matchesSearch && isAdmin;
      if (filters.roleFilter === "user") return matchesSearch && !isAdmin;
      return matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (filters.sortBy === "date") {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return filters.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      return filters.sortOrder === "asc" ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email);
    });
  }, [users, filters]);

  // Loading and error states
  if (usersLoading) return <UserLoading />;
  if (usersError) return <UserError error={usersError as Error} onRetry={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
        <CreateUserDialog onUserCreated={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })} />
      </div>

      <UserFilters
        filters={filters}
        onSearchChange={(value) => setFilters(prev => ({ ...prev, searchTerm: value }))}
        onRoleFilterChange={(value) => setFilters(prev => ({ ...prev, roleFilter: value }))}
        onSortByChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
        onSortOrderToggle={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === "asc" ? "desc" : "asc" }))}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })}
        totalFiltered={filteredAndSortedUsers.length}
        totalUsers={users?.length || 0}
      />

      {filteredAndSortedUsers.length === 0 && users && users.length > 0 && (
        <NoSearchResults onClearFilters={() => setFilters(prev => ({ ...prev, searchTerm: "", roleFilter: "all" }))} />
      )}

      {filteredAndSortedUsers.length === 0 && (!users || users.length === 0) && (
        <NoUsersRegistered onUserCreated={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })} />
      )}

      <div className="grid gap-4">
        {filteredAndSortedUsers.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            products={products}
            userAccess={productAccess?.[user.id]}
            accessState={accessState}
            onToggleAdmin={(userId, isAdmin) => toggleAdminMutation.mutate({ userId, isAdmin })}
            onResetPassword={(email) => resetPasswordMutation.mutate(email)}
            onDeleteUser={(userId, email) => {
              if (confirm(`Tem certeza que deseja excluir o usuário ${email}? Esta ação não pode ser desfeita.`)) {
                deleteUserMutation.mutate(userId);
              }
            }}
            onRevokeAccess={(userId, productId, productTitle, email) => {
              if (confirm(`Deseja revogar o acesso de ${email} ao produto "${productTitle}"?`)) {
                revokeAccessMutation.mutate({ userId, productId });
              }
            }}
            onSelectProduct={(userId, productId) => setAccessState(prev => ({ ...prev, selectedUser: userId, selectedProduct: productId }))}
            onAccessDurationChange={(duration) => setAccessState(prev => ({ ...prev, accessDuration: duration }))}
            onLifetimeChange={(lifetime) => setAccessState(prev => ({ ...prev, lifetimeAccess: lifetime }))}
            onGrantAccess={handleGrantAccess}
          />
        ))}
      </div>
    </div>
  );
};
