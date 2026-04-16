import { useEffect, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Package,
  TrendingUp,
  Calendar,
  ArrowLeft,
  LayoutDashboard,
  ShoppingBag,
  MessageSquare,
  Headphones,
  Settings,
  FileText,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSubTabs } from "@/components/admin/AdminSubTabs";

// Lazy load all admin components
const HotmartMappings = lazy(() => import("@/components/admin/HotmartMappings").then((m) => ({ default: m.HotmartMappings })));
const HotmartTransactions = lazy(() => import("@/components/admin/HotmartTransactions").then((m) => ({ default: m.HotmartTransactions })));
const ManualPurchaseResend = lazy(() => import("@/components/admin/ManualPurchaseResend").then((m) => ({ default: m.ManualPurchaseResend })));
const PostModeration = lazy(() => import("@/components/admin/PostModeration").then((m) => ({ default: m.PostModeration })));
const TicketManagement = lazy(() => import("@/components/admin/TicketManagement").then((m) => ({ default: m.TicketManagement })));
const ProductManagement = lazy(() => import("@/components/admin/ProductManagement").then((m) => ({ default: m.ProductManagement })));
const UserManagement = lazy(() => import("@/components/admin/UserManagement").then((m) => ({ default: m.UserManagement })));
const PromotionManagement = lazy(() => import("@/components/admin/PromotionManagement").then((m) => ({ default: m.PromotionManagement })));
const CouponManagement = lazy(() => import("@/components/admin/CouponManagement").then((m) => ({ default: m.CouponManagement })));
const AnalyticsDashboard = lazy(() => import("@/components/admin/AnalyticsDashboard").then((m) => ({ default: m.AnalyticsDashboard })));
const BundleManagement = lazy(() => import("@/components/admin/BundleManagement").then((m) => ({ default: m.BundleManagement })));
const ToolSuggestionManagement = lazy(() => import("@/components/admin/ToolSuggestionManagement").then((m) => ({ default: m.ToolSuggestionManagement })));
const SiteSettings = lazy(() => import("@/components/admin/SiteSettings").then((m) => ({ default: m.SiteSettings })));
const SecurityAuditPanel = lazy(() => import("@/components/admin/SecurityAuditPanel").then((m) => ({ default: m.SecurityAuditPanel })));
const AdminCharts = lazy(() => import("@/components/admin/AdminCharts").then((m) => ({ default: m.AdminCharts })));
const AppHealthDashboard = lazy(() => import("@/components/admin/AppHealthDashboard").then((m) => ({ default: m.AppHealthDashboard })));
const SystemHealthTab = lazy(() => import("@/components/admin/system/SystemHealthTab").then((m) => ({ default: m.SystemHealthTab })));
const ObservabilityTab = lazy(() => import("@/components/admin/system/ObservabilityTab").then((m) => ({ default: m.ObservabilityTab })));
const DatabaseTab = lazy(() => import("@/components/admin/system/DatabaseTab").then((m) => ({ default: m.DatabaseTab })));
const GtmDiagnosticTab = lazy(() => import("@/components/admin/system/GtmDiagnosticTab").then((m) => ({ default: m.GtmDiagnosticTab })));
const AIEngagementPanel = lazy(() => import("@/components/admin/AIEngagementPanel").then((m) => ({ default: m.AIEngagementPanel })));
const VirtualUserManagement = lazy(() => import("@/components/admin/VirtualUserManagement").then((m) => ({ default: m.VirtualUserManagement })));
const AutoModerationPanel = lazy(() => import("@/components/admin/AutoModerationPanel").then((m) => ({ default: m.AutoModerationPanel })));
const CronSchedulePanel = lazy(() => import("@/components/admin/CronSchedulePanel").then((m) => ({ default: m.CronSchedulePanel })));
const AdminNotificationCard = lazy(() => import("@/components/admin/AdminNotificationCard").then((m) => ({ default: m.AdminNotificationCard })));
const BlogPostManagement = lazy(() => import("@/components/admin/BlogPostManagement").then((m) => ({ default: m.BlogPostManagement })));
const BlogSettingsPanel = lazy(() => import("@/components/admin/BlogSettingsPanel").then((m) => ({ default: m.BlogSettingsPanel })));
const BlogGenerationLogs = lazy(() => import("@/components/admin/BlogGenerationLogs").then((m) => ({ default: m.BlogGenerationLogs })));
const BlogImagePrompts = lazy(() => import("@/components/admin/BlogImagePrompts").then((m) => ({ default: m.BlogImagePrompts })));
const BlogCronPanel = lazy(() => import("@/components/admin/BlogCronPanel").then((m) => ({ default: m.BlogCronPanel })));

const TabLoading = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
  </div>
);

export default function AdminDashboard() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { stats, loading } = useAdminStats(isAdmin);

  const activeTab = searchParams.get("tab") || "dashboard";

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/materiais");
    }
  }, [isAdmin, roleLoading, navigate]);

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">{stats?.activeUsers || 0} ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
              <p className="text-xs text-muted-foreground">Todos os usuários</p>
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
              <div className="text-2xl font-bold">{Math.round((stats?.totalItems || 0) / (stats?.totalUsers || 1))}</div>
              <p className="text-xs text-muted-foreground">Itens por usuário</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(val) => navigate(`/admin?tab=${val}`)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 h-auto p-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 py-3">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="comercial" className="flex items-center gap-2 py-3">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Comercial</span>
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-2 py-3">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Blog</span>
            </TabsTrigger>
            <TabsTrigger value="comunidade" className="flex items-center gap-2 py-3">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Comunidade</span>
            </TabsTrigger>
            <TabsTrigger value="atendimento" className="flex items-center gap-2 py-3">
              <Headphones className="h-4 w-4" />
              <span className="hidden sm:inline">Atendimento</span>
            </TabsTrigger>
            <TabsTrigger value="sistema" className="flex items-center gap-2 py-3">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Sistema</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Suspense fallback={<TabLoading />}>
              <AdminSubTabs
                defaultValue="analytics"
                tabs={[
                  { value: "analytics", label: "Analytics", content: <AnalyticsDashboard /> },
                  {
                    value: "charts",
                    label: "Gráficos",
                    content: <AdminCharts categoryData={stats?.categoryData || []} weeklyGrowth={stats?.weeklyGrowth || []} />,
                  },
                  { value: "health", label: "Saúde do App", content: <AppHealthDashboard /> },
                ]}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="comercial">
            <Suspense fallback={<TabLoading />}>
              <AdminSubTabs
                defaultValue="products"
                tabs={[
                  { value: "products", label: "Produtos", content: <ProductManagement /> },
                  { value: "bundles", label: "Bundles", content: <BundleManagement /> },
                  { value: "promotions", label: "Promoções", content: <PromotionManagement /> },
                  { value: "coupons", label: "Cupons", content: <CouponManagement /> },
                  {
                    value: "hotmart",
                    label: "Hotmart",
                    content: (
                      <div className="space-y-4">
                        <ManualPurchaseResend />
                        <HotmartMappings />
                        <HotmartTransactions />
                      </div>
                    ),
                  },
                ]}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="blog">
            <Suspense fallback={<TabLoading />}>
              <AdminSubTabs
                defaultValue="posts"
                tabs={[
                  { value: "posts", label: "Posts", content: <BlogPostManagement /> },
                  { value: "settings", label: "Configurações", content: <BlogSettingsPanel /> },
                  { value: "images", label: "Estilos de Imagem", content: <BlogImagePrompts /> },
                  { value: "schedule", label: "Agendamento", content: <BlogCronPanel /> },
                  { value: "logs", label: "Logs de Geração", content: <BlogGenerationLogs /> },
                ]}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="comunidade">
            <Suspense fallback={<TabLoading />}>
              <AdminSubTabs
                defaultValue="posts"
                tabs={[
                  { value: "posts", label: "Moderação de Posts", content: <PostModeration /> },
                  { value: "virtual-users", label: "Usuários Virtuais", content: <VirtualUserManagement /> },
                  { value: "ai-engagement", label: "Automação IA", content: <AIEngagementPanel /> },
                  { value: "cron-schedule", label: "Agendamento", content: <CronSchedulePanel /> },
                  { value: "auto-moderation", label: "Auto-Moderação", content: <AutoModerationPanel /> },
                  { value: "suggestions", label: "Sugestões", content: <ToolSuggestionManagement /> },
                ]}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="atendimento">
            <Suspense fallback={<TabLoading />}>
              <AdminSubTabs
                defaultValue="tickets"
                tabs={[
                  { value: "tickets", label: "Tickets", content: <TicketManagement /> },
                  { value: "notifications", label: "Notificações", content: <AdminNotificationCard /> },
                ]}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="sistema">
            <Suspense fallback={<TabLoading />}>
              <AdminSubTabs
                defaultValue="health"
                tabs={[
                  { value: "health", label: "Saúde", content: <SystemHealthTab /> },
                  { value: "observability", label: "Observabilidade", content: <ObservabilityTab /> },
                  { value: "database", label: "Banco de Dados", content: <DatabaseTab /> },
                  { value: "users", label: "Usuários", content: <UserManagement /> },
                  { value: "security", label: "Segurança", content: <SecurityAuditPanel /> },
                  { value: "settings", label: "Configurações", content: <SiteSettings /> },
                  { value: "gtm", label: "GTM / Diag.", content: <GtmDiagnosticTab /> },
                ]}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
