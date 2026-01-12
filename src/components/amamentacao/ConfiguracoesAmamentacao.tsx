import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import type { FeedingSettings } from "@/types/babyFeeding";

interface ConfiguracoesAmamentacaoProps {
  settings: FeedingSettings | null;
  onSave: (settings: Omit<FeedingSettings, "id" | "user_id" | "created_at" | "updated_at">) => Promise<unknown>;
}

export const ConfiguracoesAmamentacao = ({ settings, onSave }: ConfiguracoesAmamentacaoProps) => {
  const [formData, setFormData] = useState({
    baby_name: "",
    baby_birthdate: "",
    feeding_interval_minutes: 180,
    reminder_enabled: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        baby_name: settings.baby_name,
        baby_birthdate: settings.baby_birthdate,
        feeding_interval_minutes: settings.feeding_interval_minutes,
        reminder_enabled: settings.reminder_enabled,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="baby_name">Nome do Bebê</Label>
            <Input
              id="baby_name"
              value={formData.baby_name}
              onChange={(e) => setFormData({ ...formData, baby_name: e.target.value })}
              placeholder="Ex: Maria"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baby_birthdate">Data de Nascimento</Label>
            <Input
              id="baby_birthdate"
              type="date"
              value={formData.baby_birthdate}
              onChange={(e) => setFormData({ ...formData, baby_birthdate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feeding_interval">Intervalo entre Mamadas (minutos)</Label>
            <Input
              id="feeding_interval"
              type="number"
              min="60"
              max="360"
              value={formData.feeding_interval_minutes}
              onChange={(e) => setFormData({ ...formData, feeding_interval_minutes: parseInt(e.target.value) })}
              required
            />
            <p className="text-sm text-muted-foreground">
              Recomendado: 150-180 minutos (2h30-3h)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Lembretes Automáticos</Label>
              <p className="text-sm text-muted-foreground">
                Notificar quando estiver próximo do horário da próxima mamada
              </p>
            </div>
            <Switch
              checked={formData.reminder_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })}
            />
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </form>
      </Card>
    </div>
  );
};
