import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Lock, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  short_description: string | null;
  thumbnail_url: string | null;
  is_free: boolean;
  price: number | null;
  display_order: number;
  destination_url: string | null;
  hotmart_product_id: string | null;
  payment_url: string | null;
  access_duration_days: number | null;
}

interface ProductAccess {
  product_id: string;
  expires_at: string | null;
}


const Materiais = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [userAccess, setUserAccess] = useState<ProductAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "free" | "paid" | "my">("all");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (productsError) throw productsError;

      const { data: accessData, error: accessError } = await supabase
        .from("user_product_access")
        .select("product_id, expires_at")
        .eq("user_id", user.id);

      if (accessError) throw accessError;

      setProducts(productsData || []);
      setUserAccess(accessData || []);
    } catch (error) {
      console.error("Error loading products:", error);
      toast({
        title: "Erro ao carregar materiais",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = (productId: string) => {
    const access = userAccess.find((a) => a.product_id === productId);
    if (!access) return false;
    
    // Se não tem data de expiração, acesso vitalício
    if (!access.expires_at) return true;
    
    // Verificar se expirou
    const now = new Date();
    const expiresAt = new Date(access.expires_at);
    return now < expiresAt;
  };

  const handleAccessProduct = async (product: Product) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    // ✅ VERIFICAR ADMIN PRIMEIRO (antes de qualquer outra lógica)
    if (isAdmin) {
      if (product.destination_url) {
        window.open(product.destination_url, '_blank');
      } else {
        navigate(`/materiais/${product.slug}`);
      }
      return;
    }

    // Verificar se produto é gratuito
    if (product.is_free) {
      // Conceder acesso automaticamente
      if (!hasAccess(product.id)) {
        await supabase.from("user_product_access").insert({
          user_id: user.id,
          product_id: product.id,
        });
      }

      // Acessar
      if (product.destination_url) {
        window.open(product.destination_url, '_blank');
      } else {
        navigate(`/materiais/${product.slug}`);
      }
      return;
    }

    // Produto pago - verificar acesso válido
    const userHasValidAccess = hasAccess(product.id);

    if (userHasValidAccess) {
      // Tem acesso válido
      if (product.destination_url) {
        window.open(product.destination_url, '_blank');
      } else {
        navigate(`/materiais/${product.slug}`);
      }
    } else {
      // Não tem acesso ou expirou - redirecionar para pagamento
      if (product.payment_url) {
        window.open(product.payment_url, '_blank');
        toast({
          title: "Redirecionando para pagamento",
          description: "Você será direcionado para a página de checkout.",
        });
      } else {
        toast({
          title: "Produto Premium",
          description: "Entre em contato para adquirir este produto.",
          variant: "destructive",
        });
      }
    }
  };

  const filteredProducts = products.filter((product) => {
    if (filter === "all") return true;
    if (filter === "free") return product.is_free;
    if (filter === "paid") return !product.is_free;
    if (filter === "my") return hasAccess(product.id) || product.is_free;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Materiais</h1>
          <p className="text-muted-foreground">
            Ferramentas e conteúdos para sua jornada de maternidade consciente
          </p>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-8">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="free">Gratuitos</TabsTrigger>
            <TabsTrigger value="paid">Pagos</TabsTrigger>
            <TabsTrigger value="my">Meus Materiais</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const userHasAccess = hasAccess(product.id);
            const canAccess = product.is_free || userHasAccess || isAdmin;

            return (
              <Card key={product.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle>{product.title}</CardTitle>
                    {product.is_free ? (
                      <Badge variant="secondary">Gratuito</Badge>
                    ) : userHasAccess ? (
                      <Badge className="bg-green-500">Seu</Badge>
                    ) : (
                      <Badge variant="outline">Premium</Badge>
                    )}
                  </div>
                  <CardDescription>
                    {product.short_description || product.description.substring(0, 100) + "..."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                  <Button
                    className="w-full"
                    onClick={() => handleAccessProduct(product)}
                    variant={canAccess ? "default" : "outline"}
                  >
                    {canAccess ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Acessar
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum material encontrado com esse filtro.</p>
          </div>
        )}
      </div>
  );
};

export default Materiais;
