import { useState, useEffect } from 'react';

import { differenceInMonths } from 'date-fns';
import { Save, Baby } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { BabySleepSettings } from '@/types/babySleep';


interface ConfiguracoesSonoProps {
  settings: BabySleepSettings | null;
  onSave: (
    settings: Omit<BabySleepSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => Promise<any>;
}

export const ConfiguracoesSono = ({ settings, onSave }: ConfiguracoesSonoProps) => {
  const [babyName, setBabyName] = useState('');
  const [babyBirthdate, setBabyBirthdate] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderInterval, setReminderInterval] = useState(90);

  useEffect(() => {
    if (settings) {
      setBabyName(settings.baby_name);
      setBabyBirthdate(settings.baby_birthdate);
      setReminderEnabled(settings.reminder_enabled);
      setReminderInterval(settings.reminder_interval_minutes);
    }
  }, [settings]);

  const calculateAge = () => {
    if (!babyBirthdate) return null;
    const months = differenceInMonths(new Date(), new Date(babyBirthdate));
    return months;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await onSave({
      baby_name: babyName,
      baby_birthdate: babyBirthdate,
      reminder_enabled: reminderEnabled,
      reminder_interval_minutes: reminderInterval,
    });
  };

  const age = calculateAge();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Baby className="h-5 w-5" />
          Configurações do Diário de Sono
        </CardTitle>
        <CardDescription>
          Configure os dados do seu bebê e preferências de lembretes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baby-name">Nome do Bebê</Label>
              <Input
                id="baby-name"
                value={babyName}
                onChange={e => setBabyName(e.target.value)}
                placeholder="Digite o nome do bebê"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baby-birthdate">Data de Nascimento</Label>
              <Input
                id="baby-birthdate"
                type="date"
                value={babyBirthdate}
                onChange={e => setBabyBirthdate(e.target.value)}
                required
              />
              {age !== null && (
                <p className="text-sm text-muted-foreground">
                  Idade atual: {age} {age === 1 ? 'mês' : 'meses'}
                </p>
              )}
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">Lembretes</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reminder-enabled">Ativar Lembretes</Label>
                <p className="text-sm text-muted-foreground">Receba notificações para sonecas</p>
              </div>
              <Switch
                id="reminder-enabled"
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
              />
            </div>

            {reminderEnabled && (
              <div className="space-y-2">
                <Label htmlFor="reminder-interval">Janela de Sono (minutos)</Label>
                <Input
                  id="reminder-interval"
                  type="number"
                  min="30"
                  max="240"
                  step="15"
                  value={reminderInterval}
                  onChange={e => setReminderInterval(parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Você será notificado(a) quando o bebê estiver acordado por mais de{' '}
                  {reminderInterval} minutos
                </p>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Salvar Configurações
          </Button>

          <div className="mt-6 p-4 bg-accent/10 rounded-lg">
            <p className="text-sm text-muted-foreground italic text-center">
              ☀️ Dormir bem começa com paz mental. Respire fundo e lembre-se: você está indo muito
              bem! 💜
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
