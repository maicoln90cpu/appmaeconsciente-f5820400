import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import { 
  Users, 
  Package, 
  TrendingUp, 
  Calendar,
  Send,
  ArrowLeft
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Lazy load all admin components
const HotmartMappings = lazy(() => import("@/components/admin/HotmartMappings").then(m => ({ default: m.HotmartMappings })));
const HotmartTransactions = lazy(() => import("@/components/admin/HotmartTransactions").then(m => ({ default: m.HotmartTransactions })));
const ManualPurchaseResend = lazy(() => import("@/components/admin/ManualPurchaseResend").then(m => ({ default: m.ManualPurchaseResend })));
const PostModeration = lazy(() => import("@/components/admin/PostModeration").then(m => ({ default: m.PostModeration })));
const TicketManagement = lazy(() => import("@/components/admin/TicketManagement").then(m => ({ default: m.TicketManagement })));
const ProductManagement = lazy(() => import("@/components/admin/ProductManagement").then(m => ({ default: m.ProductManagement })));
const UserManagement = lazy(() => import("@/components/admin/UserManagement").then(m => ({ default: m.UserManagement })));
const PromotionManagement = lazy(() => import("@/components/admin/PromotionManagement").then(m => ({ default: m.PromotionManagement })));
const CouponManagement = lazy(() => import("@/components/admin/CouponManagement").then(m => ({ default: m.CouponManagement })));
const AnalyticsDashboard = lazy(() => import("@/components/admin/AnalyticsDashboard").then(m => ({ default: m.AnalyticsDashboard })));
const BundleManagement = lazy(() => import("@/components/admin/BundleManagement").then(m => ({ default: m.BundleManagement })));
const ToolSuggestionManagement = lazy(() => import("@/components/admin/ToolSuggestionManagement").then(m => ({ default: m.ToolSuggestionManagement })));
const SiteSettings = lazy(() => import("@/components/admin/SiteSettings").then(m => ({ default: m.SiteSettings })));
const SecurityAuditPanel = lazy(() => import("@/components/admin/SecurityAuditPanel").then(m => ({ default: m.SecurityAuditPanel })));
const AdminCharts = lazy(() => import("@/components/admin/AdminCharts").then(m => ({ default: m.AdminCharts })));

// Loading fallback component
const TabLoading = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
  </div>
);

interface Stats {
  totalUsers: number;
  totalItems: number;
  itemsThisMonth: number;
  activeUsers: number;
  categoryData: Array<{ name: string; value: number }>;
  weeklyGrowth: Array<{ week: string; items: number; users: number }>;
}

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
      logger.error("Error loading stats", error, { context: "AdminDashboard" });
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

      logger.debug("Notificação criada", { context: "AdminDashboard", data: { id: notificationData.id } });

      // Passo 2: Buscar todos os usuários (exceto criador)
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', user.id);

      if (usersError) throw usersError;

      logger.debug("Total de usuários a notificar", { context: "AdminDashboard", data: { count: allUsers?.length } });

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
          logger.error("Erro ao criar user_notifications", insertError, { context: "AdminDashboard" });
          throw insertError;
        }

        logger.debug("User notifications criadas com sucesso", { context: "AdminDashboard" });
      }

      toast({
        title: "Notificação enviada!",
        description: `${allUsers?.length || 0} usuários foram notificados.`,
      });

      setNotification({ title: "", message: "" });
    } catch (error) {
      logger.error("Error sending notification", error, { context: "AdminDashboard" });
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
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
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
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <Suspense fallback={<TabLoading />}>
              <AnalyticsDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="security">
            <Suspense fallback={<TabLoading />}>
              <SecurityAuditPanel />
            </Suspense>
          </TabsContent>

          <TabsContent value="charts">
            <Suspense fallback={<TabLoading />}>
              <AdminCharts 
                categoryData={stats?.categoryData || []}
                weeklyGrowth={stats?.weeklyGrowth || []}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="users">
            <Suspense fallback={<TabLoading />}>
              <UserManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="products">
            <Suspense fallback={<TabLoading />}>
              <ProductManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="bundles">
            <Suspense fallback={<TabLoading />}>
              <BundleManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="promotions">
            <Suspense fallback={<TabLoading />}>
              <PromotionManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="coupons">
            <Suspense fallback={<TabLoading />}>
              <CouponManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="tickets">
            <Suspense fallback={<TabLoading />}>
              <TicketManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="suggestions">
            <Suspense fallback={<TabLoading />}>
              <ToolSuggestionManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="posts">
            <Suspense fallback={<TabLoading />}>
              <PostModeration />
            </Suspense>
          </TabsContent>

          <TabsContent value="hotmart" className="space-y-4">
            <Suspense fallback={<TabLoading />}>
              <ManualPurchaseResend />
              <HotmartMappings />
              <HotmartTransactions />
            </Suspense>
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

          <TabsContent value="settings">
            <Suspense fallback={<TabLoading />}>
              <SiteSettings />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
