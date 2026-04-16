import { TableHead } from '@/components/ui/table';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { SortConfig } from '@/hooks/useTableSort';

interface SortableTableHeaderProps<T> {
  label: string;
  sortKey: keyof T;
  currentSort: SortConfig<T>;
  onSort: (key: keyof T) => void;
  className?: string;
}

export function SortableTableHeader<T>({
  label,
  sortKey,
  currentSort,
  onSort,
  className,
}: SortableTableHeaderProps<T>) {
  const isActive = currentSort.key === sortKey;
  const Icon = isActive ? (currentSort.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <TableHead
      className={`cursor-pointer select-none hover:bg-muted/50 ${className ?? ''}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <Icon className={`h-3 w-3 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
      </div>
    </TableHead>
  );
}
