import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  DollarSign,
  Send,
  AlertTriangle,
  Zap,
  Gauge,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { supabase } from '@/integrations/supabase/client';
import {
  fetchSLAMetrics,
  fetchAICosts,
  fetchDeliveryStatus,
  fetchRecentErrors,
  fetchPerformanceMetrics,
} from '@/services/observabilityService';

// ─── Helpers ───
function PanelWrapper({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {title}
              </span>
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function MetricBar({
  label,
  value,
  target,
  unit,
  invert = false,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  invert?: boolean;
}) {
  const ratio = invert ? (target / Math.max(value, 1)) * 100 : (value / target) * 100;
  const capped = Math.min(ratio, 100);
  const isGood = invert ? value <= target : value >= target;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className={isGood ? 'text-emerald-400' : 'text-red-400'}>
          {value}
          {unit} / meta: {invert ? '≤' : '≥'}
          {target}
          {unit}
        </span>
      </div>
      <Progress
        value={capped}
        className={`h-2 ${isGood ? '[&>div]:bg-emerald-500' : '[&>div]:bg-red-500'}`}
      />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-center text-sm text-muted-foreground py-6">{message}</p>;
}

// ═══════════════════════════════════════════════
// 1 — SLA/SLO Metrics
// ═══════════════════════════════════════════════
function SLAPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['sla-metrics'],
    queryFn: fetchSLAMetrics,
    staleTime: 60000,
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  const d = data ?? { uptime: 99.9, errorsToday: 0, p95Latency: 0 };

  return (
    <div className="space-y-4">
      <MetricBar label="Uptime (7d)" value={d.uptime} target={99.5} unit="%" />
      <MetricBar label="Latência P95" value={d.p95Latency} target={3000} unit="ms" invert />
      <MetricBar label="Erros/dia" value={d.errorsToday} target={20} unit="" invert />
    </div>
  );
}

// ═══════════════════════════════════════════════
// 2 — AI Cost Summary
// ═══════════════════════════════════════════════
function AICostPanel() {
  const [days, setDays] = useState('30');
  const { data, isLoading } = useQuery({
    queryKey: ['ai-costs', days],
    queryFn: () => fetchAICosts(Number(days)),
  });

  const d = data ?? { daily: [], total: 0, textTotal: 0, imageTotal: 0 };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Card className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">${d.total}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Texto</p>
            <p className="text-lg font-bold">${d.textTotal}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Imagem</p>
            <p className="text-lg font-bold">${d.imageTotal}</p>
          </Card>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[100px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : d.daily.length === 0 ? (
        <EmptyState message="Nenhum custo de IA registrado no período." />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={d.daily}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" fontSize={10} />
            <YAxis fontSize={10} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={(v: number) => [`$${v}`, 'Custo']} />
            <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// 3 — Delivery Status
// ═══════════════════════════════════════════════
function DeliveryPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['delivery-status'],
    queryFn: fetchDeliveryStatus,
    staleTime: 60000,
  });

  if (isLoading) return <Skeleton className="h-20 w-full" />;
  const d = data ?? { sent: 0, delivered: 0, read: 0, deliveryRate: 0 };

  return (
    <div className="grid grid-cols-4 gap-3">
      <Card className="p-4 text-center">
        <p className="text-2xl font-bold">{d.sent}</p>
        <p className="text-xs text-muted-foreground">Enviadas</p>
      </Card>
      <Card className="p-4 text-center">
        <p className="text-2xl font-bold">{d.delivered}</p>
        <p className="text-xs text-muted-foreground">Entregues</p>
      </Card>
      <Card className="p-4 text-center">
        <p className="text-2xl font-bold">{d.read}</p>
        <p className="text-xs text-muted-foreground">Lidas</p>
      </Card>
      <Card className="p-4 text-center">
        <p className="text-2xl font-bold">{d.deliveryRate}%</p>
        <p className="text-xs text-muted-foreground">Taxa de Leitura</p>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 4 — Recent Errors (24h) + Spike Detection
// ═══════════════════════════════════════════════
function RecentErrorsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['recent-errors-24h'],
    queryFn: fetchRecentErrors,
    staleTime: 60000,
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  const d = data ?? { errors: [], hourly: [], hasSpike: false };

  return (
    <div className="space-y-4">
      {d.hasSpike && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive font-medium">
            ⚠️ Pico de erros detectado! Mais de 10 erros/hora nas últimas 24h.
          </span>
        </div>
      )}

      {d.hourly.length > 0 && (
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={d.hourly}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="hour" fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {d.errors.length === 0 ? (
        <EmptyState message="Nenhum erro nas últimas 24h. 🎉" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Erro</TableHead>
              <TableHead className="w-20">Contagem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {d.errors.map((e, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs">{i + 1}</TableCell>
                <TableCell className="text-xs max-w-[300px] truncate">{e.message}</TableCell>
                <TableCell className="text-xs font-bold">{e.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// 5 — Performance Metrics (P95/P99)
// ═══════════════════════════════════════════════
function PerformanceMetricsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['perf-metrics'],
    queryFn: fetchPerformanceMetrics,
    staleTime: 60000,
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  const d = data ?? { byType: [], slowest: [] };

  return (
    <div className="space-y-4">
      {d.byType.length === 0 ? (
        <EmptyState message="Nenhum dado de performance coletado ainda." />
      ) : (
        <>
          <p className="text-sm font-medium">Por Tipo de Operação</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>P95 (ms)</TableHead>
                <TableHead>P99 (ms)</TableHead>
                <TableHead>Execuções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.byType.map((t, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs capitalize">{t.type}</TableCell>
                  <TableCell className="text-xs">{t.p95}</TableCell>
                  <TableCell className="text-xs">{t.p99}</TableCell>
                  <TableCell className="text-xs">{t.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {d.slowest.length > 0 && (
            <>
              <p className="text-sm font-medium">Top 5 Mais Lentas</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Operação</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Duração (ms)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.slowest.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{i + 1}</TableCell>
                      <TableCell className="text-xs font-mono">{s.operation}</TableCell>
                      <TableCell className="text-xs">{s.type}</TableCell>
                      <TableCell className="text-xs font-bold">{s.duration}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// 6 — Web Vitals
// ═══════════════════════════════════════════════
function WebVitalsPanel() {
  const vitals = [
    {
      name: 'LCP',
      description: 'Largest Contentful Paint',
      good: 2500,
      adequate: 4000,
      unit: 'ms',
    },
    { name: 'FID', description: 'First Input Delay', good: 100, adequate: 300, unit: 'ms' },
    { name: 'CLS', description: 'Cumulative Layout Shift', good: 0.1, adequate: 0.25, unit: '' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Os Web Vitals são coletados no navegador dos usuários. Os thresholds abaixo são referência
        do Google.
      </p>
      <div className="grid grid-cols-3 gap-4">
        {vitals.map(v => (
          <Card key={v.name} className="p-4">
            <p className="text-lg font-bold">{v.name}</p>
            <p className="text-xs text-muted-foreground mb-3">{v.description}</p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>
                  Bom: {'<'}
                  {v.good}
                  {v.unit}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>
                  Adequado: {v.good}-{v.adequate}
                  {v.unit}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>
                  Ruim: {'>'}
                  {v.adequate}
                  {v.unit}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Coleta automatizada de métricas reais será habilitada na etapa de instrumentação do
        frontend.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 7 — Metrics Health Check
// ═══════════════════════════════════════════════
function MetricsHealthPanel() {
  const channels = [
    { name: 'Logs de Erros (client_error_logs)', icon: AlertTriangle },
    { name: 'Performance (performance_logs)', icon: Zap },
    { name: 'Uso de Features (feature_usage_logs)', icon: Gauge },
    { name: 'Audit Log (admin_audit_log)', icon: Shield },
    { name: 'Health Status (system_health_status)', icon: CheckCircle2 },
  ];

  const { data: counts, isLoading } = useQuery({
    queryKey: ['metrics-health-check'],
    queryFn: async () => {
      const results = await Promise.all([
        supabase.from('client_error_logs').select('id', { count: 'exact', head: true }),
        supabase.from('performance_logs').select('id', { count: 'exact', head: true }),
        supabase.from('feature_usage_logs').select('id', { count: 'exact', head: true }),
        supabase.from('admin_audit_log').select('id', { count: 'exact', head: true }),
        supabase.from('system_health_status').select('id', { count: 'exact', head: true }),
      ]);
      return results.map(r => r.count ?? 0);
    },
    staleTime: 60000,
  });

  return (
    <div className="space-y-3">
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="space-y-2">
          {channels.map((ch, i) => {
            const count = counts?.[i] ?? 0;
            const active = count > 0;
            return (
              <div
                key={ch.name}
                className="flex items-center justify-between p-3 rounded-md border"
              >
                <div className="flex items-center gap-2">
                  <ch.icon className="h-4 w-4" />
                  <span className="text-sm">{ch.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{count} registros</span>
                  <Badge
                    variant="outline"
                    className={
                      active
                        ? 'text-emerald-400 border-emerald-500/30'
                        : 'text-yellow-400 border-yellow-500/30'
                    }
                  >
                    {active ? 'Ativo' : 'Sem dados'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Need supabase import for MetricsHealthPanel

// ═══════════════════════════════════════════════
// MAIN CONTAINER
// ═══════════════════════════════════════════════
export const ObservabilityTab = () => {
  return (
    <div className="space-y-3">
      <PanelWrapper title="SLA / SLO Metrics" icon={Shield} defaultOpen={true}>
        <SLAPanel />
      </PanelWrapper>

      <PanelWrapper title="Custos de IA" icon={DollarSign}>
        <AICostPanel />
      </PanelWrapper>

      <PanelWrapper title="Status de Entrega (Notificações)" icon={Send}>
        <DeliveryPanel />
      </PanelWrapper>

      <PanelWrapper title="Erros Recentes (24h)" icon={AlertTriangle}>
        <RecentErrorsPanel />
      </PanelWrapper>

      <PanelWrapper title="Performance Metrics (P95/P99)" icon={Zap}>
        <PerformanceMetricsPanel />
      </PanelWrapper>

      <PanelWrapper title="Web Vitals" icon={Gauge}>
        <WebVitalsPanel />
      </PanelWrapper>

      <PanelWrapper title="Verificação de Métricas" icon={CheckCircle2}>
        <MetricsHealthPanel />
      </PanelWrapper>
    </div>
  );
};

export default ObservabilityTab;
