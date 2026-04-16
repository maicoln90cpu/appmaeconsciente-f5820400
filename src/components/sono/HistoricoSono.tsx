import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BabySleepLog } from '@/types/babySleep';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Filter } from 'lucide-react';
import { ExportSonoPDF } from './ExportSonoPDF';

interface HistoricoSonoProps {
  sleepLogs: BabySleepLog[];
  onDelete: (id: string) => Promise<void>;
  babyName?: string;
}

export const HistoricoSono = ({ sleepLogs, onDelete, babyName }: HistoricoSonoProps) => {
  const [period, setPeriod] = useState('7');
  const [typeFilter, setTypeFilter] = useState('todos');

  const filteredLogs = useMemo(() => {
    let filtered = sleepLogs;

    // Filtrar por período
    const daysAgo = parseInt(period);
    if (daysAgo > 0) {
      const cutoffDate = subDays(new Date(), daysAgo);
      filtered = filtered.filter(log => new Date(log.sleep_start) >= cutoffDate);
    }

    // Filtrar por tipo
    if (typeFilter !== 'todos') {
      filtered = filtered.filter(log => log.sleep_type === typeFilter);
    }

    return filtered;
  }, [sleepLogs, period, typeFilter]);

  const getLocationEmoji = (location?: string) => {
    switch (location) {
      case 'berco':
        return '🛏️';
      case 'colo':
        return '🤱';
      case 'carrinho':
        return '🚼';
      case 'cama_compartilhada':
        return '👨‍👩‍👦';
      default:
        return '📍';
    }
  };

  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
      case 'calmo':
        return '😌';
      case 'chorando':
        return '😢';
      case 'agitado':
        return '😫';
      case 'descansada':
        return '😊';
      case 'cansada':
        return '😴';
      case 'exausta':
        return '😵';
      default:
        return '😐';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                Histórico de Sono
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {filteredLogs.length} registro(s) encontrado(s)
              </CardDescription>
            </div>
            <ExportSonoPDF sleepLogs={filteredLogs} babyName={babyName} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="14">Últimos 14 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="0">Todos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="diurno">🌞 Diurno</SelectItem>
                <SelectItem value="noturno">🌙 Noturno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-3">
            {filteredLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Nenhum registro encontrado
              </p>
            ) : (
              filteredLogs.map(log => (
                <Card key={log.id} className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">
                        {format(new Date(log.sleep_start), 'dd/MM HH:mm', { locale: ptBR })}
                      </p>
                      <Badge
                        variant={log.sleep_type === 'noturno' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {log.sleep_type === 'noturno' ? '🌙 Noturno' : '🌞 Diurno'}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(log.id)}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Duração:</span>{' '}
                      {log.duration_minutes
                        ? `${Math.floor(log.duration_minutes / 60)}h ${log.duration_minutes % 60}m`
                        : 'Em andamento'}
                    </div>
                    <div>
                      <span className="font-medium">Local:</span> {getLocationEmoji(log.location)}
                    </div>
                    <div>
                      <span className="font-medium">Bebê:</span> {getMoodEmoji(log.wakeup_mood)}
                    </div>
                    <div>
                      <span className="font-medium">Você:</span> {getMoodEmoji(log.mom_mood)}
                    </div>
                  </div>
                  {log.notes && (
                    <p className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                      {log.notes}
                    </p>
                  )}
                </Card>
              ))
            )}
          </div>

          {/* Desktop: Table */}
          <div className="hidden sm:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Humor Bebê</TableHead>
                  <TableHead>Você</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {format(new Date(log.sleep_start), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {log.duration_minutes ? (
                          <span className="text-sm">
                            {Math.floor(log.duration_minutes / 60)}h {log.duration_minutes % 60}m
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Em andamento</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.sleep_type === 'noturno' ? 'default' : 'secondary'}>
                          {log.sleep_type === 'noturno' ? '🌙 Noturno' : '🌞 Diurno'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getLocationEmoji(log.location)}</TableCell>
                      <TableCell>{getMoodEmoji(log.wakeup_mood)}</TableCell>
                      <TableCell>{getMoodEmoji(log.mom_mood)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(log.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.some(log => log.notes) && (
            <div className="hidden sm:block mt-4 space-y-2">
              <h4 className="text-sm font-semibold">📝 Observações Recentes</h4>
              {filteredLogs
                .filter(log => log.notes)
                .slice(0, 5)
                .map(log => (
                  <div key={log.id} className="text-sm p-2 bg-muted rounded">
                    <span className="text-muted-foreground">
                      {format(new Date(log.sleep_start), 'dd/MM HH:mm', { locale: ptBR })}:
                    </span>{' '}
                    {log.notes}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
