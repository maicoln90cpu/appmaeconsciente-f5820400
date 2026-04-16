import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Loader2, Save } from 'lucide-react';

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT -3)' },
  { value: 'America/Manaus', label: 'Manaus (AMT -4)' },
  { value: 'America/Belem', label: 'Belém (BRT -3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (BRT -3)' },
  { value: 'America/Recife', label: 'Recife (BRT -3)' },
  { value: 'America/Cuiaba', label: 'Cuiabá (AMT -4)' },
  { value: 'America/Porto_Velho', label: 'Porto Velho (AMT -4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (ACT -5)' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (FNT -2)' },
];

export const SiteSettings = () => {
  const { settings, isLoading, updateAllSettings, isUpdating } = useSiteSettings();

  const [form, setForm] = useState({
    gtm_id: '',
    support_whatsapp: '',
    custom_domain: '',
    support_email: '',
    system_timezone: 'America/Sao_Paulo',
    ai_insights_enabled: true,
    badges_enabled: true,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        gtm_id: settings.gtm_id ?? '',
        support_whatsapp: settings.support_whatsapp ?? '',
        custom_domain: settings.custom_domain ?? '',
        support_email: settings.support_email ?? '',
        system_timezone: settings.system_timezone ?? 'America/Sao_Paulo',
        ai_insights_enabled: settings.ai_insights_enabled ?? true,
        badges_enabled: settings.badges_enabled ?? true,
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAllSettings(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Contact & Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contato & Domínio</CardTitle>
          <CardDescription>Informações de contato exibidas para os usuários</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="support_whatsapp">WhatsApp de Suporte</Label>
              <Input
                id="support_whatsapp"
                placeholder="+55 11 99999-9999"
                value={form.support_whatsapp}
                onChange={e => setForm({ ...form, support_whatsapp: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support_email">Email de Suporte</Label>
              <Input
                id="support_email"
                type="email"
                placeholder="suporte@exemplo.com"
                value={form.support_email}
                onChange={e => setForm({ ...form, support_email: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom_domain">Domínio Customizado</Label>
            <Input
              id="custom_domain"
              placeholder="https://app.meudominio.com.br"
              value={form.custom_domain}
              onChange={e => setForm({ ...form, custom_domain: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Domínio personalizado da plataforma (apenas informativo)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tracking & Timezone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rastreamento & Fuso Horário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gtm_id">Google Tag Manager ID</Label>
              <Input
                id="gtm_id"
                placeholder="GTM-XXXXXXX"
                value={form.gtm_id}
                onChange={e => setForm({ ...form, gtm_id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Aplicado em todas as páginas do site</p>
            </div>
            <div className="space-y-2">
              <Label>Fuso Horário do Sistema</Label>
              <Select
                value={form.system_timezone}
                onValueChange={v => setForm({ ...form, system_timezone: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funcionalidades</CardTitle>
          <CardDescription>Ative ou desative funcionalidades globais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Insights de IA</Label>
              <p className="text-xs text-muted-foreground">
                Exibir insights gerados por IA no dashboard
              </p>
            </div>
            <Switch
              checked={form.ai_insights_enabled}
              onCheckedChange={v => setForm({ ...form, ai_insights_enabled: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Badges de Metas</Label>
              <p className="text-xs text-muted-foreground">
                Exibir badges de conquistas e gamificação
              </p>
            </div>
            <Switch
              checked={form.badges_enabled}
              onCheckedChange={v => setForm({ ...form, badges_enabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isUpdating} className="w-full">
        {isUpdating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Salvar Todas as Configurações
      </Button>
    </form>
  );
};
