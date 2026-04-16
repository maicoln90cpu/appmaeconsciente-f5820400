import { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  Scan,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';


import { supabase } from '@/integrations/supabase/client';

interface ModerationLog {
  id: string;
  post_id: string;
  action: string;
  reason: string | null;
  sentiment_score: number | null;
  flagged_categories: string[] | null;
  reviewed_by: string | null;
  created_at: string;
}

const ACTION_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  approve: { label: 'Aprovado', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
  flag: { label: 'Sinalizado', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-700' },
  hide: { label: 'Oculto', icon: EyeOff, color: 'bg-red-100 text-red-700' },
};

const CATEGORY_LABELS: Record<string, string> = {
  luto_perda: 'Luto/Perda',
  emergencia_medica: 'Emergência Médica',
  violencia_domestica: 'Violência Doméstica',
  ideacao_suicida: 'Ideação Suicida',
  abuso: 'Abuso',
  conteudo_ofensivo: 'Conteúdo Ofensivo',
  spam_propaganda: 'Spam/Propaganda',
  desinformacao_medica: 'Desinformação Médica',
};

export const AutoModerationPanel = () => {
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['moderation-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_moderation_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as ModerationLog[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['moderation-stats'],
    queryFn: async () => {
      const { count: totalApproved } = await supabase
        .from('post_moderation_logs' as any)
        .select('*', { count: 'exact', head: true })
        .eq('action', 'approve');
      const { count: totalFlagged } = await supabase
        .from('post_moderation_logs' as any)
        .select('*', { count: 'exact', head: true })
        .eq('action', 'flag');
      const { count: totalHidden } = await supabase
        .from('post_moderation_logs' as any)
        .select('*', { count: 'exact', head: true })
        .eq('action', 'hide');
      return {
        approved: totalApproved || 0,
        flagged: totalFlagged || 0,
        hidden: totalHidden || 0,
      };
    },
  });

  const { data: flaggedPosts } = useQuery({
    queryKey: ['flagged-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, content, created_at, moderation_status, display_name')
        .eq('moderation_status', 'flagged')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const scanAllPosts = useMutation({
    mutationFn: async () => {
      setIsScanning(true);
      const { data: unmoderatedPosts, error } = await supabase
        .from('posts')
        .select('id, content')
        .eq('moderation_status', 'approved')
        .is('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!unmoderatedPosts || unmoderatedPosts.length === 0) {
        return { scanned: 0, flagged: 0, hidden: 0 };
      }

      let flagged = 0,
        hidden = 0;
      for (const post of unmoderatedPosts) {
        try {
          const { data, error: fnError } = await supabase.functions.invoke('moderate-post', {
            body: { postId: post.id, postContent: post.content, mode: 'moderate' },
          });
          if (fnError) continue;
          if (data?.action === 'flag') flagged++;
          if (data?.action === 'hide') hidden++;
        } catch {
          // continue
        }
      }
      return { scanned: unmoderatedPosts.length, flagged, hidden };
    },
    onSuccess: data => {
      toast.success(
        `Scan completo: ${data.scanned} posts, ${data.flagged} sinalizados, ${data.hidden} ocultos`
      );
      queryClient.invalidateQueries({ queryKey: ['moderation-logs'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['flagged-posts'] });
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
    onSettled: () => setIsScanning(false),
  });

  const reviewPost = useMutation({
    mutationFn: async ({ postId, action }: { postId: string; action: 'approve' | 'hide' }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase
        .from('posts')
        .update({
          moderation_status: action === 'approve' ? 'approved' : 'hidden',
          is_hidden: action === 'hide',
        })
        .eq('id', postId);

      await supabase.from('post_moderation_logs' as any).insert({
        post_id: postId,
        action: action,
        reason: `Revisão manual pelo admin`,
        reviewed_by: user?.id,
      });
    },
    onSuccess: () => {
      toast.success('Post atualizado');
      queryClient.invalidateQueries({ queryKey: ['flagged-posts'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Auto-Moderação por IA
        </h2>
        <p className="text-muted-foreground">
          Análise automática de sentimento e moderação de conteúdo
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            icon: CheckCircle2,
            value: stats?.approved || 0,
            label: 'Aprovados',
            bg: 'bg-green-100',
            color: 'text-green-600',
          },
          {
            icon: AlertTriangle,
            value: stats?.flagged || 0,
            label: 'Sinalizados',
            bg: 'bg-yellow-100',
            color: 'text-yellow-600',
          },
          {
            icon: EyeOff,
            value: stats?.hidden || 0,
            label: 'Ocultos',
            bg: 'bg-red-100',
            color: 'text-red-600',
          },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scan Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scanner de Moderação
          </CardTitle>
          <CardDescription>Analisa os últimos 20 posts aprovados usando IA</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => scanAllPosts.mutate()}
            disabled={isScanning}
            className="w-full gap-2"
            size="lg"
          >
            {isScanning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analisando posts...
              </>
            ) : (
              <>
                <Scan className="h-4 w-4" />
                Executar Scan de Moderação
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Flagged Posts for Review */}
      {flaggedPosts && flaggedPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Posts Sinalizados ({flaggedPosts.length})
            </CardTitle>
            <CardDescription>Posts que precisam de revisão humana</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {flaggedPosts.map(post => (
              <div
                key={post.id}
                className="p-4 rounded-lg border bg-yellow-50/50 dark:bg-yellow-900/10 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{post.display_name || 'Anônimo'}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(post.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                  </span>
                </div>
                <p className="text-sm">
                  {post.content?.substring(0, 200)}
                  {(post.content?.length || 0) > 200 ? '...' : ''}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => reviewPost.mutate({ postId: post.id, action: 'approve' })}
                  >
                    <CheckCircle2 className="h-3 w-3" /> Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1"
                    onClick={() => reviewPost.mutate({ postId: post.id, action: 'hide' })}
                  >
                    <EyeOff className="h-3 w-3" /> Ocultar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Moderation History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Moderação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs.map(log => {
                const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.approve;
                const Icon = cfg.icon;
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`p-2 rounded-full ${cfg.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {cfg.label}
                        </Badge>
                        {log.sentiment_score !== null && (
                          <Badge variant="secondary" className="text-xs">
                            Sentimento: {(log.sentiment_score * 100).toFixed(0)}%
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                      {log.reason && <p className="text-sm text-muted-foreground">{log.reason}</p>}
                      {log.flagged_categories && log.flagged_categories.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {log.flagged_categories.map(cat => (
                            <Badge key={cat} variant="destructive" className="text-xs">
                              {CATEGORY_LABELS[cat] || cat}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">Nenhuma moderação registrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoModerationPanel;
