import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useSortableTable } from '@/hooks/useSortableTable';


import { supabase } from '@/integrations/supabase/client';

interface LogEntry {
  id: string;
  status: string;
  generation_type: string;
  model_used: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  text_cost_usd: number | null;
  image_cost_usd: number | null;
  total_cost_usd: number | null;
  error_message: string | null;
  created_at: string;
  post_id: string | null;
}

export const BlogGenerationLogs = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-blog-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_generation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as LogEntry[];
    },
  });

  const { sortedData, sortKey, sortDirection, handleSort } = useSortableTable(logs || [], {
    key: 'created_at',
    direction: 'desc',
  });

  const totalCost = (logs || []).reduce((sum, l) => sum + (l.total_cost_usd || 0), 0);
  const successCount = (logs || []).filter(l => l.status === 'success').length;
  const errorCount = (logs || []).filter(l => l.status === 'error').length;
  const totalTokens = (logs || []).reduce((sum, l) => sum + (l.total_tokens || 0), 0);

  const statusIcon = (status: string) => {
    if (status === 'success') return <CheckCircle className="w-4 h-4 text-primary" />;
    if (status === 'error') return <XCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-8">
        <RefreshCw className="animate-spin h-5 w-5" />
      </div>
    );

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{logs?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Gerações Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{successCount}</p>
            <p className="text-xs text-muted-foreground">Sucesso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{errorCount}</p>
            <p className="text-xs text-muted-foreground">Erros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">${totalCost.toFixed(4)}</p>
            <p className="text-xs text-muted-foreground">Custo Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Extra stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Histórico de Gerações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <SortableTableHead
                    sortKey="created_at"
                    currentSortKey={sortKey as string}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    className="w-[120px]"
                  >
                    Data
                  </SortableTableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead className="w-[90px]">Tokens</TableHead>
                  <TableHead className="w-[80px]">Custo</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedData.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>{statusIcon(log.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {log.model_used?.split('/').pop() || '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.total_tokens?.toLocaleString() || '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.total_cost_usd ? `$${log.total_cost_usd.toFixed(4)}` : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                        {log.error_message || ''}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
