import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Bot, 
  MessageSquare, 
  Heart, 
  RefreshCw,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle
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

export const AIEngagementPanel = () => {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [commentsPerRun, setCommentsPerRun] = useState([5]);
  const [likesPerRun, setLikesPerRun] = useState([10]);

  // Fetch engagement logs using raw query to avoid type issues
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["ai-engagement-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_engagement_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as unknown as EngagementLog[];
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["ai-engagement-stats"],
    queryFn: async () => {
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
        total_comments: commentsCount || 0,
        total_likes: likesCount || 0,
        posts_engaged: (commentsCount || 0) + (likesCount || 0),
        last_run: (lastLog as any)?.created_at || null,
      };
    },
  });

  // Run AI engagement
  const runEngagement = useMutation({
    mutationFn: async () => {
      setIsRunning(true);
      const { data, error } = await supabase.functions.invoke("auto-engage-community", {
        body: {
          maxComments: commentsPerRun[0],
          maxLikes: likesPerRun[0],
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        `IA engajou a comunidade! ${data.comments_created || 0} comentários, ${data.likes_created || 0} curtidas`
      );
      queryClient.invalidateQueries({ queryKey: ["ai-engagement-logs"] });
      queryClient.invalidateQueries({ queryKey: ["ai-engagement-stats"] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao executar IA: ${error.message}`);
    },
    onSettled: () => {
      setIsRunning(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Automação IA - Comunidade
          </h2>
          <p className="text-muted-foreground">
            Engajamento automático com comentários e curtidas gerados por IA
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_comments || 0}</p>
                <p className="text-sm text-muted-foreground">Comentários IA</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-100">
                <Heart className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_likes || 0}</p>
                <p className="text-sm text-muted-foreground">Curtidas IA</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Sparkles className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.posts_engaged || 0}</p>
                <p className="text-sm text-muted-foreground">Total Interações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {stats?.last_run 
                    ? format(new Date(stats.last_run), "dd/MM HH:mm", { locale: ptBR })
                    : "Nunca"}
                </p>
                <p className="text-sm text-muted-foreground">Última Execução</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Executar Manualmente
          </CardTitle>
          <CardDescription>
            Execute a IA agora para comentar e curtir posts recentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Comentários por execução: {commentsPerRun[0]}</Label>
              <Slider value={commentsPerRun} onValueChange={setCommentsPerRun} min={1} max={20} step={1} />
            </div>
            <div className="space-y-2">
              <Label>Curtidas por execução: {likesPerRun[0]}</Label>
              <Slider value={likesPerRun} onValueChange={setLikesPerRun} min={1} max={50} step={1} />
            </div>
          </div>

          <Button onClick={() => runEngagement.mutate()} disabled={isRunning} className="w-full gap-2" size="lg">
            {isRunning ? (
              <><RefreshCw className="h-4 w-4 animate-spin" />Executando IA...</>
            ) : (
              <><Sparkles className="h-4 w-4" />Executar Agora</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Histórico de Ações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`p-2 rounded-full ${log.action_type === "comment" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"}`}>
                    {log.action_type === "comment" ? <MessageSquare className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {log.action_type === "comment" ? "Comentário" : "Curtida"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {log.content && <p className="text-sm truncate">{log.content}</p>}
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                </div>
              ))}
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
