import { useState, useCallback, useRef } from 'react';

/**
 * Hook that prevents double-submission of async actions.
 * Returns [isSubmitting, guardedFn] where guardedFn ignores calls while one is in-flight.
 *
 * Usage:
 *   const [isSubmitting, submit] = useSubmitGuard(async () => { ... });
 *   <Button disabled={isSubmitting} onClick={submit}>Save</Button>
 */
export function useSubmitGuard<T extends (...args: any[]) => Promise<any>>(
  fn: T
): [boolean, (...args: Parameters<T>) => Promise<void>] {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inFlight = useRef(false);

  const guarded = useCallback(
    async (...args: Parameters<T>) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setIsSubmitting(true);
      try {
        await fn(...args);
      } finally {
        inFlight.current = false;
        setIsSubmitting(false);
      }
    },
    [fn]
  );

  return [isSubmitting, guarded];
}
