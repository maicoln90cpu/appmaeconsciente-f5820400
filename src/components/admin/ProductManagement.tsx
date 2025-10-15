import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string | null;
  price: number | null;
  is_free: boolean;
  is_active: boolean;
  display_order: number;
  thumbnail_url: string | null;
  hotmart_product_id: string | null;
  payment_url: string | null;
  access_duration_days: number | null;
  destination_url: string | null;
  trial_enabled: boolean | null;
  trial_days: number | null;
}

export const ProductManagement = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    title: "",
    slug: "",
    description: "",
    short_description: "",
    price: null,
    is_free: true,
    is_active: true,
    display_order: 0,
    destination_url: null,
    hotmart_product_id: null,
    payment_url: null,
    access_duration_days: null,
    trial_enabled: false,
    trial_days: 3,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (product: Partial<Product>) => {
      const productData = {
        title: product.title || "",
        slug: product.slug || "",
        description: product.description || "",
        short_description: product.short_description,
        price: product.price,
        is_free: product.is_free ?? true,
        is_active: product.is_active ?? true,
        display_order: product.display_order ?? 0,
      };
      const { error } = await supabase.from("products").insert([productData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Produto criado");
      setNewProduct(false);
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao criar produto");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const { error } = await supabase.from("products").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Produto atualizado");
      setEditingId(null);
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao atualizar produto");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Produto deletado");
    },
    onError: () => {
      toast.error("Erro ao deletar produto");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      description: "",
      short_description: "",
      price: null,
      is_free: true,
      is_active: true,
      display_order: 0,
      destination_url: null,
      hotmart_product_id: null,
      payment_url: null,
      access_duration_days: null,
      trial_enabled: false,
      trial_days: 3,
    });
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData(product);
  };

  const handleSave = () => {
    if (newProduct) {
      createMutation.mutate(formData);
    } else if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewProduct(false);
    resetForm();
  };

  if (isLoading) {
    return <div>Carregando produtos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciamento de Produtos</h2>
        <Button onClick={() => setNewProduct(true)} disabled={newProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {newProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Descrição Curta</Label>
              <Input
                value={formData.short_description || ""}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
              <div>
                <Label>Link de Destino (opcional)</Label>
                <Input
                  value={formData.destination_url || ""}
                  onChange={(e) => setFormData({ ...formData, destination_url: e.target.value || null })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>ID Produto Hotmart (opcional)</Label>
                <Input
                  value={formData.hotmart_product_id || ""}
                  onChange={(e) => setFormData({ ...formData, hotmart_product_id: e.target.value || null })}
                  placeholder="12345"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ID do produto na Hotmart para mapear compras automáticas
                </p>
              </div>
              <div>
                <Label>URL de Pagamento (opcional)</Label>
                <Input
                  value={formData.payment_url || ""}
                  onChange={(e) => setFormData({ ...formData, payment_url: e.target.value || null })}
                  placeholder="https://pay.hotmart.com/..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL de checkout específica deste produto
                </p>
              </div>
              <div>
                <Label>Duração do Acesso (dias)</Label>
                <Input
                  type="number"
                  value={formData.access_duration_days || ""}
                  onChange={(e) => setFormData({ ...formData, access_duration_days: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="365"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Deixe em branco para acesso vitalício
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.trial_enabled || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, trial_enabled: checked })}
                  />
                  <Label>Trial para Novos Usuários</Label>
                </div>
                {formData.trial_enabled && (
                  <div>
                    <Label>Dias de Trial</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.trial_days || 3}
                      onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Preço</Label>
                <Input
                  type="number"
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || null })}
                  disabled={formData.is_free}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_free}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked, price: checked ? null : formData.price })}
                />
                <Label>Gratuito</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Ativo</Label>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={createMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {products?.map((product) => (
          <Card key={product.id}>
            {editingId === product.id ? (
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Link de Destino (opcional)</Label>
                  <Input
                    value={formData.destination_url || ""}
                    onChange={(e) => setFormData({ ...formData, destination_url: e.target.value || null })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>ID Produto Hotmart</Label>
                  <Input
                    value={formData.hotmart_product_id || ""}
                    onChange={(e) => setFormData({ ...formData, hotmart_product_id: e.target.value || null })}
                    placeholder="12345"
                  />
                </div>
                <div>
                  <Label>URL de Pagamento</Label>
                  <Input
                    value={formData.payment_url || ""}
                    onChange={(e) => setFormData({ ...formData, payment_url: e.target.value || null })}
                    placeholder="https://pay.hotmart.com/..."
                  />
                </div>
                <div>
                  <Label>Duração do Acesso (dias)</Label>
                  <Input
                    type="number"
                    value={formData.access_duration_days || ""}
                    onChange={(e) => setFormData({ ...formData, access_duration_days: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="365"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.trial_enabled || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, trial_enabled: checked })}
                    />
                    <Label>Trial para Novos Usuários</Label>
                  </div>
                  {formData.trial_enabled && (
                    <div>
                      <Label>Dias de Trial</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.trial_days || 3}
                        onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) })}
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Preço</Label>
                    <Input
                      type="number"
                      value={formData.price || ""}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || null })}
                      disabled={formData.is_free}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_free}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
                    />
                    <Label>Gratuito</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Ativo</Label>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </CardContent>
            ) : (
              <>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{product.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        /{product.slug}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">{product.description}</p>
                  <div className="flex gap-2">
                    {product.is_free ? (
                      <span className="text-sm text-green-600">Gratuito</span>
                    ) : (
                      <span className="text-sm">R$ {product.price?.toFixed(2)}</span>
                    )}
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm">
                      {product.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
