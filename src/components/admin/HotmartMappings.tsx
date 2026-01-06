import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { Plus, Trash2, ExternalLink } from "lucide-react";

interface ProductMapping {
  id: string;
  hotmart_product_id: string;
  internal_product_id: string;
  product_title: string;
  access_duration_days?: number | null;
}

export const HotmartMappings = () => {
  const [mappings, setMappings] = useState<ProductMapping[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [newMapping, setNewMapping] = useState({ 
    hotmart_id: "", 
    product_id: "",
    access_duration_days: null as number | null,
    is_lifetime: false
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMappings();
    loadProducts();
  }, []);

  const loadMappings = async () => {
    const { data, error } = await supabase
      .from("hotmart_product_mapping")
      .select(`
        id,
        hotmart_product_id,
        internal_product_id,
        products:internal_product_id (title, access_duration_days)
      `);

    if (!error && data) {
      setMappings(
        data.map((m: any) => ({
          id: m.id,
          hotmart_product_id: m.hotmart_product_id,
          internal_product_id: m.internal_product_id,
          product_title: m.products?.title || "Produto Deletado",
          access_duration_days: m.products?.access_duration_days
        }))
      );
    }
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, title, is_free")
      .eq("is_free", false)
      .order("title");

    if (data) setProducts(data);
  };

  const handleAddMapping = async () => {
    if (!newMapping.hotmart_id || !newMapping.product_id) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    if (!newMapping.is_lifetime && !newMapping.access_duration_days) {
      toast({
        title: "Erro",
        description: "Defina a duração do acesso ou marque como vitalício",
        variant: "destructive",
      });
      return;
    }

    // First add the mapping
    const { error: mappingError } = await supabase.from("hotmart_product_mapping").insert({
      hotmart_product_id: newMapping.hotmart_id,
      internal_product_id: newMapping.product_id,
    });

    if (mappingError) {
      toast({
        title: "Erro ao criar mapeamento",
        variant: "destructive",
      });
      return;
    }

    // Update product with access duration
    const accessDuration = newMapping.is_lifetime ? null : newMapping.access_duration_days;
    
    const { error: productError } = await supabase
      .from("products")
      .update({ access_duration_days: accessDuration })
      .eq("id", newMapping.product_id);

    if (productError) {
      toast({
        title: "Erro ao configurar duração",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Mapeamento criado com sucesso!" });
    setNewMapping({ 
      hotmart_id: "", 
      product_id: "",
      access_duration_days: null,
      is_lifetime: false
    });
    setDialogOpen(false);
    loadMappings();
  };

  const handleDeleteMapping = async (id: string) => {
    const { error } = await supabase
      .from("hotmart_product_mapping")
      .delete()
      .eq("id", id);

    if (!error) {
      toast({ title: "Mapeamento deletado" });
      loadMappings();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mapeamento de Produtos Hotmart</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Vincule produtos da Hotmart aos produtos internos
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Mapeamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Mapeamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>ID do Produto Hotmart</Label>
                  <Input
                    value={newMapping.hotmart_id}
                    onChange={(e) =>
                      setNewMapping({ ...newMapping, hotmart_id: e.target.value })
                    }
                    placeholder="123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Produto Interno</Label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={newMapping.product_id}
                    onChange={(e) =>
                      setNewMapping({ ...newMapping, product_id: e.target.value })
                    }
                  >
                    <option value="">Selecione um produto</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="lifetime"
                      checked={newMapping.is_lifetime}
                      onChange={(e) => setNewMapping({
                        ...newMapping,
                        is_lifetime: e.target.checked,
                        access_duration_days: e.target.checked ? null : newMapping.access_duration_days
                      })}
                      className="rounded"
                    />
                    <Label htmlFor="lifetime" className="cursor-pointer">
                      Acesso Vitalício
                    </Label>
                  </div>
                </div>
                {!newMapping.is_lifetime && (
                  <div className="space-y-2">
                    <Label>Duração do Acesso (dias)</Label>
                    <Input
                      type="number"
                      value={newMapping.access_duration_days || ''}
                      onChange={(e) => setNewMapping({
                        ...newMapping,
                        access_duration_days: e.target.value ? parseInt(e.target.value) : null
                      })}
                      placeholder="Ex: 30, 90, 365..."
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Exemplos: 30 dias (1 mês), 365 dias (1 ano)
                    </p>
                  </div>
                )}
                <Button onClick={handleAddMapping} className="w-full">
                  Criar Mapeamento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-semibold mb-2">📍 URL do Webhook Hotmart:</p>
          <code className="text-xs bg-background p-2 rounded block">
            {import.meta.env.VITE_SUPABASE_URL}/functions/v1/hotmart-webhook
          </code>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              navigator.clipboard.writeText(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hotmart-webhook`
              );
              toast({ title: "URL copiada!" });
            }}
          >
            Copiar URL
          </Button>
        </div>

        {mappings.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum mapeamento configurado
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Hotmart</TableHead>
                <TableHead>Produto Interno</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell className="font-mono">{mapping.hotmart_product_id}</TableCell>
                  <TableCell>{mapping.product_title}</TableCell>
                  <TableCell>
                    {mapping.access_duration_days 
                      ? `${mapping.access_duration_days} dias` 
                      : 'Vitalício'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMapping(mapping.id)}
                      aria-label="Deletar mapeamento"
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
  );
};
