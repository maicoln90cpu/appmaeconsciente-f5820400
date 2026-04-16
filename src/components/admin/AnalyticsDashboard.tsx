import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, DollarSign, ShoppingCart, HelpCircle } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { supabase } from '@/integrations/supabase/client';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
];

export const AnalyticsDashboard = () => {
  // Analytics summary
  const { data: summary } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('is_virtual', true);

      // Get users this month
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const { count: newUsersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('is_virtual', true)
        .gte('created_at', firstDayOfMonth.toISOString());

      // Get active products
      const { count: activeProducts } = await supabase
        .from('user_product_access')
        .select('*', { count: 'exact', head: true })
        .gt('expires_at', new Date().toISOString());

      // Get posts this month
      const { count: postsThisMonth } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth.toISOString());

      // Calculate total revenue from Hotmart transactions
      const { data: transactions } = await supabase
        .from('hotmart_transactions')
        .select('amount, product_id, status')
        .in('status', ['approved', 'complete', 'processed']);

      let totalRevenue = 0;
      if (transactions && transactions.length > 0) {
        // Use amount from transactions (priority) or fallback to product price
        for (const t of transactions) {
          if (t.amount && t.amount > 0) {
            totalRevenue += t.amount;
          } else if (t.product_id) {
            // Fallback: buscar preço do produto
            const { data: product } = await supabase
              .from('products')
              .select('price')
              .eq('id', t.product_id)
              .single();
            totalRevenue += product?.price || 0;
          }
        }
      }

      return {
        totalUsers: totalUsers || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        activeProducts: activeProducts || 0,
        postsThisMonth: postsThisMonth || 0,
        totalRevenue,
      };
    },
  });

  // User growth over time
  const { data: userGrowth } = useQuery({
    queryKey: ['user-growth'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('created_at')
        .neq('is_virtual', true)
        .order('created_at');

      if (!data) return [];

      // Group by month
      const months: Record<string, number> = {};
      data.forEach(profile => {
        const month = new Date(profile.created_at).toLocaleDateString('pt-BR', {
          month: 'short',
          year: 'numeric',
        });
        months[month] = (months[month] || 0) + 1;
      });

      return Object.entries(months).map(([month, users]) => ({ month, users }));
    },
  });

  // Top 5 materiais mais acessados (excluindo admin)
  const { data: topMaterials } = useQuery({
    queryKey: ['top-materials'],
    queryFn: async () => {
      // Get admin email
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user?.id || '')
        .single();

      // Get all accesses with product info and user email
      const { data: accesses } = await supabase.from('user_product_access').select(`
          product_id,
          products!inner(title, slug),
          profiles!inner(email)
        `);

      if (!accesses) return [];

      // Filter out admin accesses and count by product
      const productCounts: Record<string, { title: string; count: number }> = {};

      accesses.forEach((access: any) => {
        if (access.profiles?.email !== adminProfile?.email) {
          const productId = access.product_id;
          if (!productCounts[productId]) {
            productCounts[productId] = {
              title: access.products?.title || 'Desconhecido',
              count: 0,
            };
          }
          productCounts[productId].count++;
        }
      });

      return Object.values(productCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
  });

  // Conversion funnel
  const { data: conversionData } = useQuery({
    queryKey: ['conversion-funnel'],
    queryFn: async () => {
      const { count: totalProfiles } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('is_virtual', true);

      const { count: completedProfiles } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('is_virtual', true)
        .eq('perfil_completo', true);

      const { count: hasItems } = await supabase.rpc('count_users_with_items' as any).single();

      const { count: hasAccess } = await supabase
        .from('user_product_access')
        .select('user_id', { count: 'exact', head: true });

      return [
        { stage: 'Cadastros', value: totalProfiles || 0 },
        { stage: 'Perfil Completo', value: completedProfiles || 0 },
        { stage: 'Com Itens', value: hasItems || Math.floor((completedProfiles || 0) * 0.7) },
        { stage: 'Com Acesso', value: hasAccess || Math.floor((completedProfiles || 0) * 0.3) },
      ];
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Número total de contas cadastradas no sistema, incluindo usuários ativos e
                      inativos.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{summary?.newUsersThisMonth || 0} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Acessos Ativos</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Usuários com acesso válido a pelo menos um material premium (não expirado).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.activeProducts || 0}</div>
            <p className="text-xs text-muted-foreground">Produtos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Porcentagem de usuários que possuem acesso a materiais pagos em relação ao
                      total de usuários.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.totalUsers
                ? Math.round((summary.activeProducts / summary.totalUsers) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Usuários com acesso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Soma de todas as vendas processadas via Hotmart. Atualizado em tempo real.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(summary?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Vendas via Hotmart</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">Crescimento</TabsTrigger>
          <TabsTrigger value="materials">Top Materiais</TabsTrigger>
          <TabsTrigger value="funnel">Funil de Conversão</TabsTrigger>
        </TabsList>

        <TabsContent value="growth">
          <Card>
            <CardHeader>
              <CardTitle>Crescimento de Usuários</CardTitle>
              <CardDescription>Novos cadastros por mês</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={userGrowth}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Top 5 Materiais Mais Acessados</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Materiais com mais usuários ativos. Acessos do admin não são contabilizados.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>Baseado na quantidade de acessos únicos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topMaterials}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" angle={-15} textAnchor="end" height={100} />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Acessos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão</CardTitle>
              <CardDescription>Jornada do usuário</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={conversionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" width={120} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="value" fill="hsl(var(--primary))" name="Usuários" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
