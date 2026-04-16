import { useState } from 'react';
import { Bell, BellOff, Clock, Calendar, Pill, Moon, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PushNotificationToggle } from '@/components/pwa/PushNotificationToggle';
import { toast } from 'sonner';

interface NotificationPreferences {
  feedingReminders: boolean;
  feedingIntervalHours: number;
  medicationReminders: boolean;
  appointmentReminders: boolean;
  appointmentReminderHours: number;
  sleepReminders: boolean;
  sleepGoalHours: number;
  weeklyReport: boolean;
}

const defaultPreferences: NotificationPreferences = {
  feedingReminders: true,
  feedingIntervalHours: 3,
  medicationReminders: true,
  appointmentReminders: true,
  appointmentReminderHours: 24,
  sleepReminders: false,
  sleepGoalHours: 14,
  weeklyReport: true,
};

export const NotificationSettings = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    const saved = localStorage.getItem('baby-notification-preferences');
    return saved ? JSON.parse(saved) : defaultPreferences;
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    'Notification' in window && Notification.permission === 'granted'
  );

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Seu navegador não suporta notificações');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        toast.success('Notificações ativadas!');

        // Show a test notification
        new Notification('MamaConsciente 🍼', {
          body: 'Notificações ativadas com sucesso!',
          icon: '/icon-192.png',
        });
      } else {
        toast.error('Permissão para notificações negada');
      }
    } catch (error) {
      toast.error('Erro ao solicitar permissão');
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem('baby-notification-preferences', JSON.stringify(newPrefs));
  };

  const savePreferences = () => {
    localStorage.setItem('baby-notification-preferences', JSON.stringify(preferences));
    toast.success('Preferências salvas!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações
        </CardTitle>
        <CardDescription>Configure lembretes e alertas para cuidados do bebê</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Push Notifications Toggle */}
        <PushNotificationToggle className="p-4 rounded-lg bg-muted/50" />

        <Separator />

        {/* Enable Browser Notifications */}
        {!notificationsEnabled && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-3">
              <BellOff className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium">Notificações do navegador desativadas</p>
                <p className="text-sm text-muted-foreground">Ative para receber lembretes locais</p>
              </div>
            </div>
            <Button onClick={requestNotificationPermission}>Ativar</Button>
          </div>
        )}

        {/* Feeding Reminders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-pink-500/10">
                <Clock className="h-4 w-4 text-pink-500" />
              </div>
              <div>
                <Label>Lembretes de Mamada</Label>
                <p className="text-sm text-muted-foreground">Lembrar de alimentar o bebê</p>
              </div>
            </div>
            <Switch
              checked={preferences.feedingReminders}
              onCheckedChange={checked => updatePreference('feedingReminders', checked)}
            />
          </div>
          {preferences.feedingReminders && (
            <div className="ml-12 space-y-2">
              <Label className="text-sm">Intervalo: {preferences.feedingIntervalHours}h</Label>
              <Slider
                value={[preferences.feedingIntervalHours]}
                onValueChange={([value]) => updatePreference('feedingIntervalHours', value)}
                min={1}
                max={6}
                step={0.5}
                className="w-48"
              />
            </div>
          )}
        </div>

        {/* Medication Reminders */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/10">
              <Pill className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <Label>Lembretes de Medicamentos</Label>
              <p className="text-sm text-muted-foreground">Alertar horários de medicação</p>
            </div>
          </div>
          <Switch
            checked={preferences.medicationReminders}
            onCheckedChange={checked => updatePreference('medicationReminders', checked)}
          />
        </div>

        {/* Appointment Reminders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <Label>Lembretes de Consultas</Label>
                <p className="text-sm text-muted-foreground">Lembrar consultas agendadas</p>
              </div>
            </div>
            <Switch
              checked={preferences.appointmentReminders}
              onCheckedChange={checked => updatePreference('appointmentReminders', checked)}
            />
          </div>
          {preferences.appointmentReminders && (
            <div className="ml-12 space-y-2">
              <Label className="text-sm">
                Antecipar: {preferences.appointmentReminderHours}h antes
              </Label>
              <Slider
                value={[preferences.appointmentReminderHours]}
                onValueChange={([value]) => updatePreference('appointmentReminderHours', value)}
                min={1}
                max={48}
                step={1}
                className="w-48"
              />
            </div>
          )}
        </div>

        {/* Sleep Goal */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-indigo-500/10">
                <Moon className="h-4 w-4 text-indigo-500" />
              </div>
              <div>
                <Label>Alerta de Meta de Sono</Label>
                <p className="text-sm text-muted-foreground">
                  Notificar se bebê não atingir meta diária
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.sleepReminders}
              onCheckedChange={checked => updatePreference('sleepReminders', checked)}
            />
          </div>
          {preferences.sleepReminders && (
            <div className="ml-12 space-y-2">
              <Label className="text-sm">Meta diária: {preferences.sleepGoalHours}h</Label>
              <Slider
                value={[preferences.sleepGoalHours]}
                onValueChange={([value]) => updatePreference('sleepGoalHours', value)}
                min={8}
                max={18}
                step={0.5}
                className="w-48"
              />
            </div>
          )}
        </div>

        {/* Weekly Report */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-500/10">
              <AlertTriangle className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <Label>Relatório Semanal</Label>
              <p className="text-sm text-muted-foreground">Resumo semanal dos cuidados</p>
            </div>
          </div>
          <Switch
            checked={preferences.weeklyReport}
            onCheckedChange={checked => updatePreference('weeklyReport', checked)}
          />
        </div>

        <Button onClick={savePreferences} className="w-full mt-4">
          Salvar Preferências
        </Button>
      </CardContent>
    </Card>
  );
};
