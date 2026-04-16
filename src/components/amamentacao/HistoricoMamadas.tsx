import { useState, useMemo } from 'react';

import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Baby, Milk, Droplets } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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


import type { BabyFeedingLog } from '@/types/babyFeeding';

interface HistoricoMamadasProps {
  feedingLogs: BabyFeedingLog[];
  onDelete: (id: string) => Promise<void>;
}

export const HistoricoMamadas = ({ feedingLogs, onDelete }: HistoricoMamadasProps) => {
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('week');
  const [typeFilter, setTypeFilter] = useState<'all' | 'breastfeeding' | 'bottle' | 'pumping'>(
    'all'
  );

  const filteredLogs = useMemo(() => {
    let filtered = [...feedingLogs];

    // Filtro de período
    const today = startOfDay(new Date());
    if (periodFilter === 'today') {
      filtered = filtered.filter(log => new Date(log.start_time) >= today);
    } else if (periodFilter === 'week') {
      const weekAgo = subDays(today, 7);
      filtered = filtered.filter(log => new Date(log.start_time) >= weekAgo);
    } else if (periodFilter === 'month') {
      const monthAgo = subDays(today, 30);
      filtered = filtered.filter(log => new Date(log.start_time) >= monthAgo);
    }

    // Filtro de tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(log => log.feeding_type === typeFilter);
    }

    return filtered;
  }, [feedingLogs, periodFilter, typeFilter]);

  const getFeedingIcon = (type: string) => {
    switch (type) {
      case 'breastfeeding':
        return <Baby className="h-4 w-4" />;
      case 'bottle':
        return <Milk className="h-4 w-4" />;
      case 'pumping':
        return <Droplets className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getFeedingLabel = (type: string) => {
    switch (type) {
      case 'breastfeeding':
        return 'Amamentação';
      case 'bottle':
        return 'Mamadeira';
      case 'pumping':
        return 'Ordenha';
      default:
        return type;
    }
  };

  const getFeedingBadgeVariant = (type: string) => {
    switch (type) {
      case 'breastfeeding':
        return 'default';
      case 'bottle':
        return 'secondary';
      case 'pumping':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-medium">Período</label>
            <Select value={periodFilter} onValueChange={(value: any) => setPeriodFilter(value)}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-medium">Tipo</label>
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="breastfeeding">Amamentação</SelectItem>
                <SelectItem value="bottle">Mamadeira</SelectItem>
                <SelectItem value="pumping">Ordenha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Mobile: Cards */}
      <div className="sm:hidden space-y-3">
        {filteredLogs.length === 0 ? (
          <EmptyState
            icon={History}
            title="Nenhum registro encontrado"
            description="Os registros de mamada aparecerão aqui conforme você adicionar"
          />
        ) : (
          filteredLogs.map(log => (
            <Card key={log.id} className="p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {getFeedingIcon(log.feeding_type)}
                  <Badge variant={getFeedingBadgeVariant(log.feeding_type) as any}>
                    {getFeedingLabel(log.feeding_type)}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(log.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Data:</span>{' '}
                  {format(new Date(log.start_time), 'dd/MM HH:mm', { locale: ptBR })}
                </div>
                <div>
                  <span className="font-medium">Duração:</span>{' '}
                  {log.duration_minutes ? `${log.duration_minutes} min` : '-'}
                </div>
                {log.breast_side && (
                  <div>
                    <span className="font-medium">Seio:</span>{' '}
                    {log.breast_side === 'left'
                      ? 'Esq'
                      : log.breast_side === 'right'
                        ? 'Dir'
                        : 'Ambos'}
                  </div>
                )}
                {log.volume_ml && (
                  <div>
                    <span className="font-medium">Volume:</span> {log.volume_ml}ml
                  </div>
                )}
              </div>
              {log.notes && (
                <p className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded line-clamp-2">
                  {log.notes}
                </p>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Desktop: Table */}
      <Card className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFeedingIcon(log.feeding_type)}
                      <span className="text-sm">{getFeedingLabel(log.feeding_type)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(log.start_time), 'dd/MM/yyyy', { locale: ptBR })}
                      <br />
                      <span className="text-muted-foreground">
                        {format(new Date(log.start_time), 'HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.duration_minutes ? `${log.duration_minutes} min` : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {log.breast_side && (
                        <div>
                          Seio:{' '}
                          {log.breast_side === 'left'
                            ? 'Esquerdo'
                            : log.breast_side === 'right'
                              ? 'Direito'
                              : 'Ambos'}
                        </div>
                      )}
                      {log.volume_ml && <div>{log.volume_ml} ml</div>}
                      {log.milk_type && (
                        <div className="text-muted-foreground">
                          {log.milk_type === 'breast_milk'
                            ? 'Leite materno'
                            : log.milk_type === 'formula'
                              ? 'Fórmula'
                              : 'Misto'}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{log.notes || '-'}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onDelete(log.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
