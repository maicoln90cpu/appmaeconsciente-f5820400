import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Package, 
  TrendingUp, 
  Calendar,
  Send,
  ArrowLeft
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HotmartMappings } from "@/components/admin/HotmartMappings";
import { HotmartTransactions } from "@/components/admin/HotmartTransactions";
import { ManualPurchaseResend } from "@/components/admin/ManualPurchaseResend";
import { PostModeration } from "@/components/admin/PostModeration";
import { TicketManagement } from "@/components/admin/TicketManagement";
import { ProductManagement } from "@/components/admin/ProductManagement";
import { UserManagement } from "@/components/admin/UserManagement";
import { PromotionManagement } from "@/components/admin/PromotionManagement";
import { CouponManagement } from "@/components/admin/CouponManagement";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { BundleManagement } from "@/components/admin/BundleManagement";
import { ToolSuggestionManagement } from "@/components/admin/ToolSuggestionManagement";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Stats {
  totalUsers: number;
  totalItems: number;
  itemsThisMonth: number;
  activeUsers: number;
  categoryData: Array<{ name: string; value: number }>;
  weeklyGrowth: Array<{ week: string; items: number; users: number }>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

export default function AdminDashboard() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ title: "", message: "" });
  const [sending, setSending] = useState(false);
  
  const activeTab = searchParams.get("tab") || "charts";

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/materiais");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total items
      const { count: totalItems } = await supabase
        .from('itens_enxoval')
        .select('*', { count: 'exact', head: true });

      // Get items this month
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const { count: itemsThisMonth } = await supabase
        .from('itens_enxoval')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth.toISOString());

      // Get category distribution
      const { data: categoryData } = await supabase
        .from('itens_enxoval')
        .select('categoria');

      const categoryCounts: Record<string, number> = {};
      categoryData?.forEach((item) => {
        categoryCounts[item.categoria] = (categoryCounts[item.categoria] || 0) + 1;
      });

      const topCategories = Object.entries(categoryCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Mock weekly growth data (you can implement actual weekly queries)
      const weeklyGrowth = [
        { week: 'Sem 1', items: 12, users: 3 },
        { week: 'Sem 2', items: 18, users: 5 },
        { week: 'Sem 3', items: 25, users: 7 },
        { week: 'Sem 4', items: 30, users: 8 },
      ];

      setStats({
        totalUsers: totalUsers || 0,
        totalItems: totalItems || 0,
        itemsThisMonth: itemsThisMonth || 0,
        activeUsers: Math.floor((totalUsers || 0) * 0.7), // Mock: 70% active
        categoryData: topCategories,
        weeklyGrowth,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Erro ao carregar estatísticas",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notification.title || !notification.message) {
      toast({
        title: "Preencha todos os campos",
        description: "Título e mensagem são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Passo 1: Criar notificação
      const { data: notificationData, error } = await supabase
        .from('notifications')
        .insert({
          title: notification.title,
          message: notification.message,
          created_by: user.id,
          is_global: true,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Notificação criada:', notificationData.id);

      // Passo 2: Buscar todos os usuários (exceto criador)
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', user.id);

      if (usersError) throw usersError;

      console.log('Total de usuários a notificar:', allUsers?.length);

      // Passo 3: Criar user_notifications para cada usuário
      if (allUsers && allUsers.length > 0) {
        const userNotifications = allUsers.map(u => ({
          user_id: u.id,
          notification_id: notificationData.id,
        }));

        const { error: insertError } = await supabase
          .from('user_notifications')
          .insert(userNotifications);

        if (insertError) {
          console.error('Erro ao criar user_notifications:', insertError);
          throw insertError;
        }

        console.log('User notifications criadas com sucesso!');
      }

      toast({
        title: "Notificação enviada!",
        description: `${allUsers?.length || 0} usuários foram notificados.`,
      });

      setNotification({ title: "", message: "" });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Erro ao enviar notificação",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Painel do Administrador</h1>
            <p className="text-muted-foreground">Visão geral do sistema</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeUsers || 0} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
              <p className="text-xs text-muted-foreground">
                Todos os usuários
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Itens este Mês</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.itemsThisMonth || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{Math.round(((stats?.itemsThisMonth || 0) / (stats?.totalItems || 1)) * 100)}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média por Usuário</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((stats?.totalItems || 0) / (stats?.totalUsers || 1))}
              </div>
              <p className="text-xs text-muted-foreground">
                Itens por usuário
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={(val) => navigate(`/admin?tab=${val}`)} className="space-y-4">
          <TabsList className="grid grid-cols-11 w-full">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="bundles">Bundles</TabsTrigger>
            <TabsTrigger value="promotions">Promoções</TabsTrigger>
            <TabsTrigger value="coupons">Cupons</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="hotmart">Hotmart</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="charts" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Categorias</CardTitle>
                  <CardDescription>Categorias mais utilizadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats?.categoryData || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => entry.name}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {stats?.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Crescimento Semanal</CardTitle>
                  <CardDescription>Itens e usuários por semana</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats?.weeklyGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="items" stroke="hsl(var(--primary))" name="Itens" />
                      <Line type="monotone" dataKey="users" stroke="hsl(var(--secondary))" name="Usuários" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Categorias</CardTitle>
                <CardDescription>Comparação entre categorias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.categoryData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="hsl(var(--primary))" name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="bundles">
            <BundleManagement />
          </TabsContent>

          <TabsContent value="promotions">
            <PromotionManagement />
          </TabsContent>

          <TabsContent value="coupons">
            <CouponManagement />
          </TabsContent>

          <TabsContent value="tickets">
            <TicketManagement />
          </TabsContent>

          <TabsContent value="suggestions">
            <ToolSuggestionManagement />
          </TabsContent>

          <TabsContent value="posts">
            <PostModeration />
          </TabsContent>

          <TabsContent value="hotmart" className="space-y-4">
            <ManualPurchaseResend />
            <HotmartMappings />
            <HotmartTransactions />
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Enviar Notificação</CardTitle>
                <CardDescription>
                  Envie uma mensagem para todos os usuários do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={notification.title}
                    onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                    placeholder="Título da notificação"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea
                    id="message"
                    value={notification.message}
                    onChange={(e) => setNotification({ ...notification, message: e.target.value })}
                    placeholder="Conteúdo da mensagem..."
                    rows={5}
                  />
                </div>
                <Button onClick={handleSendNotification} disabled={sending} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? "Enviando..." : "Enviar para Todos"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
