import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Shield,
  AlertTriangle,
  Activity,
  Users,
  Trash2,
  Download,
  RefreshCw,
  Search,
  Clock,
  Globe,
  Smartphone,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { supabase } from '@/integrations/supabase/client';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(var(--warning))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
];

const severityColors: Record<string, string> = {
  critical: 'destructive',
  error: 'destructive',
  warning: 'outline',
  info: 'secondary',
};

const actionTypeLabels: Record<string, string> = {
  role_change: 'Alteração de Papel',
  data_deletion: 'Exclusão de Dados',
  product_access: 'Acesso a Produto',
  admin_action: 'Ação Admin',
  auth_failure: 'Falha de Autenticação',
  user_creation: 'Criação de Usuário',
  data_export: 'Exportação de Dados',
};

export function SecurityAuditPanel() {
  const [dateRange, setDateRange] = useState('7');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch security audit logs
  const {
    data: auditLogs,
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ['security-audit-logs', dateRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(dateRange));
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select(
          'id, user_id, event_type, event_description, severity, ip_address, user_agent, metadata, created_at'
        )
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user access logs
  const {
    data: accessLogs,
    isLoading: accessLoading,
    refetch: refetchAccess,
  } = useQuery({
    queryKey: ['user-access-logs', dateRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(dateRange));
      const { data, error } = await supabase
        .from('user_access_logs')
        .select(
          'id, user_id, accessed_at, ip_address, user_agent, action_type, resource_path, product_id, session_id, metadata'
        )
        .gte('accessed_at', startDate.toISOString())
        .order('accessed_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch data deletion logs
  const {
    data: deletionLogs,
    isLoading: deletionLoading,
    refetch: refetchDeletion,
  } = useQuery({
    queryKey: ['data-deletion-logs', dateRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(dateRange));
      const { data, error } = await supabase
        .from('data_deletion_logs')
        .select(
          'id, user_id, user_email, status, tables_deleted, requested_at, completed_at, error_message'
        )
        .gte('requested_at', startDate.toISOString())
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate statistics
  const stats = {
    totalEvents: (auditLogs?.length || 0) + (accessLogs?.length || 0),
    criticalEvents:
      auditLogs?.filter(log => log.severity === 'critical' || log.severity === 'error').length || 0,
    deletionRequests: deletionLogs?.length || 0,
    uniqueUsers: new Set(
      [
        ...(auditLogs?.map(log => log.user_id) || []),
        ...(accessLogs?.map(log => log.user_id) || []),
      ].filter(Boolean)
    ).size,
  };

  // Process data for charts
  const activityByDay = (() => {
    const days = parseInt(dateRange);
    const result: Record<string, { date: string; security: number; access: number }> = {};

    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), i), 'dd/MM');
      result[date] = { date, security: 0, access: 0 };
    }

    auditLogs?.forEach(log => {
      const date = format(new Date(log.created_at), 'dd/MM');
      if (result[date]) result[date].security++;
    });

    accessLogs?.forEach(log => {
      const date = format(new Date(log.accessed_at), 'dd/MM');
      if (result[date]) result[date].access++;
    });

    return Object.values(result).reverse();
  })();

  const eventsByType = (() => {
    const counts: Record<string, number> = {};
    auditLogs?.forEach(log => {
      const type = log.event_type || 'other';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: actionTypeLabels[name] || name,
      value,
    }));
  })();

  const filteredAuditLogs = auditLogs?.filter(log => {
    const matchesSearch =
      searchTerm === '' ||
      log.event_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.event_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address?.includes(searchTerm);

    const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;

    return matchesSearch && matchesSeverity;
  });

  const handleRefresh = () => {
    refetchLogs();
    refetchAccess();
    refetchDeletion();
  };

  const isLoading = logsLoading || accessLoading || deletionLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Painel de Auditoria de Segurança
          </h2>
          <p className="text-muted-foreground">
            Monitore eventos de segurança, acessos e ações críticas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Últimas 24h</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Últimos {dateRange} dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.criticalEvents}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exclusões LGPD</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deletionRequests}</div>
            <p className="text-xs text-muted-foreground">Solicitações de exclusão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Com atividade no período</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="security">Logs de Segurança</TabsTrigger>
          <TabsTrigger value="access">Logs de Acesso</TabsTrigger>
          <TabsTrigger value="deletions">Exclusões LGPD</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Atividade por Dia</CardTitle>
                <CardDescription>Eventos de segurança e acessos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={activityByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="security"
                      stackId="1"
                      stroke="hsl(var(--destructive))"
                      fill="hsl(var(--destructive))"
                      fillOpacity={0.3}
                      name="Segurança"
                    />
                    <Area
                      type="monotone"
                      dataKey="access"
                      stackId="1"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      name="Acessos"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eventos por Tipo</CardTitle>
                <CardDescription>Distribuição de ações</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={eventsByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                      label={entry => entry.name}
                    >
                      {eventsByType.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Critical Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Eventos Críticos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {auditLogs
                  ?.filter(log => log.severity === 'critical' || log.severity === 'error')
                  .slice(0, 10)
                  .map(log => (
                    <div key={log.id} className="flex items-start gap-4 p-3 border-b last:border-0">
                      <div className="flex-shrink-0">
                        <Badge variant={severityColors[log.severity || 'info'] as any}>
                          {log.severity?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {actionTypeLabels[log.event_type || ''] || log.event_type}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {log.event_description}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                          </span>
                          {log.ip_address && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {log.ip_address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )) || (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum evento crítico encontrado
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Logs Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Segurança</CardTitle>
              <CardDescription>Ações sensíveis e eventos de segurança</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por ação, detalhes ou IP..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Severidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>User Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAuditLogs?.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={severityColors[log.severity || 'info'] as any}>
                            {log.severity?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {actionTypeLabels[log.event_type || ''] || log.event_type}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {log.event_description}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.ip_address || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">
                          {log.user_agent || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(!filteredAuditLogs || filteredAuditLogs.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum log encontrado para os filtros selecionados
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Logs Tab */}
        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Acesso</CardTitle>
              <CardDescription>Acessos a produtos e recursos</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Recurso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessLogs?.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.accessed_at), 'dd/MM/yyyy HH:mm:ss', {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="font-mono text-sm truncate max-w-[100px]">
                          {log.user_id?.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-mono text-sm truncate max-w-[100px]">
                          {log.product_id?.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action_type || 'view'}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {log.resource_path || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(!accessLogs || accessLogs.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum log de acesso encontrado
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LGPD Deletions Tab */}
        <TabsContent value="deletions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Solicitações de Exclusão (LGPD)
              </CardTitle>
              <CardDescription>
                Histórico de exclusões de dados solicitadas pelos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data Solicitação</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Conclusão</TableHead>
                      <TableHead>Tabelas Excluídas</TableHead>
                      <TableHead>Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletionLogs?.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.requested_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{log.user_email || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.status === 'completed'
                                ? 'default'
                                : log.status === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {log.status === 'completed'
                              ? 'Concluído'
                              : log.status === 'failed'
                                ? 'Falhou'
                                : log.status === 'pending'
                                  ? 'Pendente'
                                  : log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {log.completed_at
                            ? format(new Date(log.completed_at), 'dd/MM/yyyy HH:mm', {
                                locale: ptBR,
                              })
                            : '-'}
                        </TableCell>
                        <TableCell>{log.tables_deleted?.length || 0} tabelas</TableCell>
                        <TableCell className="max-w-[200px] truncate text-destructive">
                          {log.error_message || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(!deletionLogs || deletionLogs.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma solicitação de exclusão encontrada
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
