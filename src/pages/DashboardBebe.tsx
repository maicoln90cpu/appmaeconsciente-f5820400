import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Baby, Milk, Moon, Clock, TrendingUp, AlertTriangle, Plus, Apple, Calculator, Ruler } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useVaccination } from "@/hooks/useVaccination";
import { GrowthChart } from "@/components/crescimento/GrowthChart";
import { FoodIntroductionDiary } from "@/components/alimentacao-bebe/FoodIntroductionDiary";
import { BottleCalculator } from "@/components/alimentacao-bebe/BottleCalculator";

interface FeedingLog {
  id: string;
  start_time: string;
  feeding_type: string;
  breast_side?: string;
  volume_ml?: number;
  duration_minutes?: number;
}

interface SleepLog {
  id: string;
  sleep_start: string;
  sleep_end?: string;
  duration_minutes?: number;
  sleep_type: string;
  wakeup_mood?: string;
}

const DashboardBebe = () => {
  const [loading, setLoading] = useState(true);
  const [lastFeeding, setLastFeeding] = useState<FeedingLog | null>(null);
  const [lastSleep, setLastSleep] = useState<SleepLog | null>(null);
  const [feedingLogs24h, setFeedingLogs24h] = useState<FeedingLog[]>([]);
  const [sleepLogs24h, setSleepLogs24h] = useState<SleepLog[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string>("");
  const navigate = useNavigate();
  const { profiles: babyProfiles } = useVaccination();

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-select first baby profile
  useEffect(() => {
    if (babyProfiles.length > 0 && !selectedBabyId) {
      setSelectedBabyId(babyProfiles[0].id);
    }
  }, [babyProfiles, selectedBabyId]);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Última mamada
      const { data: lastFeed } = await supabase
        .from("baby_feeding_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      setLastFeeding(lastFeed);

      // Última soneca
      const { data: lastSleepData } = await supabase
        .from("baby_sleep_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("sleep_start", { ascending: false })
        .limit(1)
        .maybeSingle();

      setLastSleep(lastSleepData);

      // Mamadas das últimas 24h
      const { data: feeds24h } = await supabase
        .from("baby_feeding_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_time", yesterday.toISOString())
        .order("start_time", { ascending: false });

      setFeedingLogs24h(feeds24h || []);

      // Sonecas das últimas 24h
      const { data: sleeps24h } = await supabase
        .from("baby_sleep_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("sleep_start", yesterday.toISOString())
        .order("sleep_start", { ascending: false });

      setSleepLogs24h(sleeps24h || []);

      // Gerar alertas inteligentes
      generateAlerts(lastFeed, lastSleepData);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (lastFeed: FeedingLog | null, lastSleepData: SleepLog | null) => {
    const newAlerts: string[] = [];
    const now = new Date();

    // Alerta de fome (última mamada há 3h30+)
    if (lastFeed) {
      const timeSinceFeeding = now.getTime() - new Date(lastFeed.start_time).getTime();
      const hoursSinceFeeding = timeSinceFeeding / (1000 * 60 * 60);
      if (hoursSinceFeeding >= 3.5) {
        newAlerts.push("🍼 Bebê pode estar com fome - última mamada há mais de 3h30");
      }
    }

    // Alerta de soneca (acordado há 2h15+)
    if (lastSleepData?.sleep_end) {
      const timeSinceWakeup = now.getTime() - new Date(lastSleepData.sleep_end).getTime();
      const hoursSinceWakeup = timeSinceWakeup / (1000 * 60 * 60);
      if (hoursSinceWakeup >= 2.25) {
        newAlerts.push("💤 Hora da soneca - bebê acordado há mais de 2h15");
      }
    }

    setAlerts(newAlerts);
  };

  const getTotalFeedingTime = () => {
    return feedingLogs24h.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
  };

  const getTotalSleepTime = () => {
    return sleepLogs24h.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
  };

  const getAverageSleepDuration = () => {
    if (sleepLogs24h.length === 0) return 0;
    return Math.round(getTotalSleepTime() / sleepLogs24h.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Baby className="h-10 w-10 text-primary" />
            Minha Rotina do Bebê
          </h1>
          <p className="text-muted-foreground">
            Visão 360° da rotina: mamadas, sono, crescimento e alimentação
          </p>
        </div>
        {babyProfiles.length > 0 && (
          <Select value={selectedBabyId} onValueChange={setSelectedBabyId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione o bebê" />
            </SelectTrigger>
            <SelectContent>
              {babyProfiles.map((baby) => (
                <SelectItem key={baby.id} value={baby.id}>
                  {baby.baby_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Alertas Inteligentes */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                {alert}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="growth" className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            <span className="hidden sm:inline">Crescimento</span>
          </TabsTrigger>
          <TabsTrigger value="food" className="flex items-center gap-2">
            <Apple className="h-4 w-4" />
            <span className="hidden sm:inline">Alimentação</span>
          </TabsTrigger>
          <TabsTrigger value="bottle" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Mamadeira</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">

      {/* KPIs Principais */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* Última Mamada */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Milk className="h-4 w-4 text-primary" />
              Última Mamada
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastFeeding ? (
              <>
                <p className="text-2xl font-bold">
                  {formatDistanceToNow(new Date(lastFeeding.start_time), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
                <div className="mt-2 space-y-1">
                  <Badge variant="outline" className="text-xs">
                    {lastFeeding.feeding_type === 'breastfeeding' ? 'Peito' : 
                     lastFeeding.feeding_type === 'bottle' ? 'Mamadeira' : 'Fórmula'}
                  </Badge>
                  {lastFeeding.breast_side && (
                    <p className="text-xs text-muted-foreground">
                      Lado: {lastFeeding.breast_side === 'left' ? 'Esquerdo' : 'Direito'}
                    </p>
                  )}
                  {lastFeeding.volume_ml && (
                    <p className="text-xs text-muted-foreground">{lastFeeding.volume_ml}ml</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum registro ainda</p>
            )}
          </CardContent>
        </Card>

        {/* Última Soneca */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Moon className="h-4 w-4 text-primary" />
              Última Soneca
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastSleep ? (
              <>
                <p className="text-2xl font-bold">
                  {lastSleep.sleep_end 
                    ? formatDistanceToNow(new Date(lastSleep.sleep_end), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })
                    : 'Dormindo agora'
                  }
                </p>
                <div className="mt-2 space-y-1">
                  <Badge variant="outline" className="text-xs">
                    {lastSleep.sleep_type === 'night' ? 'Noturno' : 'Soneca'}
                  </Badge>
                  {lastSleep.duration_minutes && (
                    <p className="text-xs text-muted-foreground">
                      {Math.floor(lastSleep.duration_minutes / 60)}h {lastSleep.duration_minutes % 60}min
                    </p>
                  )}
                  {lastSleep.wakeup_mood && (
                    <p className="text-xs text-muted-foreground">
                      Humor: {lastSleep.wakeup_mood === 'happy' ? '😊' : 
                              lastSleep.wakeup_mood === 'crying' ? '😭' : '😐'}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum registro ainda</p>
            )}
          </CardContent>
        </Card>

        {/* Próxima Atividade */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Próxima Atividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastFeeding && lastSleep?.sleep_end ? (
              <>
                <p className="text-2xl font-bold">
                  {(() => {
                    const now = new Date();
                    const timeSinceFeeding = now.getTime() - new Date(lastFeeding.start_time).getTime();
                    const hoursSinceFeeding = timeSinceFeeding / (1000 * 60 * 60);
                    
                    const timeSinceWakeup = now.getTime() - new Date(lastSleep.sleep_end).getTime();
                    const hoursSinceWakeup = timeSinceWakeup / (1000 * 60 * 60);

                    if (hoursSinceFeeding >= 3) return "Mamada";
                    if (hoursSinceWakeup >= 2) return "Soneca";
                    return "Brincadeira";
                  })()}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Baseado no padrão das últimas 24h
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Registre mais eventos para previsões
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas 24h */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Mamadas (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{feedingLogs24h.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {getTotalFeedingTime()} minutos no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Sonecas (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{sleepLogs24h.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.floor(getTotalSleepTime() / 60)}h {getTotalSleepTime() % 60}min no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Média de Sono</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {Math.floor(getAverageSleepDuration() / 60)}h {getAverageSleepDuration() % 60}min
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Por soneca
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline das Últimas 24h */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Timeline das Últimas 24h
          </CardTitle>
          <CardDescription>Cronologia de mamadas e sonecas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {[...feedingLogs24h, ...sleepLogs24h]
              .sort((a, b) => {
                const timeA = 'start_time' in a ? a.start_time : a.sleep_start;
                const timeB = 'start_time' in b ? b.start_time : b.sleep_start;
                return new Date(timeB).getTime() - new Date(timeA).getTime();
              })
              .map((event, index) => {
                const isFeeding = 'feeding_type' in event;
                const time = isFeeding ? event.start_time : event.sleep_start;
                
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    {isFeeding ? (
                      <Milk className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    ) : (
                      <Moon className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {isFeeding ? (
                          event.feeding_type === 'breastfeeding' ? 'Mamada no peito' :
                          event.feeding_type === 'bottle' ? 'Mamadeira' : 'Fórmula'
                        ) : (
                          event.sleep_type === 'night' ? 'Sono noturno' : 'Soneca'
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(time), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    {isFeeding && event.volume_ml && (
                      <Badge variant="outline">{event.volume_ml}ml</Badge>
                    )}
                    {!isFeeding && event.duration_minutes && (
                      <Badge variant="outline">
                        {Math.floor(event.duration_minutes / 60)}h {event.duration_minutes % 60}min
                      </Badge>
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Registre novos eventos rapidamente</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button 
            onClick={() => navigate('/materiais/rastreador-amamentacao')}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Registrar Mamada
          </Button>
          <Button 
            onClick={() => navigate('/materiais/diario-sono')}
            variant="outline"
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Registrar Sono
          </Button>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Growth Tab */}
        <TabsContent value="growth">
          <GrowthChart babyProfileId={selectedBabyId} />
        </TabsContent>

        {/* Food Introduction Tab */}
        <TabsContent value="food">
          <FoodIntroductionDiary babyProfileId={selectedBabyId} />
        </TabsContent>

        {/* Bottle Calculator Tab */}
        <TabsContent value="bottle">
          <BottleCalculator babyProfileId={selectedBabyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardBebe;
