import { memo } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EnxovalItem } from '@/types/enxoval';
import { formatCurrency } from '@/lib/calculations';
import { ExternalLink, Edit, Trash2 } from 'lucide-react';

interface EnxovalTableRowProps {
  item: EnxovalItem;
  onEdit: (item: EnxovalItem) => void;
  onDeleteClick: (id: string) => void;
  getRowColor: (item: EnxovalItem) => string;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

export const EnxovalTableRow = memo(
  ({
    item,
    onEdit,
    onDeleteClick,
    getRowColor,
    getPriorityColor,
    getStatusColor,
  }: EnxovalTableRowProps) => (
    <TableRow className={getRowColor(item)}>
      <TableCell>{new Date(item.date).toLocaleDateString('pt-BR')}</TableCell>
      <TableCell className="font-medium">{item.category}</TableCell>
      <TableCell>
        {item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            {item.item}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          item.item
        )}
      </TableCell>
      <TableCell>{item.necessity}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className={getPriorityColor(item.priority)}>
            {item.priority}
          </Badge>
          {item.excessoRN && (
            <Badge
              variant="outline"
              className="bg-warning/20 text-warning-foreground border-warning text-xs"
            >
              ⚠️ RN
            </Badge>
          )}
          {item.superfluoComprado && (
            <Badge
              variant="outline"
              className="bg-destructive/20 text-destructive-foreground border-destructive text-xs"
            >
              ⚠️
            </Badge>
          )}
          {item.alertaTroca && (
            <Badge
              variant="outline"
              className="bg-yellow-500/20 text-yellow-900 dark:text-yellow-100 border-yellow-500 text-xs"
            >
              ⏰
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>{item.size || '-'}</TableCell>
      <TableCell className="text-right">{item.plannedQty}</TableCell>
      <TableCell className="text-right">{formatCurrency(item.plannedPrice)}</TableCell>
      <TableCell className="text-right">{item.boughtQty}</TableCell>
      <TableCell className="text-right">{formatCurrency(item.unitPricePaid)}</TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(item.subtotalPlanned)}
      </TableCell>
      <TableCell className="text-right font-medium">{formatCurrency(item.subtotalPaid)}</TableCell>
      <TableCell className="text-right font-semibold">
        <span
          className={item.savings > 0 ? 'text-success' : item.savings < 0 ? 'text-destructive' : ''}
        >
          {formatCurrency(item.savings)}
        </span>
      </TableCell>
      <TableCell>
        <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
      </TableCell>
      <TableCell>{item.store || '-'}</TableCell>
      <TableCell className="text-right">
        <div className="flex gap-1 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(item)}
            className="gap-1 h-8 px-2"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteClick(item.id)}
            className="gap-1 h-8 px-2"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
);

EnxovalTableRow.displayName = 'EnxovalTableRow';
