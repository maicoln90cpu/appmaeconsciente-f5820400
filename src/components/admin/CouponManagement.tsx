import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NewCoupon {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  product_id: string;
  max_uses: number | null;
  expires_at: string;
}

export const CouponManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newCoupon, setNewCoupon] = useState<NewCoupon>({
    code: "",
    discount_type: "percentage",
    discount_value: 10,
    product_id: "",
    max_uses: null,
    expires_at: "",
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch coupons
  const { data: coupons, isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select(`
          *,
          products:product_id (title)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Create coupon
  const createMutation = useMutation({
    mutationFn: async (coupon: NewCoupon) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("coupons")
        .insert({
          ...coupon,
          created_by: user.id,
          expires_at: coupon.expires_at || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Cupom criado com sucesso!" });
      setNewCoupon({
        code: "",
        discount_type: "percentage",
        discount_value: 10,
        product_id: "",
        max_uses: null,
        expires_at: "",
      });
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar cupom",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete coupon
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Cupom deletado" });
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });

  const generateRandomCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setNewCoupon({ ...newCoupon, code });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Código copiado!" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Cupom</CardTitle>
          <CardDescription>Configure um cupom de desconto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código do Cupom</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={newCoupon.code}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })
                  }
                  placeholder="EX: BEMVINDA10"
                />
                <Button type="button" variant="outline" onClick={generateRandomCode}>
                  Gerar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Produto</Label>
              <Select
                value={newCoupon.product_id}
                onValueChange={(value) => setNewCoupon({ ...newCoupon, product_id: value })}
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

            <div className="space-y-2">
              <Label htmlFor="discount_type">Tipo de Desconto</Label>
              <Select
                value={newCoupon.discount_type}
                onValueChange={(value: "percentage" | "fixed") =>
                  setNewCoupon({ ...newCoupon, discount_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                  <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_value">
                Valor {newCoupon.discount_type === "percentage" ? "(%)" : "(R$)"}
              </Label>
              <Input
                id="discount_value"
                type="number"
                value={newCoupon.discount_value}
                onChange={(e) =>
                  setNewCoupon({ ...newCoupon, discount_value: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_uses">Usos Máximos (opcional)</Label>
              <Input
                id="max_uses"
                type="number"
                value={newCoupon.max_uses || ""}
                onChange={(e) =>
                  setNewCoupon({
                    ...newCoupon,
                    max_uses: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Ilimitado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Data de Expiração (opcional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={newCoupon.expires_at}
                onChange={(e) => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={() => createMutation.mutate(newCoupon)} className="w-full">
            Criar Cupom
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cupons Criados</CardTitle>
          <CardDescription>Gerencie cupons existentes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : coupons?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum cupom criado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons?.map((coupon: any) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-bold">
                      <div className="flex items-center gap-2">
                        {coupon.code}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(coupon.code)}
                          aria-label="Copiar código do cupom"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{coupon.products?.title}</TableCell>
                    <TableCell>
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : `R$ ${coupon.discount_value}`}
                    </TableCell>
                    <TableCell>
                      {coupon.current_uses}/{coupon.max_uses || "∞"}
                    </TableCell>
                    <TableCell>
                      {coupon.expires_at
                        ? formatDistance(new Date(coupon.expires_at), new Date(), {
                            addSuffix: true,
                            locale: ptBR,
                          })
                        : "Sem expiração"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.is_active ? "default" : "secondary"}>
                        {coupon.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(coupon.id)}
                        aria-label="Deletar cupom"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
