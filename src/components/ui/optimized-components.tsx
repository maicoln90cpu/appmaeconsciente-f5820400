import React, { memo, useMemo, useCallback, useState } from 'react';

import { Input } from '@/components/ui/input';

import { useDebouncedCallback, useDeepMemo } from '@/hooks/useMemoizedCallback';

import { cn } from '@/lib/utils';

interface OptimizedSelectProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T) => void;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
}

/**
 * Optimized select with memoized options and debounced search
 */
export const OptimizedSelect = memo(function OptimizedSelect<T>({
  options,
  value,
  onChange,
  getOptionLabel,
  getOptionValue,
  placeholder = 'Selecione...',
  className,
  disabled = false,
  searchable = false,
}: OptimizedSelectProps<T>) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Memoize option values
  const memoizedOptions = useDeepMemo(
    () =>
      options.map(opt => ({
        label: getOptionLabel(opt),
        value: getOptionValue(opt),
        original: opt,
      })),
    [options]
  );

  // Debounced search handler
  const handleSearch = useDebouncedCallback((query: string) => {
    setSearch(query);
  }, 150);

  // Filtered options
  const filteredOptions = useMemo(() => {
    if (!search) return memoizedOptions;
    const lowerSearch = search.toLowerCase();
    return memoizedOptions.filter(opt => opt.label.toLowerCase().includes(lowerSearch));
  }, [memoizedOptions, search]);

  const handleSelect = useCallback(
    (option: (typeof memoizedOptions)[0]) => {
      onChange(option.original);
      setIsOpen(false);
      setSearch('');
    },
    [onChange]
  );

  const selectedLabel = useMemo(() => {
    if (!value) return '';
    return getOptionLabel(value);
  }, [value, getOptionLabel]);

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:bg-accent/50'
        )}
      >
        <span className={cn(!selectedLabel && 'text-muted-foreground')}>
          {selectedLabel || placeholder}
        </span>
        <svg
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {searchable && (
            <div className="p-2 border-b">
              <Input
                placeholder="Buscar..."
                onChange={e => handleSearch(e.target.value)}
                className="h-8"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-60 overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                Nenhuma opção encontrada
              </div>
            ) : (
              filteredOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'w-full px-3 py-2 text-sm text-left rounded-sm',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:bg-accent focus:text-accent-foreground focus:outline-none',
                    value && getOptionValue(value) === option.value && 'bg-accent'
                  )}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}) as <T>(props: OptimizedSelectProps<T>) => React.ReactElement;

/**
 * Memoized list item wrapper
 * Prevents re-renders when parent updates but item hasn't changed
 */
interface MemoizedListItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const MemoizedListItem = memo(function MemoizedListItem({
  children,
  className,
  onClick,
}: MemoizedListItemProps) {
  return (
    <div
      className={cn('p-4 border-b border-border last:border-b-0', className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
});

/**
 * Optimized grid with memoized cells
 */
interface OptimizedGridProps<T> {
  items: T[];
  columns?: number;
  gap?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
}

export const OptimizedGrid = memo(function OptimizedGrid<T>({
  items,
  columns = 3,
  gap = 16,
  renderItem,
  keyExtractor,
  className,
}: OptimizedGridProps<T>) {
  const gridStyle = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gap: `${gap}px`,
    }),
    [columns, gap]
  );

  return (
    <div className={className} style={gridStyle}>
      {items.map((item, index) => (
        <MemoizedGridCell key={keyExtractor(item, index)}>
          {renderItem(item, index)}
        </MemoizedGridCell>
      ))}
    </div>
  );
}) as <T>(props: OptimizedGridProps<T>) => React.ReactElement;

const MemoizedGridCell = memo(function MemoizedGridCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
});
