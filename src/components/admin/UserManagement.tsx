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
import { useState } from "react";
import { UserPlus, Shield } from "lucide-react";

export const UserManagement = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles!left (role)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title")
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
  });

  const grantAccessMutation = useMutation({
    mutationFn: async ({ userId, productId }: { userId: string; productId: string }) => {
      const { error } = await supabase.from("user_product_access").insert({
        user_id: userId,
        product_id: productId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Acesso concedido");
      setSelectedUser(null);
      setSelectedProduct("");
    },
    onError: () => {
      toast.error("Erro ao conceder acesso");
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

  const handleGrantAccess = (userId: string) => {
    if (!selectedProduct) {
      toast.error("Selecione um produto");
      return;
    }
    grantAccessMutation.mutate({ userId, productId: selectedProduct });
  };

  if (usersLoading) {
    return <div>Carregando usuários...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
      <div className="grid gap-4">
        {users?.map((user) => {
          const isAdmin = (user.user_roles as any)?.some((r: any) => r.role === "admin");
          
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
                  <Button
                    variant={isAdmin ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => toggleAdminMutation.mutate({ userId: user.id, isAdmin })}
                  >
                    {isAdmin ? "Remover Admin" : "Tornar Admin"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    Perfil: {user.perfil_completo ? "Completo" : "Incompleto"}
                  </p>
                  
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
