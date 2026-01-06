import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { usePostpartumSymptoms, usePostpartumMedications, usePostpartumAppointments, useEmotionalLogs } from "@/hooks/postpartum";
import { Activity, Heart, Pill, Calendar, Droplet, AlertTriangle } from "lucide-react";
import { useMemo } from "react";

export const DashboardRecuperacao = () => {
  const { profile } = useProfile();
  const { symptoms } = usePostpartumSymptoms();
  const { medications, logs } = usePostpartumMedications();
  const { appointments } = usePostpartumAppointments();
  const { logs: emotionalLogs } = useEmotionalLogs();

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastSymptom = symptoms?.[0];
    const todayMoodLog = emotionalLogs?.find(log => log.date === today);
    const upcomingAppointments = appointments?.filter(apt => 
      apt.scheduled_date >= today && !apt.completed
    ).length || 0;
    const activeMedications = medications?.length || 0;
    const todayMedicationsTaken = logs?.length || 0;
    const totalMedicationsToday = medications?.reduce((sum, med) => sum + med.times_per_day, 0) || 0;

    return {
      postpartumWeek: profile?.postpartum_week || 0,
      lastSymptom,
      todayMood: todayMoodLog?.mood,
      upcomingAppointments,
      activeMedications,
      medicationAdherence: totalMedicationsToday > 0 
        ? Math.round((todayMedicationsTaken / totalMedicationsToday) * 100)
        : 0,
    };
  }, [profile, symptoms, emotionalLogs, appointments, medications, logs]);

  const getAlertLevel = () => {
    const { lastSymptom } = stats;
    if (!lastSymptom) return null;

    if (lastSymptom.bleeding_intensity === 'very_heavy' || lastSymptom.fever || lastSymptom.healing_status === 'infected') {
      return { level: 'critical', message: 'Sintomas críticos detectados. Procure atendimento médico!' };
    }
    if (lastSymptom.bleeding_intensity === 'heavy' || lastSymptom.healing_status === 'concerning' || (lastSymptom.pain_level && lastSymptom.pain_level >= 4)) {
      return { level: 'warning', message: 'Sintomas que precisam de atenção. Contate seu médico.' };
    }
    return { level: 'good', message: 'Recuperação dentro do esperado 💕' };
  };

  const alert = getAlertLevel();
  const moodEmoji = {
    very_happy: '😊',
    happy: '🙂',
    neutral: '😐',
    sad: '😢',
    very_sad: '😭',
    angry: '😠',
    anxious: '😰',
    tired: '😴',
  };

  return (
    <div className="space-y-6">
      {/* Mensagem de acolhimento */}
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-none">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-semibold mb-2">Olá, você está na semana {stats.postpartumWeek} pós-parto 💕</h2>
          <p className="text-muted-foreground">Seu corpo está se curando — cada dia é um passo de amor próprio.</p>
        </CardContent>
      </Card>

      {/* Alertas críticos */}
      {alert && alert.level === 'critical' && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <p className="font-semibold text-destructive">{alert.message}</p>
          </CardContent>
        </Card>
      )}

      {alert && alert.level === 'warning' && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <p className="font-semibold text-yellow-700 dark:text-yellow-400">{alert.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sintomas físicos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado Físico</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.lastSymptom ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Dor</span>
                  <Badge variant="outline">{stats.lastSymptom.pain_level}/5</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Energia</span>
                  <Badge variant="outline">{stats.lastSymptom.energy_level}/5</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sangramento</span>
                  <Badge variant="secondary">{stats.lastSymptom.bleeding_intensity}</Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum sintoma registrado hoje</p>
            )}
          </CardContent>
        </Card>

        {/* Bem-estar emocional */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bem-estar Emocional</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.todayMood ? (
              <div className="flex items-center gap-2">
                <span className="text-3xl">{moodEmoji[stats.todayMood]}</span>
                <span className="text-sm capitalize">{stats.todayMood.replace('_', ' ')}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Como você está se sentindo hoje?</p>
            )}
          </CardContent>
        </Card>

        {/* Medicamentos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medicamentos</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Ativos</span>
                <Badge>{stats.activeMedications}</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Hoje</span>
                  <span>{stats.medicationAdherence}%</span>
                </div>
                <Progress value={stats.medicationAdherence} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximas consultas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">próximas consultas agendadas</p>
          </CardContent>
        </Card>

        {/* Hidratação */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hidratação</CardTitle>
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Integração com rastreador de água</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
