import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Clock, Save, Calendar, Zap, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const FREQUENCY_OPTIONS = [
  { value: "1x", label: "1x ao dia", desc: "06:00 UTC (03:00 BRT)" },
  { value: "2x", label: "2x ao dia", desc: "06:00, 18:00 UTC" },
  { value: "3x", label: "3x ao dia", desc: "06:00, 12:00, 18:00 UTC" },
];

export const BlogCronPanel = () => {
  const queryClient = useQueryClient();
  const [cronSchedule, setCronSchedule] = useState("1x");
  const [isActive, setIsActive] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["blog-cron-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_settings")
        .select("id, cron_schedule, is_active")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setCronSchedule(settings.cron_schedule || "1x");
      setIsActive(settings.is_active ?? true);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.id) throw new Error("Settings not found");
      const { error } = await supabase
        .from("blog_settings")
        .update({ cron_schedule: cronSchedule, is_active: isActive })
        .eq("id", settings.id);
      if (error) throw error;

      // Sync the real pg_cron job
      await supabase.rpc("sync_blog_cron_schedule" as any);
    },
    onSuccess: () => {
      toast.success("Agendamento do blog salvo e cron atualizado!");
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["blog-cron-settings"] });
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  const triggerNow = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("generate-blog-post", {
        body: { source: "manual_admin" },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Geração de post disparada! Verifique a aba Posts em instantes.");
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <RefreshCw className="animate-spin h-5 w-5" />
      </div>
    );
  }

  const currentFreq = FREQUENCY_OPTIONS.find((f) => f.value === cronSchedule) || FREQUENCY_OPTIONS[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          Agendamento do Blog
        </h2>
        <p className="text-muted-foreground">
          Configure a geração automática de artigos via IA
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Frequência de Geração
          </CardTitle>
          <CardDescription>
            Define quantos artigos são gerados automaticamente por dia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <Label className="text-base font-medium">Geração Automática Ativa</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar/desativar a criação automática de posts
                </p>
              </div>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={(v) => {
                setIsActive(v);
                setHasChanges(true);
              }}
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequência diária</Label>
            <Select
              value={cronSchedule}
              onValueChange={(v) => {
                setCronSchedule(v);
                setHasChanges(true);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Horários: {currentFreq.desc}
              </span>
            </div>
          </div>

          {/* Manual trigger */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Gerar Agora</Label>
                <p className="text-sm text-muted-foreground">
                  Dispara a geração de um artigo imediatamente
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => triggerNow.mutate()}
                disabled={triggerNow.isPending}
              >
                {triggerNow.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Gerar Post
              </Button>
            </div>
          </div>

          {/* Save */}
          {hasChanges && (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full gap-2"
            >
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
              <p className="font-medium">Como funciona</p>
              <p className="text-sm text-muted-foreground mt-1">
                O blog gera artigos automaticamente via <strong>pg_cron</strong> nos
                horários configurados. A cada execução, a IA escolhe um tópico do pool,
                gera o texto completo com SEO, cria uma imagem ilustrativa e publica
                automaticamente (se habilitado nas configurações). Nenhuma ação manual é
                necessária.
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">⚡ 100% Automático</Badge>
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? "✅ Ativo" : "⏸️ Pausado"}
                </Badge>
                <Badge variant="secondary">{currentFreq.label}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlogCronPanel;
