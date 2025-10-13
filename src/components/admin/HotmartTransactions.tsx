import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface Transaction {
  id: string;
  transaction_id: string;
  hotmart_product_id: string;
  buyer_email: string;
  buyer_name: string | null;
  status: string;
  amount: number | null;
  processed_at: string;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  processed: { label: "Processado", icon: CheckCircle2, color: "bg-green-500" },
  pending_account: { label: "Aguardando Cadastro", icon: Clock, color: "bg-yellow-500" },
  mapping_not_found: { label: "Sem Mapeamento", icon: AlertCircle, color: "bg-red-500" },
};

export const HotmartTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadTransactions();

    // Auto-refresh every 30s
    const interval = setInterval(loadTransactions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from("hotmart_transactions")
      .select("*")
      .order("processed_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações Hotmart (Últimas 50)</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma transação registrada
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead>ID Produto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const config = statusConfig[tx.status] || statusConfig.pending_account;
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
                        <div>
                          <p className="font-medium text-sm">
                            {tx.buyer_name || "Nome não informado"}
                          </p>
                          <p className="text-xs text-muted-foreground">{tx.buyer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {tx.hotmart_product_id}
                      </TableCell>
                      <TableCell>{formatCurrency(tx.amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${config.color}`} />
                          <span className="text-sm">{config.label}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
