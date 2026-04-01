import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Bot, MessageSquare, Heart, RefreshCw, Sparkles, Clock,
  CheckCircle2, FileText, Shuffle, Save
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EngagementLog {
  id: string;
  post_id: string;
  action_type: string;
  virtual_user_id: string;
  content?: string;
  created_at: string;
}

interface AutomationConfig {
  posts_per_run: number;
  replies_per_run: number;
  likes_per_run: number;
  random_timing: boolean;
  max_delay_minutes: number;
}

const DEFAULT_CONFIG: AutomationConfig = {
  posts_per_run: 3,
  replies_per_run: 3,
  likes_per_run: 4,
  random_timing: false,
  max_delay_minutes: 30,
};

export const AIEngagementPanel = () => {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [config, setConfig] = useState<AutomationConfig>(DEFAULT_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved config from site_settings
  const { data: savedConfig } = useQuery({
    queryKey: ["automation-config"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("automation_config")
        .limit(1)
        .maybeSingle();
      return (data as any)?.automation_config as AutomationConfig | null;
    },
  });

  useEffect(() => {
    if (savedConfig) {
      setConfig({
        posts_per_run: savedConfig.posts_per_run ?? DEFAULT_CONFIG.posts_per_run,
        replies_per_run: savedConfig.replies_per_run ?? DEFAULT_CONFIG.replies_per_run,
        likes_per_run: savedConfig.likes_per_run ?? DEFAULT_CONFIG.likes_per_run,
        random_timing: savedConfig.random_timing ?? DEFAULT_CONFIG.random_timing,
        max_delay_minutes: savedConfig.max_delay_minutes ?? DEFAULT_CONFIG.max_delay_minutes,
      });
    }
  }, [savedConfig]);

  const updateConfig = (partial: Partial<AutomationConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
    setHasChanges(true);
  };

  const saveConfig = useMutation({
    mutationFn: async () => {
      const { data: settings } = await supabase
        .from("site_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (settings) {
        const { error } = await supabase
          .from("site_settings")
          .update({ automation_config: config } as any)
          .eq("id", settings.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Configurações salvas!");
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["automation-config"] });
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["ai-engagement-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_engagement_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data || []) as unknown as EngagementLog[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["ai-engagement-stats"],
    queryFn: async () => {
      const { count: postsCount } = await supabase
        .from("ai_engagement_logs" as any)
        .select("*", { count: "exact", head: true })
        .eq("action_type", "post");

      const { count: commentsCount } = await supabase
        .from("ai_engagement_logs" as any)
        .select("*", { count: "exact", head: true })
        .eq("action_type", "comment");

      const { count: likesCount } = await supabase
        .from("ai_engagement_logs" as any)
        .select("*", { count: "exact", head: true })
        .eq("action_type", "like");

      const { data: lastLog } = await supabase
        .from("ai_engagement_logs" as any)
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        total_posts: postsCount || 0,
        total_comments: commentsCount || 0,
        total_likes: likesCount || 0,
        last_run: (lastLog as any)?.created_at || null,
      };
    },
  });

  const runEngagement = useMutation({
    mutationFn: async () => {
      setIsRunning(true);
      const { data, error } = await supabase.functions.invoke("auto-engage-community", {
        body: {
          maxPosts: config.posts_per_run,
          maxReplies: config.replies_per_run,
          maxLikes: config.likes_per_run,
          randomTiming: config.random_timing,
          maxDelayMinutes: config.max_delay_minutes,
          sentimentFilter: true,
          autoModeration: true,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        `IA engajou! ${data.posts_created || 0} posts, ${data.replies_created || 0} respostas, ${data.likes_created || 0} curtidas`
      );
      queryClient.invalidateQueries({ queryKey: ["ai-engagement-logs"] });
      queryClient.invalidateQueries({ queryKey: ["ai-engagement-stats"] });
    },
    onError: (error: any) => toast.error(`Erro ao executar IA: ${error.message}`),
    onSettled: () => setIsRunning(false),
  });

  const actionConfig: Record<string, { icon: typeof MessageSquare; label: string; bg: string }> = {
    post: { icon: FileText, label: "Post", bg: "bg-purple-100 text-purple-600" },
    comment: { icon: MessageSquare, label: "Comentário", bg: "bg-blue-100 text-blue-600" },
    like: { icon: Heart, label: "Curtida", bg: "bg-pink-100 text-pink-600" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          Automação IA - Comunidade
        </h2>
        <p className="text-muted-foreground">
          Cria posts, comentários e curtidas automaticamente (configurado para rodar 2x/dia)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: FileText, value: stats?.total_posts || 0, label: "Posts IA", bg: "bg-purple-100", iconColor: "text-purple-600" },
          { icon: MessageSquare, value: stats?.total_comments || 0, label: "Comentários IA", bg: "bg-blue-100", iconColor: "text-blue-600" },
          { icon: Heart, value: stats?.total_likes || 0, label: "Curtidas IA", bg: "bg-pink-100", iconColor: "text-pink-600" },
          { icon: Clock, value: stats?.last_run ? format(new Date(stats.last_run), "dd/MM HH:mm", { locale: ptBR }) : "Nunca", label: "Última Execução", bg: "bg-orange-100", iconColor: "text-orange-600" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.iconColor}`} /></div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Configurações da Automação</CardTitle>
          <CardDescription>Ajuste quantidades e comportamento do cron automático</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quantity sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Posts por execução: {config.posts_per_run}</Label>
              <Slider value={[config.posts_per_run]} onValueChange={([v]) => updateConfig({ posts_per_run: v })} min={1} max={10} step={1} />
            </div>
            <div className="space-y-2">
              <Label>Respostas por execução: {config.replies_per_run}</Label>
              <Slider value={[config.replies_per_run]} onValueChange={([v]) => updateConfig({ replies_per_run: v })} min={1} max={10} step={1} />
            </div>
            <div className="space-y-2">
              <Label>Curtidas por execução: {config.likes_per_run}</Label>
              <Slider value={[config.likes_per_run]} onValueChange={([v]) => updateConfig({ likes_per_run: v })} min={1} max={20} step={1} />
            </div>
          </div>

          {/* Random timing */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shuffle className="h-5 w-5 text-primary" />
                <div>
                  <Label className="text-base font-medium">Horários Randômicos</Label>
                  <p className="text-sm text-muted-foreground">
                    Distribui as ações ao longo do tempo para parecer mais natural
                  </p>
                </div>
              </div>
              <Switch
                checked={config.random_timing}
                onCheckedChange={(checked) => updateConfig({ random_timing: checked })}
              />
            </div>

            {config.random_timing && (
              <div className="space-y-2 pl-8">
                <Label>Delay máximo entre ações: {config.max_delay_minutes} min</Label>
                <Slider
                  value={[config.max_delay_minutes]}
                  onValueChange={([v]) => updateConfig({ max_delay_minutes: v })}
                  min={5}
                  max={120}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Cada ação terá um delay aleatório de 1 a {config.max_delay_minutes} minutos
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {hasChanges && (
              <Button onClick={() => saveConfig.mutate()} variant="outline" className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Configurações
              </Button>
            )}
            <Button onClick={() => runEngagement.mutate()} disabled={isRunning} className="flex-1 gap-2" size="lg">
              {isRunning ? (
                <><RefreshCw className="h-4 w-4 animate-spin" />Executando IA...</>
              ) : (
                <><Sparkles className="h-4 w-4" />Executar Agora</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Histórico de Ações</CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs.map((log) => {
                const cfg = actionConfig[log.action_type] || actionConfig.comment;
                const Icon = cfg.icon;
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`p-2 rounded-full ${cfg.bg}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {log.content && <p className="text-sm truncate">{log.content}</p>}
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">Nenhuma ação registrada ainda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIEngagementPanel;
