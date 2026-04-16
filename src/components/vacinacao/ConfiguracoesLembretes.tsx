import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { VaccinationReminderSettings } from '@/types/vaccination';

interface ConfiguracoesLembretesProps {
  settings: VaccinationReminderSettings | null;
  onSave: (settings: Partial<VaccinationReminderSettings>) => Promise<any>;
}

export const ConfiguracoesLembretes = ({ settings, onSave }: ConfiguracoesLembretesProps) => {
  const [formData, setFormData] = useState({
    reminder_enabled: settings?.reminder_enabled ?? true,
    reminder_days_before: settings?.reminder_days_before ?? 7,
    push_enabled: settings?.push_enabled ?? true,
    email_enabled: settings?.email_enabled ?? true,
    whatsapp_enabled: settings?.whatsapp_enabled ?? false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        reminder_enabled: settings.reminder_enabled,
        reminder_days_before: settings.reminder_days_before,
        push_enabled: settings.push_enabled,
        email_enabled: settings.email_enabled,
        whatsapp_enabled: settings.whatsapp_enabled,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    await onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔔 Configurações de Lembretes</CardTitle>
        <CardDescription>
          Personalize como e quando deseja receber lembretes sobre as vacinas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Ativar lembretes</Label>
            <p className="text-sm text-muted-foreground">
              Receba notificações sobre as próximas vacinas
            </p>
          </div>
          <Switch
            checked={formData.reminder_enabled}
            onCheckedChange={checked => setFormData({ ...formData, reminder_enabled: checked })}
          />
        </div>

        {formData.reminder_enabled && (
          <>
            <div className="space-y-2">
              <Label>Antecedência do lembrete</Label>
              <Select
                value={formData.reminder_days_before.toString()}
                onValueChange={value =>
                  setFormData({ ...formData, reminder_days_before: Number(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 dias antes</SelectItem>
                  <SelectItem value="5">5 dias antes</SelectItem>
                  <SelectItem value="7">7 dias antes</SelectItem>
                  <SelectItem value="10">10 dias antes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Canais de notificação</h4>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações push</Label>
                  <p className="text-sm text-muted-foreground">Alertas dentro do aplicativo</p>
                </div>
                <Switch
                  checked={formData.push_enabled}
                  onCheckedChange={checked => setFormData({ ...formData, push_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>E-mail</Label>
                  <p className="text-sm text-muted-foreground">Lembretes por e-mail</p>
                </div>
                <Switch
                  checked={formData.email_enabled}
                  onCheckedChange={checked => setFormData({ ...formData, email_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">Link para enviar no WhatsApp</p>
                </div>
                <Switch
                  checked={formData.whatsapp_enabled}
                  onCheckedChange={checked =>
                    setFormData({ ...formData, whatsapp_enabled: checked })
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
  );
};
