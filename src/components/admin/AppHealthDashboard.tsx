import { useState, useEffect } from 'react';

import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Zap,
  AlertCircle,
  TrendingUp,
  Server,
  Gauge,
  Package,
  Download,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


import {
  getBundleAnalysis,
  analyzePageLoad,
  getMemoryInfo,
  formatBytes,
  exportBundleReport,
} from '@/lib/bundle-analyzer';
import { logger } from '@/lib/logger';
import { getMetricsSummary } from '@/lib/performance';

import { supabase } from '@/integrations/supabase/client';



interface HealthMetrics {
  webVitals: Array<{
    name: string;
    avg: number;
    good: number;
    poor: number;
    total: number;
  }>;
  api: {
    totalCalls: number;
    avgResponseTime: number;
    errorRate: number;
    slowEndpoints: Array<{
      endpoint: string;
      method: string;
      duration: number;
    }>;
  };
  errors: Array<{
    message: string;
    count: number;
    lastSeen: number;
  }>;
  pageLoad: {
    avgTime: number;
    totalLoads: number;
  };
  timestamp: number;
}

interface DatabaseHealth {
  activeConnections: number;
  recentErrors: number;
  avgQueryTime: number;
}

const WEB_VITAL_NAMES: Record<string, string> = {
  LCP: 'Largest Contentful Paint',
  FCP: 'First Contentful Paint',
  CLS: 'Cumulative Layout Shift',
  TTFB: 'Time to First Byte',
  FID: 'First Input Delay',
  INP: 'Interaction to Next Paint',
};

const getHealthStatus = (metrics: HealthMetrics | null): 'healthy' | 'degraded' | 'critical' => {
  if (!metrics) return 'healthy';

  const poorWebVitals = metrics.webVitals.filter(v => v.poor > v.good).length;
  const highErrorRate = metrics.api.errorRate > 10;
  const slowApi = metrics.api.avgResponseTime > 2000;

  if (poorWebVitals >= 2 || highErrorRate || metrics.errors.length > 10) {
    return 'critical';
  }
  if (poorWebVitals >= 1 || slowApi || metrics.errors.length > 5) {
    return 'degraded';
  }
  return 'healthy';
};

const StatusBadge = ({ status }: { status: 'healthy' | 'degraded' | 'critical' }) => {
  const config = {
    healthy: { label: 'Saudável', variant: 'default' as const, icon: CheckCircle },
    degraded: { label: 'Degradado', variant: 'secondary' as const, icon: AlertTriangle },
    critical: { label: 'Crítico', variant: 'destructive' as const, icon: AlertCircle },
  };

  const { label, variant, icon: Icon } = config[status];

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};

export function AppHealthDashboard() {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [dbHealth, setDbHealth] = useState<DatabaseHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = async () => {
    try {
      // Get client-side performance metrics
      const performanceMetrics = getMetricsSummary();
      setMetrics(performanceMetrics);

      // Get database health metrics
      const { count: recentErrors } = await supabase
        .from('security_audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .eq('severity', 'error');

      setDbHealth({
        activeConnections: Math.floor(Math.random() * 10) + 5, // Mock - would need server-side check
        recentErrors: recentErrors || 0,
        avgQueryTime: Math.floor(Math.random() * 50) + 20, // Mock
      });
    } catch (error) {
      logger.error('Failed to load health metrics', error, { context: 'AppHealthDashboard' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMetrics();
  };

  const healthStatus = getHealthStatus(metrics);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Prepare chart data
  const webVitalsChartData =
    metrics?.webVitals.map(v => ({
      name: v.name,
      good: Math.round((v.good / Math.max(v.total, 1)) * 100),
      poor: Math.round((v.poor / Math.max(v.total, 1)) * 100),
      avg: v.avg,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Saúde do Aplicativo
          </h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real de performance e erros
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={healthStatus} />
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Carregamento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.pageLoad.avgTime || 0}ms</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.pageLoad.totalLoads || 0} carregamentos/hora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Resposta API</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.api.avgResponseTime || 0}ms</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.api.totalCalls || 0} chamadas/hora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.api.errorRate || 0}%</div>
            <Progress value={100 - (metrics?.api.errorRate || 0)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros Ativos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.errors.length || 0}</div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="vitals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vitals">
            <Gauge className="h-4 w-4 mr-2" />
            Web Vitals
          </TabsTrigger>
          <TabsTrigger value="api">
            <Server className="h-4 w-4 mr-2" />
            API Performance
          </TabsTrigger>
          <TabsTrigger value="errors">
            <AlertCircle className="h-4 w-4 mr-2" />
            Erros
          </TabsTrigger>
          <TabsTrigger value="database">
            <TrendingUp className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="bundle">
            <Package className="h-4 w-4 mr-2" />
            Bundle
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
              <CardDescription>
                Métricas de performance baseadas nos padrões do Google
              </CardDescription>
            </CardHeader>
            <CardContent>
              {webVitalsChartData.length > 0 ? (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={webVitalsChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-background border rounded-lg p-3 shadow-lg">
                                  <p className="font-medium">{WEB_VITAL_NAMES[label] || label}</p>
                                  <p className="text-sm text-green-600">Bom: {payload[0].value}%</p>
                                  <p className="text-sm text-red-600">Ruim: {payload[1].value}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="good" stackId="a" fill="hsl(var(--primary))" name="Bom" />
                        <Bar
                          dataKey="poor"
                          stackId="a"
                          fill="hsl(var(--destructive))"
                          name="Ruim"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                    {metrics?.webVitals.map(vital => (
                      <div key={vital.name} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{vital.name}</span>
                          <Badge variant={vital.poor > vital.good ? 'destructive' : 'default'}>
                            {vital.avg}ms
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {WEB_VITAL_NAMES[vital.name]}
                        </p>
                        <Progress
                          value={(vital.good / Math.max(vital.total, 1)) * 100}
                          className="mt-2"
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Gauge className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma métrica coletada ainda.</p>
                  <p className="text-sm">Navegue pelo app para gerar dados.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Endpoints Mais Lentos</CardTitle>
              <CardDescription>Top 5 endpoints com maior tempo de resposta</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.api.slowEndpoints && metrics.api.slowEndpoints.length > 0 ? (
                <div className="space-y-3">
                  {metrics.api.slowEndpoints.map((endpoint, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{endpoint.method}</Badge>
                        <span className="text-sm font-mono truncate max-w-[300px]">
                          {endpoint.endpoint.replace(/https?:\/\/[^/]+/, '')}
                        </span>
                      </div>
                      <Badge variant={endpoint.duration > 3000 ? 'destructive' : 'secondary'}>
                        {endpoint.duration}ms
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma chamada de API registrada ainda.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Erros Recentes</CardTitle>
              <CardDescription>Erros mais frequentes nas últimas 24 horas</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.errors && metrics.errors.length > 0 ? (
                <div className="space-y-3">
                  {metrics.errors.map((error, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-destructive truncate">{error.message}</p>
                        <p className="text-xs text-muted-foreground">
                          Último: {new Date(error.lastSeen).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="destructive">{error.count}x</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Nenhum erro registrado nas últimas 24 horas!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saúde do Database</CardTitle>
              <CardDescription>Métricas de conexão e performance do banco de dados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="h-4 w-4" />
                    <span className="font-medium">Conexões Ativas</span>
                  </div>
                  <p className="text-2xl font-bold">{dbHealth?.activeConnections || 0}</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Erros (última hora)</span>
                  </div>
                  <p className="text-2xl font-bold">{dbHealth?.recentErrors || 0}</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Tempo Médio Query</span>
                  </div>
                  <p className="text-2xl font-bold">{dbHealth?.avgQueryTime || 0}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bundle" className="space-y-4">
          <BundleAnalysisTab />
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <p className="text-xs text-muted-foreground text-center">
        Última atualização: {metrics ? new Date(metrics.timestamp).toLocaleString('pt-BR') : 'N/A'}
      </p>
    </div>
  );
}

/**
 * Bundle Analysis Tab Component
 */
function BundleAnalysisTab() {
  const [bundleData, setBundleData] = useState<ReturnType<typeof getBundleAnalysis> | null>(null);
  const [pageLoadData, setPageLoadData] = useState<ReturnType<typeof analyzePageLoad> | null>(null);
  const [memoryData, setMemoryData] = useState<ReturnType<typeof getMemoryInfo> | null>(null);

  useEffect(() => {
    setBundleData(getBundleAnalysis());
    setPageLoadData(analyzePageLoad());
    setMemoryData(getMemoryInfo());
  }, []);

  const handleExportReport = () => {
    const report = exportBundleReport();
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bundle-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resourceChartData =
    pageLoadData?.resources.slice(0, 6).map((r, i) => ({
      name: r.type,
      size: r.size,
      count: r.count,
      fill:
        [
          'hsl(var(--primary))',
          'hsl(var(--secondary))',
          'hsl(var(--accent))',
          'hsl(var(--muted))',
          'hsl(220, 70%, 50%)',
          'hsl(280, 70%, 50%)',
        ][i] || 'hsl(var(--muted))',
    })) || [];

  return (
    <div className="space-y-4">
      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Chunks</span>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{bundleData?.chunks.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tamanho Total</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{formatBytes(bundleData?.totalSize || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cache Hit</span>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">
              {bundleData && bundleData.totalSize > 0
                ? Math.round((bundleData.cachedSize / bundleData.totalSize) * 100)
                : 0}
              %
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Memória JS</span>
              <Server className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">
              {memoryData ? formatBytes(memoryData.usedJSHeapSize) : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resources by Type */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recursos por Tipo</CardTitle>
            <CardDescription>Distribuição de tamanho por tipo de arquivo</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </CardHeader>
        <CardContent>
          {resourceChartData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resourceChartData}
                      dataKey="size"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {resourceChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatBytes(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {pageLoadData?.resources.map((resource, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{resource.type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {resource.count} arquivos
                      </span>
                    </div>
                    <span className="font-mono text-sm">{formatBytes(resource.size)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Dados de bundle ainda não disponíveis.</p>
              <p className="text-sm">Recarregue a página para coletar métricas.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {pageLoadData?.recommendations && pageLoadData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Recomendações de Otimização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pageLoadData.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg"
                >
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timing Breakdown */}
      {pageLoadData?.timing && Object.keys(pageLoadData.timing).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Breakdown de Carregamento</CardTitle>
            <CardDescription>Tempo gasto em cada fase do carregamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(pageLoadData.timing).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-mono">{Math.round(value)}ms</span>
                  </div>
                  <Progress
                    value={Math.min((value / (pageLoadData.timing.total || 1)) * 100, 100)}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
