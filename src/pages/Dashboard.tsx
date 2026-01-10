import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight,
  Award,
  Baby, 
  Bell,
  Calendar, 
  Heart,
  Moon,
  Sparkles,
  Syringe,
  TrendingUp,
  Utensils,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingWizard, OnboardingChecklist } from "@/components/onboarding";
import { LevelProgress, ActivityCalendar, WeeklyGoalCard, DailyLoginTracker } from "@/components/gamification";
import { ActionableInsights, CrossModuleInsights } from "@/components/insights";
import { format, differenceInDays, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  type: "vaccine" | "appointment" | "reminder";
  urgent?: boolean;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  time: string;
}

const DAILY_TIPS = [
  "Beba pelo menos 2 litros de água por dia para manter-se hidratada! 💧",
  "Descanse sempre que possível - seu corpo está trabalhando duro! 😴",
  "Movimente-se com caminhadas leves para melhorar a circulação 🚶‍♀️",
  "Alimentos ricos em ferro ajudam a prevenir anemia na gestação 🥬",
  "Lembre-se de fazer suas vitaminas pré-natais diariamente 💊",
  "Converse com seu bebê - ele já consegue ouvir sua voz! 💕",
  "Pratique exercícios de respiração para relaxar 🧘‍♀️",
  "Evite ficar muito tempo em pé ou sentada na mesma posição",
  "Coma pequenas porções várias vezes ao dia para evitar enjoos 🍎",
  "Registre os movimentos do bebê - é importante para o acompanhamento 📝",
];

const Dashboard = () => {
  const [showWizard, setShowWizard] = useState(false);
  const { profile } = useProfile();
  const { user } = useAuth();
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [dailyTip] = useState(() => DAILY_TIPS[Math.floor(Math.random() * DAILY_TIPS.length)]);
  const [loading, setLoading] = useState(true);

  // Show onboarding wizard for new users
  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      const dismissed = localStorage.getItem("onboarding_wizard_dismissed");
      if (!dismissed) {
        setShowWizard(true);
      }
    }
  }, [profile]);

  // Load personalized data
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Get today's feeding logs count
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { count: feedingCount } = await supabase
        .from("baby_feeding_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString());

      // Get today's sleep logs
      const { count: sleepCount } = await supabase
        .from("baby_sleep_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString());

      // Get upcoming vaccinations
      const { data: vaccines } = await supabase
        .from("baby_vaccinations")
        .select("vaccine_name, application_date")
        .eq("user_id", user.id)
        .gte("application_date", new Date().toISOString().split("T")[0])
        .order("application_date")
        .limit(3);

      // Get upcoming appointments
      const { data: appointments } = await supabase
        .from("baby_appointments")
        .select("id, title, scheduled_date, appointment_type")
        .eq("user_id", user.id)
        .eq("completed", false)
        .gte("scheduled_date", new Date().toISOString().split("T")[0])
        .order("scheduled_date")
        .limit(3);

      // Get recent activities (last 5)
      const { data: recentFeedings } = await supabase
        .from("baby_feeding_logs")
        .select("id, feeding_type, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      const { data: recentSleep } = await supabase
        .from("baby_sleep_logs")
        .select("id, sleep_type, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(2);

      // Build quick stats
      const stats: QuickStat[] = [
        {
          label: "Mamadas Hoje",
          value: feedingCount || 0,
          icon: Heart,
          color: "text-pink-500",
        },
        {
          label: "Sonecas Hoje",
          value: sleepCount || 0,
          icon: Moon,
          color: "text-indigo-500",
        },
      ];

      // Get milestone count
      const { count: milestonesCount } = await supabase
        .from("baby_milestone_records")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "achieved");

      stats.push({
        label: "Marcos Alcançados",
        value: milestonesCount || 0,
        icon: Award,
        color: "text-amber-500",
      });

      setQuickStats(stats);

      // Build upcoming events
      const events: UpcomingEvent[] = [];
      
      appointments?.forEach((apt) => {
        const daysUntil = differenceInDays(parseISO(apt.scheduled_date), new Date());
        events.push({
          id: apt.id,
          title: apt.title,
          date: apt.scheduled_date,
          type: "appointment",
          urgent: daysUntil <= 2,
        });
      });

      vaccines?.forEach((vax, index) => {
        events.push({
          id: `vax-${index}`,
          title: vax.vaccine_name,
          date: vax.application_date,
          type: "vaccine",
        });
      });

      setUpcomingEvents(events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5));

      // Build recent activities
      const activities: RecentActivity[] = [];
      
      recentFeedings?.forEach((f) => {
        activities.push({
          id: f.id,
          type: "feeding",
          description: f.feeding_type === "breast" ? "Amamentação registrada" : "Mamadeira registrada",
          time: f.created_at,
        });
      });

      recentSleep?.forEach((s) => {
        activities.push({
          id: s.id,
          type: "sleep",
          description: s.sleep_type === "nap" ? "Soneca registrada" : "Sono noturno registrado",
          time: s.created_at,
        });
      });

      setRecentActivities(
        activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5)
      );

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    localStorage.setItem("onboarding_wizard_dismissed", "true");
  };

  const formatEventDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    return format(date, "dd/MM", { locale: ptBR });
  };

  const quickActions = [
    { label: "Registrar Mamada", icon: Heart, path: "/materiais/rastreador-amamentacao", color: "bg-pink-500" },
    { label: "Registrar Sono", icon: Moon, path: "/materiais/diario-sono", color: "bg-indigo-500" },
    { label: "Ver Vacinas", icon: Syringe, path: "/materiais/cartao-vacinacao", color: "bg-blue-500" },
    { label: "Dashboard Bebê", icon: Baby, path: "/dashboard-bebe", color: "bg-purple-500" },
  ];

  return (
    <div className="container py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Onboarding Wizard Modal */}
      <OnboardingWizard open={showWizard} onClose={handleCloseWizard} />

      {/* Header with greeting */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            Olá, {profile?.email?.split('@')[0] || 'Mamãe'}! 👋
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/perfil">
              <TrendingUp className="h-4 w-4 mr-2" />
              Meu Perfil
            </Link>
          </Button>
        </div>
      </div>

      {/* Onboarding Checklist for new users */}
      {profile && !profile.onboarding_completed && (
        <OnboardingChecklist />
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto py-3 sm:py-4 flex flex-col gap-1.5 sm:gap-2 hover:bg-muted min-w-0"
            asChild
          >
            <Link to={action.path}>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${action.color} flex items-center justify-center shrink-0`}>
                <action.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-center line-clamp-2 min-w-0">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>

      {/* Gamification Progress */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <LevelProgress />
        <DailyLoginTracker />
        <WeeklyGoalCard />
        <ActivityCalendar />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Resumo do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickStats.length > 0 ? (
              quickStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                  <span className="text-xl font-bold">{stat.value}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Comece a registrar atividades para ver seu resumo!
              </p>
            )}
            <Button variant="ghost" className="w-full" asChild>
              <Link to="/dashboard-bebe">
                Ver Dashboard Completo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      event.type === "vaccine" ? "bg-blue-100 text-blue-600" :
                      event.type === "appointment" ? "bg-green-100 text-green-600" :
                      "bg-orange-100 text-orange-600"
                    }`}>
                      {event.type === "vaccine" ? <Syringe className="h-4 w-4" /> :
                       event.type === "appointment" ? <Calendar className="h-4 w-4" /> :
                       <Bell className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{formatEventDate(event.date)}</p>
                    </div>
                    {event.urgent && (
                      <Badge variant="destructive" className="text-xs">Urgente</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum evento próximo</p>
                <Button variant="link" size="sm" asChild>
                  <Link to="/materiais/cartao-vacinacao">Adicionar vacinas</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === "feeding" ? "bg-pink-500" : "bg-indigo-500"
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(activity.time), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cross-Module Insights Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <ActionableInsights maxItems={4} />
        <CrossModuleInsights />
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-pink-100">
                <Utensils className="h-6 w-6 text-pink-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Guia de Alimentação</h3>
                <p className="text-sm text-muted-foreground">Nutrição para gestantes</p>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/materiais/guia-alimentacao">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <Baby className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Desenvolvimento</h3>
                <p className="text-sm text-muted-foreground">Marcos do bebê</p>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/materiais/monitor-desenvolvimento">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Minhas Conquistas</h3>
                <p className="text-sm text-muted-foreground">Badges e recompensas</p>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/conquistas">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
