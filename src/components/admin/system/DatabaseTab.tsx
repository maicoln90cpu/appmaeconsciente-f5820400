import { useState, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import {
  Database,
  TableProperties,
  Workflow,
  Clock,
  Cloud,
  Search,
  Layers,
  Hash,
  HardDrive,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { usePagination } from '@/hooks/usePagination';
import { useTableSort } from '@/hooks/useTableSort';

import { SortableTableHeader } from './SortableTableHeader';


import {
  fetchDatabaseStats,
  TABLE_DESCRIPTIONS,
  TRIGGERS_CATALOG,
  CRON_JOBS_CATALOG,
  EDGE_FUNCTIONS_CATALOG,
} from '@/services/databaseMonitorService';


function EmptyState({ message }: { message: string }) {
  return <p className="text-center text-sm text-muted-foreground py-6">{message}</p>;
}

// ═══════════════════════════════════════════════
// 1 — Overview
// ═══════════════════════════════════════════════
function OverviewSubTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['database-stats'],
    queryFn: fetchDatabaseStats,
    staleTime: 120000,
  });

  if (isLoading)
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );

  if (!data)
    return (
      <EmptyState message="Não foi possível carregar as estatísticas. Verifique se a função de monitoramento está ativa." />
    );

  const tables = (data.tables as Array<{ table_name: string; row_count: number }>) ?? [];

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <Layers className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold">{data.total_tables ?? tables.length}</p>
          <p className="text-xs text-muted-foreground">Tabelas</p>
        </Card>
        <Card className="p-4 text-center">
          <Hash className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold">{(data.total_rows ?? 0).toLocaleString('pt-BR')}</p>
          <p className="text-xs text-muted-foreground">Total de Registros</p>
        </Card>
        <Card className="p-4 text-center">
          <Workflow className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold">{TRIGGERS_CATALOG.length}</p>
          <p className="text-xs text-muted-foreground">Triggers</p>
        </Card>
        <Card className="p-4 text-center">
          <Cloud className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold">{EDGE_FUNCTIONS_CATALOG.length}</p>
          <p className="text-xs text-muted-foreground">Edge Functions</p>
        </Card>
      </div>

      {/* Top tables by row count */}
      {tables.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Maiores Tabelas (por registros)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Tabela</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Registros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.slice(0, 10).map((t, i) => (
                  <TableRow key={t.table_name}>
                    <TableCell className="text-xs">{i + 1}</TableCell>
                    <TableCell className="text-xs font-mono">{t.table_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {TABLE_DESCRIPTIONS[t.table_name] ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-right font-bold">
                      {t.row_count.toLocaleString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data.cache_hit_ratio != null && (
        <Card className="p-4">
          <p className="text-sm font-medium">Cache Hit Ratio</p>
          <p className="text-2xl font-bold">{data.cache_hit_ratio}%</p>
          <p className="text-xs text-muted-foreground">
            {data.cache_hit_ratio >= 99
              ? 'Excelente'
              : data.cache_hit_ratio >= 95
                ? 'Bom'
                : data.cache_hit_ratio >= 90
                  ? 'Atenção'
                  : 'Crítico'}
            {' — '}percentual de consultas atendidas pelo cache do banco
          </p>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// 2 — Tables & Shortcuts
// ═══════════════════════════════════════════════
function TablesSubTab() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['database-stats'],
    queryFn: fetchDatabaseStats,
    staleTime: 120000,
  });

  const tables = useMemo(() => {
    const raw = (data?.tables as Array<{ table_name: string; row_count: number }>) ?? [];
    const withDesc = raw.map(t => ({
      ...t,
      description: TABLE_DESCRIPTIONS[t.table_name] ?? '—',
    }));
    if (!search) return withDesc;
    const s = search.toLowerCase();
    return withDesc.filter(
      t => t.table_name.toLowerCase().includes(s) || t.description.toLowerCase().includes(s)
    );
  }, [data, search]);

  const { sortConfig, handleSort, sortedData } = useTableSort(tables, 'row_count');
  const { paginatedData, currentPage, totalPages, setCurrentPage } = usePagination(sortedData, 15);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tabela..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : tables.length === 0 ? (
        <EmptyState message="Nenhuma tabela encontrada." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <SortableTableHeader
                  label="Tabela"
                  sortKey="table_name"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                <TableHead>Descrição</TableHead>
                <SortableTableHeader
                  label="Registros"
                  sortKey="row_count"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  className="text-right"
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((t, i) => (
                <TableRow key={t.table_name}>
                  <TableCell className="text-xs">{(currentPage - 1) * 15 + i + 1}</TableCell>
                  <TableCell className="text-xs font-mono">{t.table_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.description}</TableCell>
                  <TableCell className="text-xs text-right font-bold">
                    {t.row_count.toLocaleString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Pág. {currentPage}/{totalPages} ({tables.length} tabelas)
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// 3 — Triggers
// ═══════════════════════════════════════════════
function TriggersSubTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {TRIGGERS_CATALOG.length} triggers ativos no sistema
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Tabela</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Descrição</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {TRIGGERS_CATALOG.map((t, i) => (
            <TableRow key={t.name}>
              <TableCell className="text-xs">{i + 1}</TableCell>
              <TableCell className="text-xs font-mono">{t.table}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {t.event}
                </Badge>
              </TableCell>
              <TableCell className="text-xs font-mono">{t.fn}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{t.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 4 — Cron Jobs
// ═══════════════════════════════════════════════
function CronJobsSubTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{CRON_JOBS_CATALOG.length} tarefas agendadas</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Frequência</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {CRON_JOBS_CATALOG.map((j, i) => (
            <TableRow key={j.name}>
              <TableCell className="text-xs">{i + 1}</TableCell>
              <TableCell className="text-xs font-mono">{j.name}</TableCell>
              <TableCell className="text-xs">{j.frequency}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{j.description}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                  {j.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 5 — Edge Functions
// ═══════════════════════════════════════════════
function EdgeFunctionsSubTab() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(
    () => [...new Set(EDGE_FUNCTIONS_CATALOG.map(f => f.category))].sort(),
    []
  );

  const filtered = useMemo(() => {
    return EDGE_FUNCTIONS_CATALOG.filter(f => {
      if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return f.name.toLowerCase().includes(s) || f.description.toLowerCase().includes(s);
      }
      return true;
    });
  }, [search, categoryFilter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar função..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="h-8 px-2 text-xs border rounded-md bg-background"
        >
          <option value="all">Todas ({EDGE_FUNCTIONS_CATALOG.length})</option>
          {categories.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} funções encontradas</p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Trigger</TableHead>
            <TableHead>Descrição</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((f, i) => (
            <TableRow key={f.name}>
              <TableCell className="text-xs">{i + 1}</TableCell>
              <TableCell className="text-xs font-mono">{f.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {f.category}
                </Badge>
              </TableCell>
              <TableCell className="text-xs">{f.trigger}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{f.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN CONTAINER
// ═══════════════════════════════════════════════
export const DatabaseTab = () => {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-4">
        <TabsTrigger value="overview" className="flex items-center gap-1 text-xs">
          <Database className="h-3 w-3" /> Visão Geral
        </TabsTrigger>
        <TabsTrigger value="tables" className="flex items-center gap-1 text-xs">
          <TableProperties className="h-3 w-3" /> Tabelas
        </TabsTrigger>
        <TabsTrigger value="triggers" className="flex items-center gap-1 text-xs">
          <Workflow className="h-3 w-3" /> Triggers
        </TabsTrigger>
        <TabsTrigger value="cron" className="flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" /> Cron Jobs
        </TabsTrigger>
        <TabsTrigger value="functions" className="flex items-center gap-1 text-xs">
          <Cloud className="h-3 w-3" /> Edge Functions
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewSubTab />
      </TabsContent>
      <TabsContent value="tables">
        <TablesSubTab />
      </TabsContent>
      <TabsContent value="triggers">
        <TriggersSubTab />
      </TabsContent>
      <TabsContent value="cron">
        <CronJobsSubTab />
      </TabsContent>
      <TabsContent value="functions">
        <EdgeFunctionsSubTab />
      </TabsContent>
    </Tabs>
  );
};

export default DatabaseTab;
