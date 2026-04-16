import { useState, useEffect } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';

import { useSortableTable } from '@/hooks/useSortableTable';

import { supabase } from '@/integrations/supabase/client';


interface Transaction {
  id: string;
  transaction_id: string;
  hotmart_product_id: string;
  buyer_email: string;
  buyer_name: string | null;
  status: string;
  amount: number | null;
  processed_at: string;
  event_type?: string | null;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  processed: { label: 'Processado', icon: CheckCircle2, color: 'text-green-600' },
  test: { label: 'Teste', icon: AlertCircle, color: 'text-blue-600' },
  pending: { label: 'Pendente', icon: Clock, color: 'text-yellow-600' },
  canceled: { label: 'Cancelado', icon: XCircle, color: 'text-red-600' },
  refunded: { label: 'Reembolsado', icon: XCircle, color: 'text-orange-600' },
  mapping_not_found: { label: 'Sem Mapeamento', icon: AlertCircle, color: 'text-red-600' },
  user_creation_failed: { label: 'Erro ao Criar Usuário', icon: XCircle, color: 'text-red-600' },
  access_grant_failed: { label: 'Erro ao Dar Acesso', icon: XCircle, color: 'text-red-600' },
};

export const HotmartTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();

    // Realtime subscription
    const channel = supabase
      .channel('hotmart-transactions-admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hotmart_transactions',
        },
        () => {
          loadTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTransactions = async () => {
    setIsRefreshing(true);

    const { data, error } = await supabase
      .from('hotmart_transactions')
      .select(
        'id, transaction_id, hotmart_product_id, buyer_email, buyer_name, status, amount, event_type, processed_at'
      )
      .order('processed_at', { ascending: false })
      .limit(30);

    if (!error && data) {
      setTransactions(data);
    }

    setIsRefreshing(false);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Transações Hotmart</CardTitle>
        <Button onClick={loadTransactions} variant="outline" size="sm" disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma transação registrada</p>
        ) : (
          <TransactionsTable transactions={transactions} />
        )}
      </CardContent>
    </Card>
  );
};

const TransactionsTable = ({ transactions }: { transactions: Transaction[] }) => {
  const { sortedData, sortKey, sortDirection, handleSort } = useSortableTable(transactions);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead
              sortKey="processed_at"
              currentSortKey={sortKey as string}
              sortDirection={sortDirection}
              onSort={k => handleSort(k as keyof Transaction)}
            >
              Data
            </SortableTableHead>
            <SortableTableHead
              sortKey="event_type"
              currentSortKey={sortKey as string}
              sortDirection={sortDirection}
              onSort={k => handleSort(k as keyof Transaction)}
            >
              Evento
            </SortableTableHead>
            <SortableTableHead
              sortKey="buyer_name"
              currentSortKey={sortKey as string}
              sortDirection={sortDirection}
              onSort={k => handleSort(k as keyof Transaction)}
            >
              Comprador
            </SortableTableHead>
            <SortableTableHead
              sortKey="hotmart_product_id"
              currentSortKey={sortKey as string}
              sortDirection={sortDirection}
              onSort={k => handleSort(k as keyof Transaction)}
            >
              ID Produto
            </SortableTableHead>
            <SortableTableHead
              sortKey="amount"
              currentSortKey={sortKey as string}
              sortDirection={sortDirection}
              onSort={k => handleSort(k as keyof Transaction)}
            >
              Valor
            </SortableTableHead>
            <SortableTableHead
              sortKey="status"
              currentSortKey={sortKey as string}
              sortDirection={sortDirection}
              onSort={k => handleSort(k as keyof Transaction)}
            >
              Status
            </SortableTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData?.map(tx => {
            const config = statusConfig[tx.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            return (
              <TableRow key={tx.id}>
                <TableCell className="text-sm">
                  {formatDistanceToNow(new Date(tx.processed_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {tx.event_type || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{tx.buyer_name || 'Nome não informado'}</p>
                    <p className="text-xs text-muted-foreground">{tx.buyer_email}</p>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{tx.hotmart_product_id}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    tx.amount || 0
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={config.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
