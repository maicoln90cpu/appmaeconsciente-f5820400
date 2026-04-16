import { useState, useEffect } from 'react';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Droplets, Pill, Scale, Dumbbell, TrendingUp, Calendar } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { useProfile } from '@/hooks/useProfile';

import { supabase } from '@/integrations/supabase/client';

interface DashboardData {
  waterToday: number;
  waterGoal: number;
  supplementsDue: number;
  supplementsTaken: number;
  latestWeight: number | null;
  exerciseMinutesToday: number;
  weekProgress: number;
}

export function DashboardSaude() {
  const { profile } = useProfile();
  const [data, setData] = useState<DashboardData>({
    waterToday: 0,
    waterGoal: 2000,
    supplementsDue: 0,
    supplementsTaken: 0,
    latestWeight: null,
    exerciseMinutesToday: 0,
    weekProgress: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = format(new Date(), 'yyyy-MM-dd');

      // Água de hoje
      const { data: waterData } = await supabase
        .from('water_intake')
        .select('amount_ml')
        .eq('user_id', user.id)
        .eq('date', today);

      const waterToday = waterData?.reduce((sum, w) => sum + w.amount_ml, 0) || 0;

      // Meta de água
      const { data: goalData } = await supabase
        .from('water_goals')
        .select('daily_goal_ml')
        .eq('user_id', user.id)
        .single();

      const waterGoal = goalData?.daily_goal_ml || 2000;

      // Suplementos
      const { data: supplementsData } = await supabase
        .from('user_supplements')
        .select('id, time_of_day')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const totalDoses =
        supplementsData?.reduce((sum, s) => sum + (s.time_of_day?.length || 0), 0) || 0;

      const { data: logsData } = await supabase
        .from('supplement_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('taken_at', `${today}T00:00:00`)
        .lte('taken_at', `${today}T23:59:59`);

      const supplementsTaken = logsData?.length || 0;

      // Peso mais recente
      const { data: weightData } = await supabase
        .from('weight_tracking')
        .select('weight')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      // Exercícios de hoje
      const { data: exerciseData } = await supabase
        .from('user_exercise_logs')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .eq('date', today);

      const exerciseMinutes = exerciseData?.reduce((sum, e) => sum + e.duration_minutes, 0) || 0;

      // Progresso da semana (quantos dias teve atividade)
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      const { data: weekData } = await supabase
        .from('user_exercise_logs')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', format(weekStart, 'yyyy-MM-dd'));

      const uniqueDays = new Set(weekData?.map(d => d.date)).size;
      const weekProgress = (uniqueDays / 7) * 100;

      setData({
        waterToday,
        waterGoal,
        supplementsDue: totalDoses,
        supplementsTaken,
        latestWeight: weightData?.weight || null,
        exerciseMinutesToday: exerciseMinutes,
        weekProgress,
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const trimester = profile?.meses_gestacao
    ? Math.min(Math.ceil(profile.meses_gestacao / 3), 3)
    : 1;

  const weekOfPregnancy = profile?.meses_gestacao ? Math.floor(profile.meses_gestacao * 4.33) : 0;

  if (loading) {
    return <div className="flex justify-center py-8">Carregando dashboard...</div>;
  }

  const waterProgress = (data.waterToday / data.waterGoal) * 100;
  const supplementProgress =
    data.supplementsDue > 0 ? (data.supplementsTaken / data.supplementsDue) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard de Saúde</h2>
        <p className="text-muted-foreground">
          Visão geral do seu bem-estar - {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gestação */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Gestação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trimester}º Trimestre</div>
            <p className="text-xs text-muted-foreground mt-1">{weekOfPregnancy} semanas</p>
          </CardContent>
        </Card>

        {/* Peso Atual */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Peso Atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.latestWeight ? `${data.latestWeight} kg` : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Último registro</p>
          </CardContent>
        </Card>

        {/* Hidratação */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Hidratação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.waterToday}ml</div>
            <Progress value={waterProgress} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(waterProgress)}% da meta
            </p>
          </CardContent>
        </Card>

        {/* Exercício */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Atividade Física
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.exerciseMinutesToday} min</div>
            <p className="text-xs text-muted-foreground mt-1">Hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Suplementos de Hoje */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Suplementos de Hoje
            </CardTitle>
            <CardDescription>
              {data.supplementsTaken} de {data.supplementsDue} doses tomadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={supplementProgress} className="h-3 mb-4" />
            {data.supplementsTaken === data.supplementsDue && data.supplementsDue > 0 ? (
              <Badge className="bg-green-500">Completo!</Badge>
            ) : data.supplementsDue === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum suplemento cadastrado</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Faltam {data.supplementsDue - data.supplementsTaken} doses
              </p>
            )}
          </CardContent>
        </Card>

        {/* Progresso Semanal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progresso Semanal
            </CardTitle>
            <CardDescription>Dias ativos esta semana</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={data.weekProgress} className="h-3 mb-4" />
            <p className="text-sm text-muted-foreground">
              {Math.round((data.weekProgress / 100) * 7)} de 7 dias com atividade
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dicas Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Dicas para Hoje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {waterProgress < 50 && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Droplets className="h-4 w-4 mt-0.5 text-blue-500" />
              <p className="text-sm">
                Você ainda não atingiu metade da sua meta de água. Mantenha-se hidratada!
              </p>
            </div>
          )}

          {data.supplementsTaken < data.supplementsDue && data.supplementsDue > 0 && (
            <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <Pill className="h-4 w-4 mt-0.5 text-purple-500" />
              <p className="text-sm">
                Não esqueça de tomar seus suplementos nos horários indicados.
              </p>
            </div>
          )}

          {data.exerciseMinutesToday === 0 && (
            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <Dumbbell className="h-4 w-4 mt-0.5 text-green-500" />
              <p className="text-sm">
                Que tal fazer uma caminhada leve hoje? Apenas 15-20 minutos já fazem diferença!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
