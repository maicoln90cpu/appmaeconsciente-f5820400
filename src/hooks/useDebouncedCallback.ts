import { useCallback, useRef, useEffect } from "react";

/**
 * Returns a debounced version of the callback.
 * Cancels on unmount. Useful for search inputs.
 *
 * Usage:
 *   const debouncedSearch = useDebouncedCallback((term: string) => {
 *     setFilter(term);
 *   }, 300);
 *   <Input onChange={(e) => debouncedSearch(e.target.value)} />
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Always use latest callback without re-creating debounced fn
  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}
