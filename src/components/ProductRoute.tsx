import { useEffect, useState } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { analytics } from "@/lib/analytics";

interface ProductRouteProps {
  productSlug: string;
}

export const ProductRoute = ({ productSlug }: ProductRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    checkAccess();
  }, [productSlug]);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: productData } = await supabase
        .from("products")
        .select("*")
        .eq("slug", productSlug)
        .single();

      if (!productData) {
        setLoading(false);
        return;
      }

      setProduct(productData);

      if (productData.is_free) {
        // Auto-grant access for free products
        const { data: existingAccess } = await supabase
          .from("user_product_access")
          .select("id")
          .eq("user_id", user.id)
          .eq("product_id", productData.id)
          .maybeSingle();

        if (!existingAccess) {
          await supabase.from("user_product_access").insert({
            user_id: user.id,
            product_id: productData.id,
          });
        }

        setHasAccess(true);
      } else {
        const { data: accessData } = await supabase
          .from("user_product_access")
          .select("id, expires_at")
          .eq("user_id", user.id)
          .eq("product_id", productData.id)
          .maybeSingle();

        if (!accessData) {
          setHasAccess(false);
        } else {
          // Check if access has expired
          if (accessData.expires_at) {
            const expirationDate = new Date(accessData.expires_at);
            const now = new Date();
            
            if (now > expirationDate) {
              setHasAccess(false);
              console.log('Access expired on:', expirationDate);
            } else {
              setHasAccess(true);
            }
          } else {
            // No expiration = lifetime access
            setHasAccess(true);
          }
        }
      }

      // Track product access
      if (hasAccess) {
        analytics.productAccess(productSlug);
      }
    } catch (error) {
      console.error("Error checking product access:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-center">Acesso Restrito</CardTitle>
            <CardDescription className="text-center">
              {product?.is_free
                ? "Você precisa estar logado para acessar este material."
                : hasAccess === false && product
                ? "Seu acesso a este material expirou ou você não tem permissão."
                : "Este material está disponível apenas para assinantes premium."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={() => window.location.href = "/materiais"}>
              Ver Todos os Materiais
            </Button>
            {!product?.is_free && (
              <Button variant="outline">Assinar Agora</Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Outlet />;
};
