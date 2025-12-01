import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Lock, CheckCircle2, Loader2, Tag, Star, Baby, Smartphone, Share, PlusSquare } from "lucide-react";
import { ToolSuggestionCard } from "@/components/materiais/ToolSuggestionCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
  category?: string | null;
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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [hasClubAccess, setHasClubAccess] = useState(false);
  const [clubPrice, setClubPrice] = useState<number | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
  }, []);

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

      // Verificar acesso ao Clube Premium
      const { data: clubData } = await supabase
        .from("user_club_access")
        .select("has_active_access")
        .eq("user_id", user.id)
        .maybeSingle();

      // Buscar preço do Clube Premium
      const { data: clubProduct } = await supabase
        .from("products")
        .select("price")
        .eq("slug", "clube-premium")
        .single();

      setProducts(productsData || []);
      setUserAccess(accessData || []);
      setHasClubAccess(clubData?.has_active_access || false);
      setClubPrice(clubProduct?.price || null);
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

  const categories = Array.from(
    new Set(products.map(p => p.category).filter(Boolean))
  ) as string[];

  const filteredProducts = products.filter((product) => {
    // Filtro de acesso
    const accessMatch = 
      filter === "all" ? true :
      filter === "free" ? product.is_free :
      filter === "paid" ? !product.is_free :
      filter === "my" ? (hasAccess(product.id) || product.is_free) : true;

    // Filtro de categoria
    const categoryMatch = categoryFilter === "all" || product.category === categoryFilter;

    return accessMatch && categoryMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Materiais</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Ferramentas e conteúdos para sua jornada de maternidade consciente
            </p>
          </div>
          
          {/* Botão Instalar App */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="default" className="gap-2 w-full sm:w-auto">
                <Smartphone className="h-4 w-4 sm:h-5 sm:w-5" />
                Instalar App
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                  <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  Instale o App na Tela Inicial
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Acesso rápido, offline e notificações personalizadas
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4">
                {/* iOS */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share className="h-5 w-5 text-primary" />
                      iPhone (iOS)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                        1
                      </div>
                      <p className="text-sm">Abra no <strong>Safari</strong></p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                        2
                      </div>
                      <p className="text-sm">Toque em <strong>Compartilhar</strong> <Share className="h-4 w-4 inline" /></p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                        3
                      </div>
                      <p className="text-sm">Selecione <strong>"Adicionar à Tela de Início"</strong></p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                        4
                      </div>
                      <p className="text-sm">Toque em <strong>"Adicionar"</strong></p>
                    </div>
                  </CardContent>
                </Card>

                {/* Android */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-primary" />
                      Android
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                        1
                      </div>
                      <p className="text-sm">Abra no <strong>Chrome</strong></p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                        2
                      </div>
                      <p className="text-sm">Toque no <strong>menu (⋮)</strong></p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                        3
                      </div>
                      <p className="text-sm">Selecione <strong>"Instalar app"</strong></p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                        4
                      </div>
                      <p className="text-sm">Confirme a instalação</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                <h4 className="font-semibold mb-2">Benefícios:</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Acesso offline aos materiais
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Carregamento mais rápido
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Ícone na tela inicial do celular
                  </li>
                </ul>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Banner Clube Premium */}
        {!hasClubAccess && clubPrice && (
          <Alert className="mb-4 sm:mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary border-2">
            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <p className="font-semibold text-primary mb-1 text-sm sm:text-base">
                  🌟 Acesse TODOS os materiais por R$ {clubPrice.toFixed(2)}/mês!
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Clube M.A.E.S. Premium - {products.filter(p => p.slug !== 'clube-premium').length} materiais incluídos
                </p>
              </div>
              <Button onClick={() => navigate('/clube-premium')} className="w-full sm:w-auto sm:ml-4" size="default">
                Ver Clube Premium
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Cards Especiais - Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Dashboard Unificado */}
          <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="p-2 sm:p-3 bg-primary rounded-lg shrink-0">
                  <Baby className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg md:text-xl">
                    <span className="break-words">🍼💤 Dashboard Unificado</span>
                    <Badge className="bg-green-500 text-xs">NOVO</Badge>
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs sm:text-sm">
                    Visão 360° da rotina: mamadas, sono, alertas inteligentes e timeline completa
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button onClick={() => navigate('/dashboard-bebe')} size="default" className="w-full">
                Acessar Dashboard
              </Button>
            </CardContent>
          </Card>

          {/* Card de Sugestão de Ferramenta */}
          <ToolSuggestionCard />
        </div>

        <div className="space-y-4 mb-6 sm:mb-8">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
            <TabsList className="w-full grid grid-cols-2 sm:inline-flex h-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">Todos</TabsTrigger>
              <TabsTrigger value="free" className="text-xs sm:text-sm">Gratuitos</TabsTrigger>
              <TabsTrigger value="paid" className="text-xs sm:text-sm">Pagos</TabsTrigger>
              <TabsTrigger value="my" className="text-xs sm:text-sm">Meus Materiais</TabsTrigger>
            </TabsList>
          </Tabs>

          {categories.length > 0 && (
            <div className="flex items-center gap-2 sm:gap-3">
              <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProducts.map((product) => {
            const userHasAccess = hasAccess(product.id);
            const canAccess = product.is_free || userHasAccess || isAdmin;

            return (
              <Card key={product.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle>{product.title}</CardTitle>
                    <div className="flex flex-col gap-1 items-end">
                      {product.is_free ? (
                        <Badge variant="secondary">Gratuito</Badge>
                      ) : userHasAccess ? (
                        <Badge className="bg-green-500">Seu</Badge>
                      ) : (
                        <Badge variant="outline">Premium</Badge>
                      )}
                      {product.category && (
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    {product.short_description || product.description.substring(0, 100) + "..."}
                  </CardDescription>
                  {!product.is_free && product.price && !userHasAccess && (
                    <p className="text-lg font-bold text-primary mt-2">
                      R$ {product.price.toFixed(2)}
                    </p>
                  )}
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
