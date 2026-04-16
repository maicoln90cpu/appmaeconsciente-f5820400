import { useState } from 'react';

import { Bell, Mail, Smartphone, Info } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';


import { DevelopmentAlertSettings } from '@/types/development';


interface ConfiguracoesAlertasProps {
  settings: DevelopmentAlertSettings | null;
  babyProfileId: string;
  onSave: (settings: Partial<DevelopmentAlertSettings>) => void;
}

export const ConfiguracoesAlertas = ({
  settings,
  babyProfileId,
  onSave,
}: ConfiguracoesAlertasProps) => {
  const [localSettings, setLocalSettings] = useState<Partial<DevelopmentAlertSettings>>({
    alerts_enabled: settings?.alerts_enabled ?? true,
    alert_when_passed_max_age: settings?.alert_when_passed_max_age ?? true,
    reminder_frequency_days: settings?.reminder_frequency_days ?? 7,
    push_enabled: settings?.push_enabled ?? true,
    email_enabled: settings?.email_enabled ?? true,
  });

  const handleSave = () => {
    onSave(localSettings);
    toast.success('Configurações de alertas salvas! 🔔');
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Os alertas são sempre suaves e informativos. Nunca usamos termos alarmantes. O objetivo é
          te ajudar a acompanhar com tranquilidade.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configurações de Alertas
          </CardTitle>
          <CardDescription>
            Escolha como deseja ser notificada sobre o desenvolvimento do bebê
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alertas Gerais */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="alerts-enabled">Ativar alertas</Label>
              <p className="text-sm text-muted-foreground">
                Receba lembretes suaves sobre o desenvolvimento
              </p>
            </div>
            <Switch
              id="alerts-enabled"
              checked={localSettings.alerts_enabled}
              onCheckedChange={checked =>
                setLocalSettings({ ...localSettings, alerts_enabled: checked })
              }
            />
          </div>

          {localSettings.alerts_enabled && (
            <>
              {/* Alerta de janela de atenção */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="attention-alerts">Avisar sobre janelas de atenção</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba um lembrete gentil quando um marco passa da faixa típica
                  </p>
                </div>
                <Switch
                  id="attention-alerts"
                  checked={localSettings.alert_when_passed_max_age}
                  onCheckedChange={checked =>
                    setLocalSettings({ ...localSettings, alert_when_passed_max_age: checked })
                  }
                />
              </div>

              {/* Frequência de lembretes */}
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência de lembretes</Label>
                <Select
                  value={String(localSettings.reminder_frequency_days)}
                  onValueChange={value =>
                    setLocalSettings({ ...localSettings, reminder_frequency_days: Number(value) })
                  }
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">A cada 3 dias</SelectItem>
                    <SelectItem value="7">Semanalmente</SelectItem>
                    <SelectItem value="14">Quinzenalmente</SelectItem>
                    <SelectItem value="30">Mensalmente</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Lembretes para registrar novos marcos observados
                </p>
              </div>

              {/* Canais de notificação */}
              <div className="space-y-4 pt-4 border-t">
                <Label>Canais de notificação</Label>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label htmlFor="push-enabled" className="font-normal">
                        Notificações push
                      </Label>
                      <p className="text-xs text-muted-foreground">No aplicativo</p>
                    </div>
                  </div>
                  <Switch
                    id="push-enabled"
                    checked={localSettings.push_enabled}
                    onCheckedChange={checked =>
                      setLocalSettings({ ...localSettings, push_enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label htmlFor="email-enabled" className="font-normal">
                        E-mail
                      </Label>
                      <p className="text-xs text-muted-foreground">Resumo semanal por e-mail</p>
                    </div>
                  </div>
                  <Switch
                    id="email-enabled"
                    checked={localSettings.email_enabled}
                    onCheckedChange={checked =>
                      setLocalSettings({ ...localSettings, email_enabled: checked })
                    }
                  />
                </div>
              </div>
            </>
          )}

          <Button onClick={handleSave} className="w-full">
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>

      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-base">💡 Sobre os alertas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Tom gentil:</strong> Nunca usamos palavras como "atraso", "problema" ou
            "anormal".
          </p>
          <p>
            <strong>Contexto:</strong> Sempre lembramos que cada bebê tem seu próprio ritmo.
          </p>
          <p>
            <strong>Orientação:</strong> Sugerimos conversar com o pediatra quando apropriado, mas
            sem alarmismo.
          </p>
          <p>
            <strong>Privacidade:</strong> Suas informações são privadas e seguras.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
