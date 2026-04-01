import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Sparkles, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ClubePremium = () => {
  const [loading, setLoading] = useState(true);
  const [hasClubAccess, setHasClubAccess] = useState(false);
  const [clubProduct, setClubProduct] = useState<any>(null);
  const [allMaterials, setAllMaterials] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkClubAccess();
  }, []);

  const checkClubAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Buscar produto do clube
      const { data: product } = await supabase
        .from("products")
        .select("*")
        .eq("slug", "clube-premium")
        .single();

      setClubProduct(product);

      // Buscar TODOS os materiais ativos (exceto clube-premium)
      const { data: materials } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .neq("slug", "clube-premium")
        .order("display_order");

      setAllMaterials(materials || []);

      // Verificar se já tem acesso ao clube
      const { data: clubAccess } = await supabase
        .from("user_club_access")
        .select("has_active_access")
        .eq("user_id", user.id)
        .maybeSingle();

      setHasClubAccess(clubAccess?.has_active_access || false);
    } catch (error) {
      console.error("Error checking club access:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    if (clubProduct?.payment_url) {
      window.open(clubProduct.payment_url, '_blank');
      toast({
        title: "Redirecionando para pagamento",
        description: "Complete sua assinatura para ter acesso total!",
      });
    }
  };

  const benefits = [
    "Dashboard Unificado com visão 360° da rotina",
    "Suporte prioritário via chat",
    "Novos materiais incluídos automaticamente",
    "Alertas inteligentes personalizados",
    "Relatórios em PDF ilimitados",
    "Acesso a comunidade exclusiva Premium"
  ];

  // Calcular custo total dos materiais
  const totalMaterialsCost = allMaterials.reduce((sum, material) => {
    return sum + (material.price || 0);
  }, 0);

  // Calcular economia percentual
  const savingsPercentage = clubProduct?.price && totalMaterialsCost > 0
    ? Math.round(((totalMaterialsCost - clubProduct.price) / totalMaterialsCost) * 100)
    : 65;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <Badge className="mb-4 bg-gradient-to-r from-yellow-500 to-yellow-600">
          <Star className="h-3 w-3 mr-1" />
          Mais Econômico
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Clube Mãe Consciente Premium
        </h1>
        <p className="text-xl text-muted-foreground mb-2">
          Acesso ilimitado a TODOS os materiais
        </p>
        <p className="text-3xl font-bold text-primary">
          R$ {clubProduct?.price?.toFixed(2) || "59,90"}<span className="text-lg text-muted-foreground">/mês</span>
        </p>
      </div>

      {hasClubAccess && (
        <Alert className="mb-8 bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500">
          <Sparkles className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            🎉 Você já é membro Premium! Aproveite todos os benefícios.
          </AlertDescription>
        </Alert>
      )}

      {/* Comparação */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-center">Compra Avulsa</CardTitle>
            <CardDescription className="text-center">Pagamento único por material</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center py-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Custo total estimado</p>
              <p className="text-3xl font-bold text-destructive line-through">
                R$ {totalMaterialsCost.toFixed(2)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Comprando {allMaterials.length} materiais separadamente
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white px-4 py-1 text-sm font-bold">
            ECONOMIZE {savingsPercentage}%
          </div>
          <CardHeader>
            <CardTitle className="text-center">Clube Premium</CardTitle>
            <CardDescription className="text-center">Assinatura mensal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center py-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary">
              <p className="text-sm text-muted-foreground">Apenas</p>
              <p className="text-3xl font-bold text-primary">
                R$ {clubProduct?.price?.toFixed(2) || "59,90"}<span className="text-lg">/mês</span>
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
              <TrendingUp className="h-4 w-4" />
              <p className="text-sm">Acesso total a {allMaterials.length} materiais!</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materiais Incluídos */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Materiais Incluídos ({allMaterials.length} no total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {allMaterials.map((material) => (
              <div key={material.id} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm">{material.title}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benefícios Extras */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Benefícios Exclusivos Premium
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/20">
                <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA Final */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Pronta para aproveitar?</h3>
          <p className="mb-6 opacity-90">
            Cancele quando quiser, sem burocracia. Sua jornada de maternidade consciente começa agora!
          </p>
          {!hasClubAccess ? (
            <Button 
              size="lg" 
              variant="secondary"
              onClick={handleSubscribe}
              className="text-lg px-8"
            >
              <Star className="mr-2 h-5 w-5" />
              Assinar Clube Premium
            </Button>
          ) : (
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate("/materiais")}
              className="text-lg px-8"
            >
              Acessar Meus Materiais
            </Button>
          )}
        </CardContent>
      </Card>

      {/* FAQ / Informações */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>💳 Pagamento seguro via Hotmart</p>
        <p>🔄 Renovação automática mensal</p>
        <p>❌ Cancele a qualquer momento sem taxa</p>
      </div>
    </div>
  );
};

export default ClubePremium;
