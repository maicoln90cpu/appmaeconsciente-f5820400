import { useEffect, useState } from 'react';

import { Loader2, Lock } from 'lucide-react';
import { Navigate, Outlet, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


import { analytics } from '@/lib/analytics';
import { logger } from '@/lib/logger';

import { supabase } from '@/integrations/supabase/client';


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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // ✅ VERIFICAR ADMIN PRIMEIRO (ANTES DE TUDO)
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (userRole) {
        logger.debug('Admin detectado - acesso liberado');
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // 🌟 VERIFICAR CLUBE PREMIUM (ACESSO A TODOS OS MATERIAIS)
      const { data: clubAccess } = await supabase
        .from('user_club_access')
        .select('has_active_access')
        .eq('user_id', user.id)
        .maybeSingle();

      if (clubAccess?.has_active_access) {
        logger.debug('Clube Premium ativo - acesso liberado a todos os materiais');
        setHasAccess(true);
        setLoading(false);
        return;
      }

      const { data: productData } = await supabase
        .from('products')
        .select(
          'id, title, slug, description, price, is_active, is_free, destination_url, payment_url, trial_enabled, trial_days'
        )
        .eq('slug', productSlug)
        .single();

      if (!productData) {
        setLoading(false);
        return;
      }

      setProduct(productData);

      if (productData.is_free) {
        // Auto-grant access for free products
        const { data: existingAccess } = await supabase
          .from('user_product_access')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', productData.id)
          .maybeSingle();

        if (!existingAccess) {
          await supabase.from('user_product_access').insert({
            user_id: user.id,
            product_id: productData.id,
          });
        }

        setHasAccess(true);
      } else {
        const { data: accessData } = await supabase
          .from('user_product_access')
          .select('id, expires_at')
          .eq('user_id', user.id)
          .eq('product_id', productData.id)
          .maybeSingle();

        if (!accessData) {
          setHasAccess(false);
          setProduct({ ...productData, access_data: null });
        } else {
          // Check if access has expired
          if (accessData.expires_at) {
            const expirationDate = new Date(accessData.expires_at);
            const now = new Date();

            if (now > expirationDate) {
              setHasAccess(false);
              setProduct({ ...productData, access_data: accessData });
              logger.debug('Access expired on:', { data: { expirationDate } });
            } else {
              setHasAccess(true);
            }
          } else {
            // No expiration = lifetime access
            setHasAccess(true);
          }
        }
      }

      // Track product access and log
      if (hasAccess) {
        analytics.productAccess(productSlug);

        // Registrar acesso para auditoria
        if (productData) {
          try {
            await supabase.from('user_access_logs').insert({
              user_id: user.id,
              product_id: productData.id,
            });
          } catch (err) {
            logger.debug('Log access error (non-critical)', { data: err });
          }
        }
      }
    } catch (error) {
      console.error('Error checking product access:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    const accessData = product?.access_data;
    const isExpired =
      accessData && accessData.expires_at && new Date() > new Date(accessData.expires_at);

    return (
      <div className="flex items-center justify-center p-4 min-h-[50vh]">
        <Card className="max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-center">
              {isExpired ? 'Acesso Expirado' : 'Acesso Restrito'}
            </CardTitle>
            <CardDescription className="text-center">
              {product?.is_free
                ? 'Você precisa estar logado para acessar este material.'
                : isExpired
                  ? `Seu acesso a este material expirou${accessData.expires_at ? ` em ${new Date(accessData.expires_at).toLocaleDateString()}` : ''}.`
                  : 'Este material está disponível apenas para assinantes.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={() => (window.location.href = '/materiais')}>
              Ver Todos os Materiais
            </Button>
            {!product?.is_free && product?.payment_url && (
              <Button variant="default" onClick={() => window.open(product.payment_url, '_blank')}>
                {isExpired ? 'Renovar Acesso' : 'Comprar Agora'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Outlet />;
};
