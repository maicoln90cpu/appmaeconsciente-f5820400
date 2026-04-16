import { useState, useEffect } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Save, Calendar, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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


import { supabase } from '@/integrations/supabase/client';

interface CronConfig {
  enabled: boolean;
  frequency: string; // '1x', '2x', '3x', '4x', '6x', '8x', '12x'
  custom_hours: number[]; // specific hours to run
  auto_moderation_enabled: boolean;
  sentiment_filter_enabled: boolean;
  sentiment_threshold: number; // 0.0-1.0 below which bots skip
}

const DEFAULT_CRON: CronConfig = {
  enabled: true,
  frequency: '2x',
  custom_hours: [8, 20],
  auto_moderation_enabled: true,
  sentiment_filter_enabled: true,
  sentiment_threshold: 0.3,
};

const FREQUENCY_OPTIONS: Record<string, { label: string; hours: number[]; desc: string }> = {
  '1x': { label: '1x ao dia', hours: [10], desc: '10:00' },
  '2x': { label: '2x ao dia', hours: [8, 20], desc: '08:00, 20:00' },
  '3x': { label: '3x ao dia', hours: [8, 14, 21], desc: '08:00, 14:00, 21:00' },
  '4x': { label: '4x ao dia', hours: [7, 11, 16, 21], desc: '07:00, 11:00, 16:00, 21:00' },
  '6x': { label: '6x ao dia', hours: [7, 10, 13, 16, 19, 22], desc: 'A cada ~3h' },
  '8x': { label: '8x ao dia', hours: [6, 9, 11, 13, 15, 17, 20, 22], desc: 'A cada ~2h' },
};

export const CronSchedulePanel = () => {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<CronConfig>(DEFAULT_CRON);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: savedConfig } = useQuery({
    queryKey: ['cron-config'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('automation_config')
        .limit(1)
        .maybeSingle();
      const ac = (data as any)?.automation_config;
      return ac?.cron as CronConfig | null;
    },
  });

  useEffect(() => {
    if (savedConfig) setConfig(savedConfig);
  }, [savedConfig]);

  const update = (partial: Partial<CronConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
    setHasChanges(true);
  };

  const saveConfig = useMutation({
    mutationFn: async () => {
      const { data: settings } = await supabase
        .from('site_settings')
        .select('id, automation_config')
        .limit(1)
        .maybeSingle();

      if (!settings) throw new Error('Settings not found');

      const existingConfig = (settings as any).automation_config || {};
      const newConfig = { ...existingConfig, cron: config };

      const { error } = await supabase
        .from('site_settings')
        .update({ automation_config: newConfig } as any)
        .eq('id', settings.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      // Sync the real pg_cron job with the new config
      try {
        await supabase.rpc('sync_cron_schedule');
        toast.success('Agendamento salvo e cron atualizado automaticamente!');
      } catch {
        toast.success('Configurações salvas! (sincronização do cron pendente)');
      }
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['cron-config'] });
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  const freq = FREQUENCY_OPTIONS[config.frequency] || FREQUENCY_OPTIONS['2x'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          Agendamento do Cron
        </h2>
        <p className="text-muted-foreground">Configure a frequência de execução automática da IA</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Frequência de Execução
          </CardTitle>
          <CardDescription>
            Define quantas vezes por dia a automação roda automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <Label className="text-base font-medium">Automação Ativa</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar/desativar a execução automática
                </p>
              </div>
            </div>
            <Switch checked={config.enabled} onCheckedChange={v => update({ enabled: v })} />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequência diária</Label>
            <Select
              value={config.frequency}
              onValueChange={v =>
                update({ frequency: v, custom_hours: FREQUENCY_OPTIONS[v]?.hours || [8, 20] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FREQUENCY_OPTIONS).map(([key, opt]) => (
                  <SelectItem key={key} value={key}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Horários: {freq.desc}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {config.custom_hours.map(h => (
                <Badge key={h} variant="secondary">
                  {String(h).padStart(2, '0')}:00
                </Badge>
              ))}
            </div>
          </div>

          {/* Sentiment Filter */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Filtro de Sentimento</Label>
                <p className="text-sm text-muted-foreground">
                  Bots evitam responder a posts sensíveis (luto, emergência médica, etc.)
                </p>
              </div>
              <Switch
                checked={config.sentiment_filter_enabled}
                onCheckedChange={v => update({ sentiment_filter_enabled: v })}
              />
            </div>
          </div>

          {/* Auto-moderation */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Auto-Moderação</Label>
                <p className="text-sm text-muted-foreground">
                  IA analisa novos posts e oculta/sinaliza conteúdo impróprio automaticamente
                </p>
              </div>
              <Switch
                checked={config.auto_moderation_enabled}
                onCheckedChange={v => update({ auto_moderation_enabled: v })}
              />
            </div>
          </div>

          {/* Save */}
          {hasChanges && (
            <Button onClick={() => saveConfig.mutate()} className="w-full gap-2">
              <Save className="h-4 w-4" />
              Salvar Configurações de Agendamento
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Como funciona o agendamento</p>
              <p className="text-sm text-muted-foreground mt-1">
                A automação roda automaticamente via <strong>pg_cron</strong> nos horários
                configurados — sem necessidade de clicar "Executar" manualmente. Ao salvar, o cron
                job real é atualizado instantaneamente. A cada execução, a IA cria posts, respostas
                e curtidas conforme os parâmetros definidos na aba "Automação IA".
              </p>
              <Badge variant="outline" className="mt-2">
                ⚡ 100% Automático via pg_cron + pg_net
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CronSchedulePanel;
