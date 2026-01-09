/**
 * Virtualized list hook for rendering large lists efficiently
 * Only renders items that are visible in the viewport
 */
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

interface VirtualizedListOptions {
  /** Total number of items */
  itemCount: number;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Number of items to render above/below the visible area */
  overscan?: number;
  /** Container height (if not using ref) */
  containerHeight?: number;
}

interface VirtualizedListResult {
  /** Items to render with their indices and styles */
  virtualItems: VirtualItem[];
  /** Total height of the list container */
  totalHeight: number;
  /** Ref to attach to the scrollable container */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Scroll to a specific index */
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
  /** Current scroll position */
  scrollTop: number;
  /** Visible range */
  visibleRange: { start: number; end: number };
}

interface VirtualItem {
  index: number;
  start: number;
  size: number;
  style: React.CSSProperties;
}

/**
 * Hook for virtualizing long lists
 * Dramatically improves performance for lists with 100+ items
 * 
 * @example
 * ```tsx
 * const { virtualItems, totalHeight, containerRef } = useVirtualizedList({
 *   itemCount: items.length,
 *   itemHeight: 60,
 *   overscan: 5,
 * });
 * 
 * return (
 *   <div ref={containerRef} style={{ height: 400, overflow: 'auto' }}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       {virtualItems.map(({ index, style }) => (
 *         <div key={items[index].id} style={style}>
 *           {items[index].name}
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useVirtualizedList({
  itemCount,
  itemHeight,
  overscan = 3,
  containerHeight: providedHeight,
}: VirtualizedListOptions): VirtualizedListResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(providedHeight ?? 400);

  // Calculate total height
  const totalHeight = itemCount * itemHeight;

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(itemCount - 1, start + visibleCount + overscan * 2);
    return { start, end };
  }, [scrollTop, containerHeight, itemHeight, itemCount, overscan]);

  // Generate virtual items
  const virtualItems = useMemo(() => {
    const items: VirtualItem[] = [];
    
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        size: itemHeight,
        style: {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          width: '100%',
          height: itemHeight,
          transform: `translateY(${i * itemHeight}px)`,
        },
      });
    }
    
    return items;
  }, [visibleRange, itemHeight]);

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Observe container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container || providedHeight) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, [providedHeight]);

  // Scroll to index
  const scrollToIndex = useCallback(
    (index: number, align: 'start' | 'center' | 'end' = 'start') => {
      const container = containerRef.current;
      if (!container) return;

      let scrollPosition: number;
      
      switch (align) {
        case 'center':
          scrollPosition = index * itemHeight - containerHeight / 2 + itemHeight / 2;
          break;
        case 'end':
          scrollPosition = (index + 1) * itemHeight - containerHeight;
          break;
        case 'start':
        default:
          scrollPosition = index * itemHeight;
      }

      container.scrollTop = Math.max(0, Math.min(scrollPosition, totalHeight - containerHeight));
    },
    [containerHeight, itemHeight, totalHeight]
  );

  return {
    virtualItems,
    totalHeight,
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    scrollToIndex,
    scrollTop,
    visibleRange,
  };
}

/**
 * Hook for virtualizing variable height lists
 * More complex but handles dynamic item heights
 */
interface VariableHeightItem {
  id: string;
  height: number;
}

export function useVariableVirtualizedList(
  items: VariableHeightItem[],
  options: Omit<VirtualizedListOptions, 'itemCount' | 'itemHeight'>
): VirtualizedListResult {
  const { overscan = 3, containerHeight: providedHeight } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(providedHeight ?? 400);

  // Pre-compute item positions
  const itemPositions = useMemo(() => {
    let offset = 0;
    return items.map((item) => {
      const position = { start: offset, height: item.height };
      offset += item.height;
      return position;
    });
  }, [items]);

  const totalHeight = itemPositions.length > 0
    ? itemPositions[itemPositions.length - 1].start + itemPositions[itemPositions.length - 1].height
    : 0;

  // Binary search to find start index
  const findStartIndex = useCallback(
    (scrollTop: number) => {
      let low = 0;
      let high = itemPositions.length - 1;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const pos = itemPositions[mid];

        if (pos.start + pos.height > scrollTop) {
          if (mid === 0 || itemPositions[mid - 1].start + itemPositions[mid - 1].height <= scrollTop) {
            return mid;
          }
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }

      return 0;
    },
    [itemPositions]
  );

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.max(0, findStartIndex(scrollTop) - overscan);
    
    let end = start;
    let accumulatedHeight = 0;
    
    while (end < items.length && accumulatedHeight < containerHeight + scrollTop - itemPositions[start].start) {
      accumulatedHeight += itemPositions[end].height;
      end++;
    }
    
    return { start, end: Math.min(items.length - 1, end + overscan) };
  }, [scrollTop, containerHeight, items.length, itemPositions, overscan, findStartIndex]);

  // Generate virtual items
  const virtualItems = useMemo(() => {
    const result: VirtualItem[] = [];
    
    for (let i = visibleRange.start; i <= visibleRange.end && i < items.length; i++) {
      const pos = itemPositions[i];
      result.push({
        index: i,
        start: pos.start,
        size: pos.height,
        style: {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          width: '100%',
          height: pos.height,
          transform: `translateY(${pos.start}px)`,
        },
      });
    }
    
    return result;
  }, [visibleRange, itemPositions, items.length]);

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => setScrollTop(container.scrollTop);
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to index
  const scrollToIndex = useCallback(
    (index: number, align: 'start' | 'center' | 'end' = 'start') => {
      const container = containerRef.current;
      if (!container || index >= itemPositions.length) return;

      const pos = itemPositions[index];
      let scrollPosition: number;

      switch (align) {
        case 'center':
          scrollPosition = pos.start - containerHeight / 2 + pos.height / 2;
          break;
        case 'end':
          scrollPosition = pos.start + pos.height - containerHeight;
          break;
        case 'start':
        default:
          scrollPosition = pos.start;
      }

      container.scrollTop = Math.max(0, Math.min(scrollPosition, totalHeight - containerHeight));
    },
    [containerHeight, itemPositions, totalHeight]
  );

  return {
    virtualItems,
    totalHeight,
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    scrollToIndex,
    scrollTop,
    visibleRange,
  };
}
