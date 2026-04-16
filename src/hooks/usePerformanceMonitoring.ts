import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageLoad, trackWebVital } from '@/lib/performance';

/**
 * Hook to monitor page performance
 * Tracks page load times and navigation
 */
export function usePerformanceMonitoring() {
  const location = useLocation();
  const navigationStartRef = useRef<number>(performance.now());

  useEffect(() => {
    // Track page load time when route changes
    const loadTime = Math.round(performance.now() - navigationStartRef.current);
    trackPageLoad(location.pathname, loadTime);

    // Reset for next navigation
    navigationStartRef.current = performance.now();
  }, [location.pathname]);

  useEffect(() => {
    // Track First Input Delay when user interacts
    const handleFirstInput = (event: Event) => {
      const inputEvent = event as Event & { processingStart?: number; timeStamp?: number };
      if (inputEvent.processingStart && inputEvent.timeStamp) {
        const fid = inputEvent.processingStart - inputEvent.timeStamp;
        trackWebVital('FID', fid);
      }
    };

    // Listen for first user interaction
    const events = ['click', 'keydown', 'mousedown', 'touchstart'];
    events.forEach(eventType => {
      window.addEventListener(eventType, handleFirstInput, { once: true, passive: true });
    });

    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleFirstInput);
      });
    };
  }, []);
}
