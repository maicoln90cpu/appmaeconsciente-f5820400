import * as React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortKey?: string;
  currentSortKey?: string | null;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
}

const SortableTableHead = React.forwardRef<HTMLTableCellElement, SortableTableHeadProps>(
  ({ className, children, sortKey, currentSortKey, sortDirection, onSort, ...props }, ref) => {
    const isActive = sortKey && currentSortKey === sortKey;
    const handleClick = () => {
      if (sortKey && onSort) onSort(sortKey);
    };

    return (
      <th
        ref={ref}
        className={cn(
          'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
          sortKey && onSort && 'cursor-pointer select-none hover:text-foreground transition-colors',
          className
        )}
        onClick={sortKey ? handleClick : undefined}
        {...props}
      >
        <div className="flex items-center gap-1">
          {children}
          {sortKey &&
            onSort &&
            (isActive ? (
              sortDirection === 'asc' ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
            ))}
        </div>
      </th>
    );
  }
);
SortableTableHead.displayName = 'SortableTableHead';

export { SortableTableHead };
