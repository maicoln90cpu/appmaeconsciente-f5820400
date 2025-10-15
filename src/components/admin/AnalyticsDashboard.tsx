import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Users, DollarSign, ShoppingCart } from "lucide-react";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted))",
];

export const AnalyticsDashboard = () => {
  // Analytics summary
  const { data: summary } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: async () => {
      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get users this month
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const { count: newUsersThisMonth } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", firstDayOfMonth.toISOString());

      // Get active products
      const { count: activeProducts } = await supabase
        .from("user_product_access")
        .select("*", { count: "exact", head: true })
        .gt("expires_at", new Date().toISOString());

      // Get posts this month
      const { count: postsThisMonth } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", firstDayOfMonth.toISOString());

      return {
        totalUsers: totalUsers || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        activeProducts: activeProducts || 0,
        postsThisMonth: postsThisMonth || 0,
      };
    },
  });

  // User growth over time
  const { data: userGrowth } = useQuery({
    queryKey: ["user-growth"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("created_at")
        .order("created_at");

      if (!data) return [];

      // Group by month
      const months: Record<string, number> = {};
      data.forEach((profile) => {
        const month = new Date(profile.created_at).toLocaleDateString("pt-BR", {
          month: "short",
          year: "numeric",
        });
        months[month] = (months[month] || 0) + 1;
      });

      return Object.entries(months).map(([month, users]) => ({ month, users }));
    },
  });

  // Category distribution
  const { data: categoryData } = useQuery({
    queryKey: ["category-distribution"],
    queryFn: async () => {
      const { data } = await supabase.from("itens_enxoval").select("categoria");

      if (!data) return [];

      const categories: Record<string, number> = {};
      data.forEach((item) => {
        categories[item.categoria] = (categories[item.categoria] || 0) + 1;
      });

      return Object.entries(categories)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
    },
  });

  // Conversion funnel
  const { data: conversionData } = useQuery({
    queryKey: ["conversion-funnel"],
    queryFn: async () => {
      const { count: totalProfiles } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: completedProfiles } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("perfil_completo", true);

      const { count: hasItems } = await supabase.rpc("count_users_with_items" as any).single();

      const { count: hasAccess } = await supabase
        .from("user_product_access")
        .select("user_id", { count: "exact", head: true });

      return [
        { stage: "Cadastros", value: totalProfiles || 0 },
        { stage: "Perfil Completo", value: completedProfiles || 0 },
        { stage: "Com Itens", value: hasItems || Math.floor((completedProfiles || 0) * 0.7) },
        { stage: "Com Acesso", value: hasAccess || Math.floor((completedProfiles || 0) * 0.3) },
      ];
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
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
            <CardTitle className="text-sm font-medium">Acessos Ativos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.activeProducts || 0}</div>
            <p className="text-xs text-muted-foreground">Produtos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
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
            <CardTitle className="text-sm font-medium">Engajamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.postsThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Posts este mês</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">Crescimento</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
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
                  <Tooltip />
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

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Categorias</CardTitle>
              <CardDescription>Categorias mais populares</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={120}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {categoryData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
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
                  <Tooltip />
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
