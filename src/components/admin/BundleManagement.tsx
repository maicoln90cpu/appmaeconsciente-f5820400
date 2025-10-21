import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Gift, Trash2, Pencil, Plus } from "lucide-react";

interface Product {
  id: string;
  title: string;
  slug: string;
}

interface Bundle {
  id: string;
  main_product_id: string;
  bonus_product_id: string;
  bonus_duration_days: number | null;
  is_active: boolean;
  main_product?: { title: string };
  bonus_product?: { title: string };
}

export function BundleManagement() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  
  const [formData, setFormData] = useState({
    main_product_id: "",
    bonus_product_id: "",
    bonus_duration_days: "",
    is_active: true,
  });

  useEffect(() => {
    loadBundles();
    loadProducts();
  }, []);

  const loadBundles = async () => {
    const { data, error } = await supabase
      .from("product_bundles")
      .select(`
        *,
        main_product:products!main_product_id(title),
        bonus_product:products!bonus_product_id(title)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar bundles");
      console.error(error);
    } else {
      setBundles(data || []);
    }
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, title, slug")
      .eq("is_active", true)
      .order("title");

    if (error) {
      toast.error("Erro ao carregar produtos");
      console.error(error);
    } else {
      setProducts(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.main_product_id || !formData.bonus_product_id) {
      toast.error("Selecione o produto principal e o produto bônus");
      return;
    }

    if (formData.main_product_id === formData.bonus_product_id) {
      toast.error("O produto principal e o bônus não podem ser iguais");
      return;
    }

    const bundleData = {
      main_product_id: formData.main_product_id,
      bonus_product_id: formData.bonus_product_id,
      bonus_duration_days: formData.bonus_duration_days ? parseInt(formData.bonus_duration_days) : null,
      is_active: formData.is_active,
    };

    if (editingBundle) {
      const { error } = await supabase
        .from("product_bundles")
        .update(bundleData)
        .eq("id", editingBundle.id);

      if (error) {
        toast.error("Erro ao atualizar bundle");
        console.error(error);
      } else {
        toast.success("Bundle atualizado com sucesso!");
        setIsDialogOpen(false);
        setEditingBundle(null);
        resetForm();
        loadBundles();
      }
    } else {
      const { error } = await supabase
        .from("product_bundles")
        .insert(bundleData);

      if (error) {
        if (error.code === "23505") {
          toast.error("Este bundle já existe");
        } else {
          toast.error("Erro ao criar bundle");
        }
        console.error(error);
      } else {
        toast.success("Bundle criado com sucesso!");
        setIsDialogOpen(false);
        resetForm();
        loadBundles();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este bundle?")) return;

    const { error } = await supabase
      .from("product_bundles")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir bundle");
      console.error(error);
    } else {
      toast.success("Bundle excluído com sucesso!");
      loadBundles();
    }
  };

  const handleEdit = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setFormData({
      main_product_id: bundle.main_product_id,
      bonus_product_id: bundle.bonus_product_id,
      bonus_duration_days: bundle.bonus_duration_days?.toString() || "",
      is_active: bundle.is_active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      main_product_id: "",
      bonus_product_id: "",
      bonus_duration_days: "",
      is_active: true,
    });
    setEditingBundle(null);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bundles de Produtos</h2>
          <p className="text-muted-foreground mt-1">
            Configure produtos bônus que são concedidos automaticamente ao comprar um produto principal
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Bundle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBundle ? "Editar Bundle" : "Criar Novo Bundle"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="main_product">Produto Principal</Label>
                <Select
                  value={formData.main_product_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, main_product_id: value })
                  }
                >
                  <SelectTrigger id="main_product">
                    <SelectValue placeholder="Selecione o produto principal" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bonus_product">Produto Bônus</Label>
                <Select
                  value={formData.bonus_product_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, bonus_product_id: value })
                  }
                >
                  <SelectTrigger id="bonus_product">
                    <SelectValue placeholder="Selecione o produto bônus" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">
                  Duração do Bônus (dias)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  placeholder="Deixe vazio para duração vitalícia"
                  value={formData.bonus_duration_days}
                  onChange={(e) =>
                    setFormData({ ...formData, bonus_duration_days: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Vazio = vitalício | 0 = mesmo prazo do produto principal
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Bundle Ativo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingBundle ? "Atualizar" : "Criar Bundle"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {bundles.length === 0 ? (
          <Card className="p-8 text-center">
            <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum bundle configurado</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro bundle de produtos
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Bundle
            </Button>
          </Card>
        ) : (
          bundles.map((bundle) => (
            <Card key={bundle.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">
                      {bundle.main_product?.title || "Produto não encontrado"}
                    </h3>
                    {!bundle.is_active && (
                      <span className="px-2 py-1 text-xs bg-secondary rounded">
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="pl-7 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      → 🎁 <span className="font-medium">{bundle.bonus_product?.title || "Produto não encontrado"}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {bundle.bonus_duration_days === null
                        ? "Acesso vitalício"
                        : bundle.bonus_duration_days === 0
                        ? "Mesmo prazo do produto principal"
                        : `${bundle.bonus_duration_days} dias de acesso`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(bundle)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(bundle.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
