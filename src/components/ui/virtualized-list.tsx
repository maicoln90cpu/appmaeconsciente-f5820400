import React, { memo, useMemo } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

import { useVirtualizedList } from '@/hooks/useVirtualizedList';

import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  /** Items to render */
  items: T[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Container height in pixels */
  height: number;
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Key extractor function */
  keyExtractor: (item: T, index: number) => string;
  /** Number of items to render above/below viewport */
  overscan?: number;
  /** Custom className for container */
  className?: string;
  /** Empty state component */
  emptyState?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Number of skeleton items to show when loading */
  skeletonCount?: number;
}

/**
 * Virtualized list component for rendering large lists efficiently.
 * Only renders items visible in the viewport + overscan buffer.
 *
 * @example
 * ```tsx
 * <VirtualizedList
 *   items={users}
 *   itemHeight={64}
 *   height={400}
 *   renderItem={(user) => <UserCard user={user} />}
 *   keyExtractor={(user) => user.id}
 * />
 * ```
 */
function VirtualizedListComponent<T>({
  items,
  itemHeight,
  height,
  renderItem,
  keyExtractor,
  overscan = 5,
  className,
  emptyState,
  loading = false,
  skeletonCount = 5,
}: VirtualizedListProps<T>) {
  const { virtualItems, totalHeight, containerRef } = useVirtualizedList({
    itemCount: items.length,
    itemHeight,
    overscan,
    containerHeight: height,
  });

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className="w-full" style={{ height: itemHeight }} />
        ))}
      </div>
    );
  }

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div ref={containerRef} className={cn('overflow-auto', className)} style={{ height }}>
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {virtualItems.map(({ index, style }) => {
          const item = items[index];
          if (!item) return null;

          return (
            <div key={keyExtractor(item, index)} style={style}>
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Memoized version for better performance
export const VirtualizedList = memo(VirtualizedListComponent) as typeof VirtualizedListComponent;

/**
 * Simple virtualized list for homogeneous items
 */
interface SimpleListProps {
  items: string[];
  height?: number;
  itemHeight?: number;
  className?: string;
  onItemClick?: (item: string, index: number) => void;
}

export const SimpleVirtualizedList = memo(function SimpleVirtualizedList({
  items,
  height = 300,
  itemHeight = 40,
  className,
  onItemClick,
}: SimpleListProps) {
  return (
    <VirtualizedList
      items={items}
      height={height}
      itemHeight={itemHeight}
      className={className}
      keyExtractor={(item, index) => `${item}-${index}`}
      renderItem={(item, index) => (
        <div
          className={cn(
            'flex items-center px-4 h-full border-b border-border',
            onItemClick && 'cursor-pointer hover:bg-muted transition-colors'
          )}
          onClick={() => onItemClick?.(item, index)}
        >
          {item}
        </div>
      )}
    />
  );
});
