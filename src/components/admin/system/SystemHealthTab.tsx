import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortableTableHeader } from "./SortableTableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import {
  fetchHealthStatus,
  fetchHealthLogs,
  fetchClientErrors,
  fetchPerformanceLogs,
  fetchFeatureUsage,
  fetchAuditLog,
  fetchCronJobLogs,
  groupErrorsByComponent,
  aggregatePerformance,
  aggregateFeatureUsage,
  aggregateCronJobs,
  exportAuditLogCSV,
} from "@/services/systemHealthService";
import {
  Activity, TrendingUp, AlertTriangle, Zap, Users, Link2, Clock,
  ListOrdered, BarChart3, FileText, ChevronDown, ChevronRight,
  Download, Search, RefreshCw,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from "recharts";

// ─── Helpers ───
function scoreBadge(score: number) {
  if (score >= 80) return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Saudável</Badge>;
  if (score >= 50) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Atenção</Badge>;
  return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Crítico</Badge>;
}

function latencyBadge(ms: number) {
  if (ms < 200) return <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">Bom</Badge>;
  if (ms <= 1000) return <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">Atenção</Badge>;
  return <Badge variant="outline" className="text-red-400 border-red-500/30">Lento</Badge>;
}

function cronRateBadge(rate: number) {
  if (rate >= 95) return <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">{rate}%</Badge>;
  if (rate >= 70) return <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">{rate}%</Badge>;
  return <Badge variant="outline" className="text-red-400 border-red-500/30">{rate}%</Badge>;
}

function PanelWrapper({ title, icon: Icon, defaultOpen = false, children }: {
  title: string; icon: React.ElementType; defaultOpen?: boolean; children: React.ReactNode;
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

function PeriodSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[100px] h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7">7 dias</SelectItem>
        <SelectItem value="30">30 dias</SelectItem>
        <SelectItem value="90">90 dias</SelectItem>
      </SelectContent>
    </Select>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-center text-sm text-muted-foreground py-6">{message}</p>;
}

// ═══════════════════════════════════════════════
// PANEL 1 — Health Score
// ═══════════════════════════════════════════════
function HealthScorePanel() {
  const { data, isLoading } = useQuery({ queryKey: ["system-health-status"], queryFn: fetchHealthStatus });

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  const modules = data ?? [];
  const overallScore = modules.length > 0
    ? Math.round(modules.reduce((s, m) => s + (m.score ?? 0), 0) / modules.length)
    : 100;

  const allIssues = modules.flatMap((m) => {
    const issues = (m.issues as Array<{ severity: string; message: string }>) ?? [];
    return issues.map((i) => ({ ...i, module: m.module_name }));
  }).sort((a, b) => {
    const order: Record<string, number> = { critical: 0, warning: 1, info: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  const allRecs = modules.flatMap((m) => {
    const recs = (m.recommendations as Array<{ priority: string; message: string }>) ?? [];
    return recs.map((r) => ({ ...r, module: m.module_name }));
  });

  return (
    <div className="space-y-4">
      {/* Overall */}
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold">{overallScore}</div>
        <div>
          <p className="text-sm text-muted-foreground">Score Geral</p>
          {scoreBadge(overallScore)}
        </div>
      </div>

      {/* Per module */}
      {modules.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {modules.map((m) => (
            <Card key={m.id} className="p-3">
              <p className="text-xs text-muted-foreground capitalize">{m.module_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold">{m.score ?? 0}</span>
                {scoreBadge(m.score ?? 0)}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState message="Nenhum módulo monitorado. Execute a análise para gerar scores." />
      )}

      {/* Issues */}
      {allIssues.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Problemas ({allIssues.length})</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {allIssues.map((i, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className={
                  i.severity === "critical" ? "text-red-400 border-red-500/30" :
                  i.severity === "warning" ? "text-yellow-400 border-yellow-500/30" :
                  "text-blue-400 border-blue-500/30"
                }>{i.severity}</Badge>
                <span className="text-muted-foreground">[{i.module}]</span>
                <span>{i.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {allRecs.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Recomendações ({allRecs.length})</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {allRecs.map((r, idx) => (
              <div key={idx} className="text-xs flex items-center gap-2">
                <Badge variant="outline" className="text-muted-foreground">{r.priority}</Badge>
                <span>{r.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// PANEL 2 — Score Trends
// ═══════════════════════════════════════════════
function ScoreTrendsPanel() {
  const [days, setDays] = useState("7");
  const { data, isLoading } = useQuery({
    queryKey: ["system-health-logs", days],
    queryFn: () => fetchHealthLogs(Number(days)),
  });

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const byDate = new Map<string, Record<string, number>>();
    for (const log of data) {
      const date = new Date(log.recorded_at).toLocaleDateString("pt-BR");
      const entry = byDate.get(date) ?? {};
      entry[log.module_name] = log.score;
      byDate.set(date, entry);
    }
    return Array.from(byDate.entries()).map(([date, scores]) => ({ date, ...scores }));
  }, [data]);

  const modules = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map((d) => d.module_name))];
  }, [data]);

  const colors = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><PeriodSelect value={days} onChange={setDays} /></div>
      {isLoading ? <Skeleton className="h-48 w-full" /> : chartData.length === 0 ? (
        <EmptyState message="Sem dados de tendência para o período." />
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" fontSize={11} />
            <YAxis domain={[0, 100]} fontSize={11} />
            <Tooltip />
            <Legend />
            {modules.map((m, i) => (
              <Line key={m} type="monotone" dataKey={m} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// PANEL 3 — Frontend Errors
// ═══════════════════════════════════════════════
function FrontendErrorsPanel() {
  const [days, setDays] = useState("7");
  const { data, isLoading } = useQuery({
    queryKey: ["client-errors", days],
    queryFn: () => fetchClientErrors(Number(days)),
  });

  const grouped = useMemo(() => groupErrorsByComponent(data ?? []), [data]);
  const { sortConfig, handleSort, sortedData } = useTableSort(grouped, "count");
  const { paginatedData, currentPage, totalPages, setCurrentPage } = usePagination(sortedData, 10);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{grouped.length} erros agrupados</p>
        <PeriodSelect value={days} onChange={setDays} />
      </div>
      {isLoading ? <Skeleton className="h-32 w-full" /> : grouped.length === 0 ? (
        <EmptyState message="Nenhum erro registrado no período. 🎉" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <SortableTableHeader label="Componente" sortKey="component" currentSort={sortConfig} onSort={handleSort} />
                <SortableTableHeader label="Mensagem" sortKey="message" currentSort={sortConfig} onSort={handleSort} />
                <SortableTableHeader label="Contagem" sortKey="count" currentSort={sortConfig} onSort={handleSort} />
                <SortableTableHeader label="Última" sortKey="lastOccurrence" currentSort={sortConfig} onSort={handleSort} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((e, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs">{(currentPage - 1) * 10 + i + 1}</TableCell>
                  <TableCell className="text-xs font-mono">{e.component}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{e.message}</TableCell>
                  <TableCell className="text-xs font-bold">{e.count}</TableCell>
                  <TableCell className="text-xs">{new Date(e.lastOccurrence).toLocaleString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Pág. {currentPage}/{totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage <= 1}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages}>Próxima</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// PANEL 4 — Performance
// ═══════════════════════════════════════════════
function PerformancePanel() {
  const [days, setDays] = useState("7");
  const { data, isLoading } = useQuery({
    queryKey: ["performance-logs", days],
    queryFn: () => fetchPerformanceLogs(Number(days)),
  });

  const aggregated = useMemo(() => aggregatePerformance(data ?? []), [data]);
  const { sortConfig, handleSort, sortedData } = useTableSort(aggregated, "avg");
  const { paginatedData, currentPage, totalPages, setCurrentPage } = usePagination(sortedData, 10);

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><PeriodSelect value={days} onChange={setDays} /></div>
      {isLoading ? <Skeleton className="h-32 w-full" /> : aggregated.length === 0 ? (
        <EmptyState message="Nenhuma operação monitorada no período." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <SortableTableHeader label="Operação" sortKey="operation" currentSort={sortConfig} onSort={handleSort} />
                <SortableTableHeader label="Tipo" sortKey="type" currentSort={sortConfig} onSort={handleSort} />
                <SortableTableHeader label="Média(ms)" sortKey="avg" currentSort={sortConfig} onSort={handleSort} />
                <SortableTableHeader label="Máx(ms)" sortKey="max" currentSort={sortConfig} onSort={handleSort} />
                <SortableTableHeader label="Execuções" sortKey="count" currentSort={sortConfig} onSort={handleSort} />
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs">{(currentPage - 1) * 10 + i + 1}</TableCell>
                  <TableCell className="text-xs font-mono">{p.operation}</TableCell>
                  <TableCell className="text-xs">{p.type}</TableCell>
                  <TableCell className="text-xs">{p.avg}</TableCell>
                  <TableCell className="text-xs">{p.max}</TableCell>
                  <TableCell className="text-xs">{p.count}</TableCell>
                  <TableCell>{latencyBadge(p.avg)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Pág. {currentPage}/{totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage <= 1}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages}>Próxima</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// PANEL 5 — Active Sessions (estimated from profiles)
// ═══════════════════════════════════════════════
function ActiveSessionsPanel() {
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["active-sessions-estimate"],
    queryFn: async () => {
      const { count } = await (await import("@/integrations/supabase/client")).supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      return { total: count ?? 0 };
    },
  });

  return (
    <div className="grid grid-cols-3 gap-3">
      {isLoading ? (
        <>
          <Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" />
        </>
      ) : (
        <>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold">{profiles?.total ?? 0}</p>
            <p className="text-xs text-muted-foreground">Usuários Cadastrados</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">Sessões Ativas</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">Chamadas IA Hoje</p>
          </Card>
        </>
      )}
      <p className="col-span-3 text-xs text-muted-foreground text-center">
        Sessões ativas e chamadas IA serão habilitadas com a Edge Function de monitoramento.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════
// PANEL 6 — External Integrations
// ═══════════════════════════════════════════════
function IntegrationsPanel() {
  const integrations = [
    { name: "Hotmart (Pagamentos)", status: "connected" as const, icon: "💳" },
    { name: "Resend (E-mail)", status: "connected" as const, icon: "📧" },
    { name: "WhatsApp (Evolution)", status: "not_configured" as const, icon: "📱" },
    { name: "Google Tag Manager", status: "connected" as const, icon: "📊" },
  ];

  const statusMap = {
    connected: { label: "Conectado", className: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
    error: { label: "Erro", className: "text-red-400 border-red-500/30 bg-red-500/10" },
    not_configured: { label: "Não Configurado", className: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {integrations.map((int) => {
        const st = statusMap[int.status];
        return (
          <Card key={int.name} className="p-4 text-center">
            <p className="text-2xl mb-1">{int.icon}</p>
            <p className="text-sm font-medium">{int.name}</p>
            <Badge variant="outline" className={`mt-2 ${st.className}`}>{st.label}</Badge>
          </Card>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════
// PANEL 7 — Cron Monitor
// ═══════════════════════════════════════════════
function CronMonitorPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["cron-job-logs"],
    queryFn: () => fetchCronJobLogs(30),
  });

  const aggregated = useMemo(() => aggregateCronJobs(data ?? []), [data]);

  return isLoading ? <Skeleton className="h-32 w-full" /> : aggregated.length === 0 ? (
    <EmptyState message="Nenhum log de cron registrado ainda." />
  ) : (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Job</TableHead>
          <TableHead>Frequência</TableHead>
          <TableHead>Última Execução</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Duração Média</TableHead>
          <TableHead>Taxa Sucesso</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {aggregated.map((c, i) => (
          <TableRow key={i}>
            <TableCell className="text-xs">{i + 1}</TableCell>
            <TableCell className="text-xs font-mono">{c.job}</TableCell>
            <TableCell className="text-xs">{c.schedule}</TableCell>
            <TableCell className="text-xs">{new Date(c.lastRun).toLocaleString("pt-BR")}</TableCell>
            <TableCell>
              <Badge variant="outline" className={c.lastStatus === "success" ? "text-emerald-400" : "text-red-400"}>
                {c.lastStatus}
              </Badge>
            </TableCell>
            <TableCell className="text-xs">{c.avgDuration}ms</TableCell>
            <TableCell>{cronRateBadge(c.successRate)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ═══════════════════════════════════════════════
// PANEL 8 — Queue Monitor
// ═══════════════════════════════════════════════
function QueueMonitorPanel() {
  return (
    <div className="grid grid-cols-4 gap-3">
      <Card className="p-4 text-center">
        <p className="text-2xl font-bold">—</p>
        <p className="text-xs text-muted-foreground">Pendentes</p>
      </Card>
      <Card className="p-4 text-center">
        <p className="text-2xl font-bold">—</p>
        <p className="text-xs text-muted-foreground">Processando</p>
      </Card>
      <Card className="p-4 text-center">
        <p className="text-2xl font-bold">—</p>
        <p className="text-xs text-muted-foreground">Concluídas (24h)</p>
      </Card>
      <Card className="p-4 text-center">
        <p className="text-2xl font-bold">—</p>
        <p className="text-xs text-muted-foreground">Falhas (24h)</p>
      </Card>
      <p className="col-span-4 text-xs text-muted-foreground text-center">
        O monitor de filas será ativado quando a tabela notification_queue for criada.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════
// PANEL 9 — Feature Usage
// ═══════════════════════════════════════════════
function FeatureUsagePanel() {
  const [days, setDays] = useState("30");
  const { data, isLoading } = useQuery({
    queryKey: ["feature-usage", days],
    queryFn: () => fetchFeatureUsage(Number(days)),
  });

  const aggregated = useMemo(() => aggregateFeatureUsage(data ?? []), [data]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><PeriodSelect value={days} onChange={setDays} /></div>
      {isLoading ? <Skeleton className="h-48 w-full" /> : aggregated.length === 0 ? (
        <EmptyState message="Nenhum uso de funcionalidade registrado no período." />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={aggregated} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis type="number" fontSize={11} />
            <YAxis type="category" dataKey="name" fontSize={11} width={110} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// PANEL 10 — Audit Log
// ═══════════════════════════════════════════════
function AuditLogPanel() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const { data, isLoading } = useQuery({ queryKey: ["admin-audit-log"], queryFn: () => fetchAuditLog(90) });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((r) => {
      if (actionFilter !== "all" && r.action !== actionFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          r.action.toLowerCase().includes(s) ||
          (r.entity_type ?? "").toLowerCase().includes(s) ||
          (r.entity_id ?? "").toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [data, search, actionFilter]);

  const actions = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map((r) => r.action))];
  }, [data]);

  const { paginatedData, currentPage, totalPages, setCurrentPage } = usePagination(filtered, 10);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Ação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => data && exportAuditLogCSV(data)} disabled={!data?.length}>
          <Download className="h-3 w-3 mr-1" /> CSV
        </Button>
      </div>

      {isLoading ? <Skeleton className="h-32 w-full" /> : filtered.length === 0 ? (
        <EmptyState message="Nenhum registro encontrado." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((r, i) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{(currentPage - 1) * 10 + i + 1}</TableCell>
                  <TableCell className="text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-xs font-mono">{r.admin_id.slice(0, 8)}...</TableCell>
                  <TableCell className="text-xs">{r.action}</TableCell>
                  <TableCell className="text-xs">{r.entity_type ?? "—"}</TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate">
                    {r.metadata ? JSON.stringify(r.metadata).slice(0, 50) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Pág. {currentPage}/{totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage <= 1}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages}>Próxima</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN CONTAINER
// ═══════════════════════════════════════════════
export const SystemHealthTab = () => {
  return (
    <div className="space-y-3">
      <PanelWrapper title="Saúde do Sistema (Health Score)" icon={Activity} defaultOpen={true}>
        <HealthScorePanel />
      </PanelWrapper>

      <PanelWrapper title="Tendência de Score" icon={TrendingUp}>
        <ScoreTrendsPanel />
      </PanelWrapper>

      <PanelWrapper title="Erros do Frontend" icon={AlertTriangle}>
        <FrontendErrorsPanel />
      </PanelWrapper>

      <PanelWrapper title="Performance de Operações" icon={Zap}>
        <PerformancePanel />
      </PanelWrapper>

      <PanelWrapper title="Sessões Ativas" icon={Users}>
        <ActiveSessionsPanel />
      </PanelWrapper>

      <PanelWrapper title="Integrações Externas" icon={Link2}>
        <IntegrationsPanel />
      </PanelWrapper>

      <PanelWrapper title="Monitoramento de Automações (Cron)" icon={Clock}>
        <CronMonitorPanel />
      </PanelWrapper>

      <PanelWrapper title="Monitor de Filas" icon={ListOrdered}>
        <QueueMonitorPanel />
      </PanelWrapper>

      <PanelWrapper title="Uso de Funcionalidades" icon={BarChart3}>
        <FeatureUsagePanel />
      </PanelWrapper>

      <PanelWrapper title="Log de Atividades (Audit Log)" icon={FileText}>
        <AuditLogPanel />
      </PanelWrapper>
    </div>
  );
};

export default SystemHealthTab;
