/**
 * Advanced memoization hooks for performance optimization
 */
import { useCallback, useRef, useMemo, DependencyList, useEffect } from 'react';

/**
 * A callback that only changes if the callback body changes,
 * not when dependencies change. Useful for callbacks passed to
 * child components that don't need to trigger re-renders.
 * 
 * @example
 * ```tsx
 * const handleClick = useStableCallback((id: string) => {
 *   // This callback reference stays stable across renders
 *   console.log('Clicked:', id, someState);
 * });
 * ```
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef<T>(callback);
  
  // Update the ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  // Return a stable callback that calls the latest ref
  return useCallback(
    ((...args: unknown[]) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Debounced callback hook
 * Delays invoking the callback until after `delay` ms have elapsed
 * since the last time the debounced function was invoked.
 * 
 * @example
 * ```tsx
 * const debouncedSearch = useDebouncedCallback((query: string) => {
 *   fetchSearchResults(query);
 * }, 300);
 * ```
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  deps: DependencyList = []
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  
  // Update callback ref
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return useCallback(
    ((...args: unknown[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay, ...deps]
  );
}

/**
 * Throttled callback hook
 * Limits how often a callback can be called.
 * 
 * @example
 * ```tsx
 * const throttledScroll = useThrottledCallback((e: Event) => {
 *   updateScrollPosition(e);
 * }, 100);
 * ```
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit: number,
  deps: DependencyList = []
): T {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return useCallback(
    ((...args: unknown[]) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;
      
      if (timeSinceLastRun >= limit) {
        lastRunRef.current = now;
        callbackRef.current(...args);
      } else {
        // Schedule for later
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          callbackRef.current(...args);
        }, limit - timeSinceLastRun);
      }
    }) as T,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [limit, ...deps]
  );
}

/**
 * Deep comparison memoization
 * Only recomputes when the value deeply changes, not on reference change.
 * 
 * @example
 * ```tsx
 * const filters = useDeepMemo(() => ({
 *   category: selectedCategory,
 *   tags: selectedTags,
 * }), [selectedCategory, selectedTags]);
 * ```
 */
export function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<{ value: T; deps: DependencyList } | undefined>(undefined);
  
  if (ref.current === undefined || !deepEqual(deps, ref.current.deps)) {
    ref.current = { value: factory(), deps };
  }
  
  return ref.current.value;
}

/**
 * Previous value hook
 * Returns the previous value of a variable.
 * 
 * @example
 * ```tsx
 * const prevCount = usePrevious(count);
 * // Can compare count vs prevCount
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * Lazy initialization hook
 * Only computes the initial value once, even across re-renders.
 * 
 * @example
 * ```tsx
 * const expensiveValue = useLazyInit(() => computeExpensiveValue());
 * ```
 */
export function useLazyInit<T>(factory: () => T): T {
  const ref = useRef<{ value: T } | undefined>(undefined);
  
  if (ref.current === undefined) {
    ref.current = { value: factory() };
  }
  
  return ref.current.value;
}

/**
 * Conditional effect - only runs when condition is true
 * 
 * @example
 * ```tsx
 * useConditionalEffect(
 *   () => { fetchData(); },
 *   isReady,
 *   [userId]
 * );
 * ```
 */
export function useConditionalEffect(
  effect: () => void | (() => void),
  condition: boolean,
  deps: DependencyList
): void {
  useEffect(() => {
    if (condition) {
      return effect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condition, ...deps]);
}

/**
 * Memoized selector hook
 * Efficiently select and memoize derived state.
 * 
 * @example
 * ```tsx
 * const totalPrice = useMemoizedSelector(
 *   items,
 *   (items) => items.reduce((sum, item) => sum + item.price, 0)
 * );
 * ```
 */
export function useMemoizedSelector<T, R>(
  data: T,
  selector: (data: T) => R,
  isEqual: (a: T, b: T) => boolean = Object.is
): R {
  const prevDataRef = useRef<T>(data);
  const resultRef = useRef<R | undefined>(undefined);
  
  if (resultRef.current === undefined || !isEqual(data, prevDataRef.current)) {
    prevDataRef.current = data;
    resultRef.current = selector(data);
  }
  
  return resultRef.current;
}

// Utility: Deep equality check
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  
  if (typeof a !== typeof b) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  if (typeof a === 'object' && a !== null && b !== null) {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
  }
  
  return false;
}

/**
 * Request Idle Callback hook
 * Runs callback during browser idle time
 * 
 * @example
 * ```tsx
 * useIdleCallback(() => {
 *   // Non-critical work
 *   analytics.track('page_view');
 * }, { timeout: 2000 });
 * ```
 */
export function useIdleCallback(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): void {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback((deadline) => {
        callbackRef.current(deadline);
      }, options);
      
      return () => cancelIdleCallback(id);
    } else {
      // Fallback for Safari
      const id = setTimeout(() => {
        callbackRef.current({
          didTimeout: false,
          timeRemaining: () => 50,
        });
      }, options?.timeout ?? 1);
      
      return () => clearTimeout(id);
    }
  }, [options?.timeout]);
}
