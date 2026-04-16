import { useState, useEffect } from 'react';

import { Star, Lightbulb, Filter, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/page-loader';

import { PremiumUpgradeModal } from '@/components/materiais/PremiumUpgradeModal';
import { ToolIconGrid } from '@/components/materiais/ToolIconGrid';
import { ToolSuggestionDialog } from '@/components/materiais/ToolSuggestionDialog';

import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';


import { supabase } from '@/integrations/supabase/client';

// Tools relevant per phase — others still show but are deprioritized
const GESTANTE_SLUGS = new Set([
  'controle-enxoval',
  'mala-maternidade',
  'ferramentas-gestacao',
  'guia-alimentacao',
  'calculadora-fraldas',
  'calculadora-semanas',
  'checklist-quartinho',
]);
const POS_PARTO_SLUGS = new Set([
  'rastreador-amamentacao',
  'diario-sono',
  'monitor-desenvolvimento',
  'cartao-vacinacao',
  'recuperacao-pos-parto',
  'guia-alimentacao',
  'checklist-documentos',
  'timer-mamada',
  'diario-crescimento',
  'planejador-rotina',
  'introducao-alimentar',
  'album-marcos',
]);

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

const filterOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'free', label: 'Grátis' },
  { value: 'paid', label: 'Premium' },
  { value: 'my', label: 'Minhas' },
] as const;

type FilterValue = (typeof filterOptions)[number]['value'];

const Materiais = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [userAccess, setUserAccess] = useState<ProductAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [hasClubAccess, setHasClubAccess] = useState(false);
  const [clubPrice, setClubPrice] = useState<number | null>(null);
  const [clubPaymentUrl, setClubPaymentUrl] = useState<string | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const { profile } = useProfile();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const [productsRes, accessRes, clubAccessRes, clubProductRes] = await Promise.all([
        supabase
          .from('products')
          .select(
            'id, title, slug, description, short_description, price, is_active, is_free, display_order, category, thumbnail_url, destination_url, hotmart_product_id, payment_url, access_duration_days, trial_enabled, trial_days'
          )
          .eq('is_active', true)
          .order('display_order'),
        supabase
          .from('user_product_access')
          .select('product_id, expires_at')
          .eq('user_id', user.id),
        supabase
          .from('user_club_access')
          .select('has_active_access')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.from('products').select('price, payment_url').eq('slug', 'clube-premium').single(),
      ]);

      if (productsRes.error) throw productsRes.error;

      setProducts(productsRes.data || []);
      setUserAccess(accessRes.data || []);
      setHasClubAccess(clubAccessRes.data?.has_active_access || false);
      setClubPrice(clubProductRes.data?.price || null);
      setClubPaymentUrl(clubProductRes.data?.payment_url || null);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Erro ao carregar ferramentas', { description: 'Tente novamente mais tarde.' });
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = (productId: string) => {
    const access = userAccess.find(a => a.product_id === productId);
    if (!access) return false;
    if (!access.expires_at) return true;
    return new Date() < new Date(access.expires_at);
  };

  const handleProductClick = async (product: Product) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const navigateToProduct = (url: string | null, slug: string) => {
      if (url?.startsWith('/')) {
        navigate(url);
      } else if (url) {
        window.open(url, '_blank');
      } else {
        navigate(`/materiais/${slug}`);
      }
    };

    if (isAdmin) {
      navigateToProduct(product.destination_url, product.slug);
      return;
    }

    if (product.is_free) {
      if (!hasAccess(product.id)) {
        await supabase
          .from('user_product_access')
          .insert({ user_id: user.id, product_id: product.id });
      }
      navigateToProduct(product.destination_url, product.slug);
      return;
    }

    if (hasAccess(product.id)) {
      navigateToProduct(product.destination_url, product.slug);
    } else {
      // Inline premium modal instead of redirect
      setUpgradeModal({ open: true, product });
    }
  };

  // Infer phase
  const fase = profile?.fase_maternidade || (profile?.delivery_date ? 'pos-parto' : 'gestante');
  const prioritySlugs = fase === 'gestante' ? GESTANTE_SLUGS : POS_PARTO_SLUGS;

  const displayProducts = products
    .filter(p => p.slug !== 'clube-premium')
    .filter(p => {
      if (filter === 'all') return true;
      if (filter === 'free') return p.is_free;
      if (filter === 'paid') return !p.is_free;
      if (filter === 'my') return hasAccess(p.id) || p.is_free;
      return true;
    })
    .sort((a, b) => {
      const aP = prioritySlugs.has(a.slug) ? 0 : 1;
      const bP = prioritySlugs.has(b.slug) ? 0 : 1;
      return aP - bP;
    });

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="container px-4 sm:px-6 py-6 sm:py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">🔧 Ferramentas</h1>
        <p className="text-sm text-muted-foreground mt-1">Toque para abrir. Cadeado = premium.</p>
      </div>

      {/* Premium banner compacto */}
      {!hasClubAccess && clubPrice && (
        <button
          onClick={() => setUpgradeModal({ open: true, product: null })}
          className="w-full mb-6 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 text-left transition-all hover:border-primary/50 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">
                Clube Premium — R$ {clubPrice.toFixed(2)}/mês
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Desbloqueie todas as{' '}
                {products.filter(p => !p.is_free && p.slug !== 'clube-premium').length} ferramentas
                premium
              </p>
            </div>
            <Badge className="bg-primary text-primary-foreground text-[10px] shrink-0">VER</Badge>
          </div>
        </button>
      )}

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        {filterOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              filter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Blog access card */}
      <button
        onClick={() => navigate('/blog')}
        className="w-full mb-5 p-3 rounded-xl bg-accent/50 border border-border/50 text-left transition-all hover:bg-accent active:scale-[0.99] flex items-center gap-3"
      >
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">📖 Blog Mãe Consciente</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Artigos sobre gestação, parto e maternidade
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>

      {/* Tool icon grid */}
      <ToolIconGrid
        products={displayProducts}
        hasAccess={hasAccess}
        isAdmin={isAdmin}
        onProductClick={handleProductClick}
      />

      {displayProducts.length === 0 && (
        <EmptyState
          icon={Filter}
          title="Nenhuma ferramenta encontrada"
          description="Tente ajustar os filtros de busca"
          action={{ label: 'Limpar Filtros', onClick: () => setFilter('all') }}
        />
      )}

      {/* Suggestion button */}
      <div className="mt-8 text-center">
        <Button variant="outline" onClick={() => setSuggestionOpen(true)} className="gap-2">
          <Lightbulb className="h-4 w-4" />
          Sugerir ferramenta
        </Button>
      </div>

      {/* Premium upgrade modal (inline) */}
      <PremiumUpgradeModal
        open={upgradeModal.open}
        onOpenChange={open => setUpgradeModal({ open, product: upgradeModal.product })}
        productTitle={upgradeModal.product?.title || 'Premium'}
        productPrice={upgradeModal.product?.price || null}
        paymentUrl={upgradeModal.product?.payment_url || null}
        clubPrice={clubPrice}
        clubPaymentUrl={clubPaymentUrl}
        includedCount={products.filter(p => p.slug !== 'clube-premium').length}
      />

      {/* Tool suggestion dialog */}
      <ToolSuggestionDialog open={suggestionOpen} onOpenChange={setSuggestionOpen} />
    </div>
  );
};

export default Materiais;
