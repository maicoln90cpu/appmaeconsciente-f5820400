import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { UserPlus, Shield, Search, ArrowUpDown, RefreshCw, Loader2, Trash2, KeyRound, X } from "lucide-react";
import { CreateUserDialog } from "./CreateUserDialog";

export const UserManagement = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [accessDuration, setAccessDuration] = useState<number>(30);
  const [lifetimeAccess, setLifetimeAccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [sortBy, setSortBy] = useState<"date" | "email">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
          user_roles (
            id,
            role
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Erro ao carregar usuários:', error);
        throw error;
      }

      console.log('Usuários carregados:', data?.length);
      return data || [];
    },
  });

  const { data: products } = useQuery({
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

  const { data: productAccess } = useQuery({
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
      
      // Agrupar por user_id
      const grouped = (data || []).reduce((acc: any, item: any) => {
        if (!acc[item.user_id]) {
          acc[item.user_id] = [];
        }
        acc[item.user_id].push({
          product_id: item.product_id,
          product_title: item.products?.title || "Produto desconhecido",
          expires_at: item.expires_at
        });
        return acc;
      }, {});
      
      return grouped;
    },
  });

  const grantAccessMutation = useMutation({
    mutationFn: async ({ userId, productId, expiresAt }: { userId: string; productId: string; expiresAt: string | null }) => {
      const { error } = await supabase
        .from('user_product_access')
        .upsert({
          user_id: userId,
          product_id: productId,
          expires_at: expiresAt
        }, {
          onConflict: 'user_id,product_id'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-product-access'] });
      toast.success("Acesso concedido com sucesso");
      setSelectedUser(null);
      setSelectedProduct("");
    },
    onError: (error: any) => {
      toast.error("Erro ao conceder acesso: " + error.message);
    },
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
      toast.success("Acesso revogado com sucesso");
    },
    onError: (error: any) => {
      toast.error("Erro ao revogar acesso: " + error.message);
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      if (isAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");
        if (error) throw error;
      } else {
        // Add admin role
        const { error } = await supabase.from("user_roles").insert({
          user_id: userId,
          role: "admin",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar role");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("delete-user-admin", {
        body: { userId },
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuário excluído com sucesso");
    },
    onError: (error: any) => {
      console.error("Erro ao excluir usuário:", error);
      toast.error(error.message || "Erro ao excluir usuário");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Email de recuperação enviado");
    },
    onError: (error: any) => {
      console.error("Erro ao resetar senha:", error);
      toast.error("Erro ao enviar email de recuperação");
    },
  });

  const handleGrantAccess = (userId: string) => {
    if (!selectedProduct) {
      toast.error("Selecione um produto");
      return;
    }
    
    let expiresAt = null;
    
    if (!lifetimeAccess) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + accessDuration);
      expiresAt = expirationDate.toISOString();
    }
    
    grantAccessMutation.mutate({ userId, productId: selectedProduct, expiresAt });
    setSelectedUser(null);
    setAccessDuration(30);
    setLifetimeAccess(false);
  };

  // Filtrar e ordenar usuários
  const filteredAndSortedUsers = useMemo(() => {
    if (!users) return [];
    
    // Filtrar por busca e role
    const filtered = users.filter(user => {
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (roleFilter === "all") return matchesSearch;
      
      const isAdmin = Array.isArray(user.user_roles) && user.user_roles.length > 0
        ? user.user_roles.some((r: any) => r?.role === "admin")
        : false;
      
      if (roleFilter === "admin") return matchesSearch && isAdmin;
      if (roleFilter === "user") return matchesSearch && !isAdmin;
      
      return matchesSearch;
    });

    // Ordenar
    return [...filtered].sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        return sortOrder === "asc" 
          ? a.email.localeCompare(b.email)
          : b.email.localeCompare(a.email);
      }
    });
  }, [users, searchTerm, roleFilter, sortBy, sortOrder]);

  if (usersLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
        </div>
        <div className="flex items-center justify-center p-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Carregando usuários...</p>
          </div>
        </div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <div className="text-destructive mb-4 text-4xl">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar usuários</h3>
            <p className="text-muted-foreground text-center mb-4">
              {(usersError as any)?.message || "Ocorreu um erro desconhecido"}
            </p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
        <CreateUserDialog onUserCreated={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })} />
      </div>

      {/* Filtros e controles */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Total: {filteredAndSortedUsers.length} de {users?.length || 0} usuário(s)
              </p>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="admin">Apenas Admins</SelectItem>
                  <SelectItem value="user">Apenas Usuários</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant={sortBy === "date" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("date")}
                >
                  📅 Data
                </Button>
                <Button
                  variant={sortBy === "email" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("email")}
                >
                  📧 Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {filteredAndSortedUsers.length === 0 && users && users.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Tente ajustar os filtros de busca
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
              }}
            >
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>
      )}

      {filteredAndSortedUsers.length === 0 && (!users || users.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum usuário cadastrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie o primeiro usuário para começar
            </p>
            <CreateUserDialog onUserCreated={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })} />
          </CardContent>
        </Card>
      )}

      {/* Lista de usuários */}
      <div className="grid gap-4">
        {filteredAndSortedUsers.map((user) => {
          const isAdmin = Array.isArray(user.user_roles) && user.user_roles.length > 0
            ? user.user_roles.some((r: any) => r?.role === "admin")
            : false;
          
          return (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{user.email}</CardTitle>
                      {isAdmin && (
                        <Badge variant="destructive">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cadastrado em {format(new Date(user.created_at), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={isAdmin ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => toggleAdminMutation.mutate({ userId: user.id, isAdmin })}
                    >
                      {isAdmin ? "Remover Admin" : "Tornar Admin"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetPasswordMutation.mutate(user.email)}
                    >
                      <KeyRound className="h-4 w-4 mr-2" />
                      Resetar Senha
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir o usuário ${user.email}? Esta ação não pode ser desfeita.`)) {
                          deleteUserMutation.mutate(user.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    Perfil: {user.perfil_completo ? "Completo" : "Incompleto"}
                  </p>

                  {/* Produtos com acesso */}
                  {productAccess?.[user.id] && productAccess[user.id].length > 0 && (
                    <div className="pt-2 border-t">
                      <Label className="text-xs mb-2 block">Produtos com Acesso</Label>
                      <div className="flex flex-wrap gap-2">
                        {productAccess[user.id].map((access: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1 bg-secondary rounded-md px-2 py-1 group">
                            <span className="text-xs">
                              {access.product_title}
                              {access.expires_at && (
                                <span className="ml-1 text-muted-foreground">
                                  (até {format(new Date(access.expires_at), "dd/MM/yyyy")})
                                </span>
                              )}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                if (confirm(`Deseja revogar o acesso de ${user.email} ao produto "${access.product_title}"?`)) {
                                  revokeAccessMutation.mutate({ userId: user.id, productId: access.product_id });
                                }
                              }}
                            >
                              <X className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 items-end pt-2 border-t">
                    <div className="flex-1">
                      <Label className="text-xs">Conceder Acesso ao Produto</Label>
                      <Select
                        value={selectedUser === user.id ? selectedProduct : ""}
                        onValueChange={(value) => {
                          setSelectedUser(user.id);
                          setSelectedProduct(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleGrantAccess(user.id)}
                      disabled={!selectedProduct || selectedUser !== user.id}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Conceder
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
