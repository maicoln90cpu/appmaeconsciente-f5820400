import { useEffect, useRef } from "react";

/**
 * Hook that provides an AbortController signal, automatically aborting on unmount.
 * Usage:
 *   const getSignal = useAbortController();
 *   // In an async function:
 *   const signal = getSignal();
 *   fetch(url, { signal });
 *
 * Each call to getSignal() aborts the previous controller (cancels prior request).
 */
export function useAbortController() {
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const getSignal = (): AbortSignal => {
    // Abort previous in-flight request
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    return controller.signal;
  };

  return getSignal;
}

/**
 * Helper to check if an error is an abort error (safe to ignore).
 */
export function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException && error.name === "AbortError"
  );
}
