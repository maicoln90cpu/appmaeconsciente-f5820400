/**
 * Performance monitoring utilities
 * Tracks page load times, API response times, and Core Web Vitals
 * 
 * NOTE: This file must NOT import from logger.ts to avoid circular dependencies
 */

import * as Sentry from "@sentry/react";

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface ApiMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
}

// Store metrics in memory for dashboard
const metricsStore: {
  webVitals: PerformanceMetric[];
  apiCalls: ApiMetric[];
  errors: { message: string; count: number; lastSeen: number }[];
  pageLoads: { path: string; duration: number; timestamp: number }[];
} = {
  webVitals: [],
  apiCalls: [],
  errors: [],
  pageLoads: [],
};

// Thresholds based on Google's Core Web Vitals
const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  INP: { good: 200, poor: 500 },   // Interaction to Next Paint
};

const getRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds = WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
};

// Track Core Web Vitals
export const trackWebVital = (name: string, value: number): void => {
  const metric: PerformanceMetric = {
    name,
    value,
    rating: getRating(name, value),
    timestamp: Date.now(),
  };
  
  metricsStore.webVitals.push(metric);
  
  // Keep only last 100 metrics
  if (metricsStore.webVitals.length > 100) {
    metricsStore.webVitals.shift();
  }
  
  // Log poor metrics
  if (metric.rating === 'poor') {
    if (import.meta.env.DEV) {
      console.warn(`[Performance] Poor Web Vital: ${name} = ${value}ms`);
    }
    
    // Send to Sentry as measurement
    Sentry.addBreadcrumb({
      category: 'web-vital',
      message: `${name}: ${value}`,
      level: 'warning',
      data: { rating: metric.rating },
    });
  }
  
  if (import.meta.env.DEV) {
    console.debug(`[Performance] Web Vital: ${name} = ${value}ms (${metric.rating})`);
  }
};

// Track API calls
export const trackApiCall = (
  endpoint: string,
  method: string,
  duration: number,
  status: number
): void => {
  const metric: ApiMetric = {
    endpoint,
    method,
    duration,
    status,
    timestamp: Date.now(),
  };
  
  metricsStore.apiCalls.push(metric);
  
  // Keep only last 200 API calls
  if (metricsStore.apiCalls.length > 200) {
    metricsStore.apiCalls.shift();
  }
  
  // Track slow API calls
  if (duration > 3000) {
    if (import.meta.env.DEV) {
      console.warn(`[Performance] Slow API call: ${method} ${endpoint} took ${duration}ms`);
    }
    
    Sentry.addBreadcrumb({
      category: 'api',
      message: `Slow API: ${method} ${endpoint}`,
      level: 'warning',
      data: { duration, status },
    });
  }
};

// Track errors for dashboard
export const trackError = (message: string): void => {
  const existing = metricsStore.errors.find(e => e.message === message);
  
  if (existing) {
    existing.count++;
    existing.lastSeen = Date.now();
  } else {
    metricsStore.errors.push({
      message,
      count: 1,
      lastSeen: Date.now(),
    });
  }
  
  // Keep only last 50 unique errors
  if (metricsStore.errors.length > 50) {
    metricsStore.errors.sort((a, b) => b.lastSeen - a.lastSeen);
    metricsStore.errors.pop();
  }
};

// Track page loads
export const trackPageLoad = (path: string, duration: number): void => {
  metricsStore.pageLoads.push({
    path,
    duration,
    timestamp: Date.now(),
  });
  
  // Keep only last 100 page loads
  if (metricsStore.pageLoads.length > 100) {
    metricsStore.pageLoads.shift();
  }
};

// Get metrics summary for dashboard
export const getMetricsSummary = () => {
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;
  const lastHour = now - 60 * 60 * 1000;
  
  // Calculate Web Vitals averages
  const recentWebVitals = metricsStore.webVitals.filter(m => m.timestamp > last24h);
  const webVitalsByName: Record<string, { values: number[]; ratings: string[] }> = {};
  
  recentWebVitals.forEach(m => {
    if (!webVitalsByName[m.name]) {
      webVitalsByName[m.name] = { values: [], ratings: [] };
    }
    webVitalsByName[m.name].values.push(m.value);
    webVitalsByName[m.name].ratings.push(m.rating);
  });
  
  const webVitalsAvg = Object.entries(webVitalsByName).map(([name, data]) => ({
    name,
    avg: Math.round(data.values.reduce((a, b) => a + b, 0) / data.values.length),
    good: data.ratings.filter(r => r === 'good').length,
    poor: data.ratings.filter(r => r === 'poor').length,
    total: data.ratings.length,
  }));
  
  // Calculate API metrics
  const recentApiCalls = metricsStore.apiCalls.filter(m => m.timestamp > lastHour);
  const avgApiTime = recentApiCalls.length > 0
    ? Math.round(recentApiCalls.reduce((a, b) => a + b.duration, 0) / recentApiCalls.length)
    : 0;
  const errorRate = recentApiCalls.length > 0
    ? Math.round((recentApiCalls.filter(c => c.status >= 400).length / recentApiCalls.length) * 100)
    : 0;
  
  // Top slow endpoints
  const slowEndpoints = [...metricsStore.apiCalls]
    .filter(c => c.timestamp > last24h)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5)
    .map(c => ({
      endpoint: c.endpoint,
      method: c.method,
      duration: c.duration,
    }));
  
  // Recent errors
  const recentErrors = metricsStore.errors
    .filter(e => e.lastSeen > last24h)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Page load times
  const recentPageLoads = metricsStore.pageLoads.filter(p => p.timestamp > lastHour);
  const avgPageLoad = recentPageLoads.length > 0
    ? Math.round(recentPageLoads.reduce((a, b) => a + b.duration, 0) / recentPageLoads.length)
    : 0;
  
  return {
    webVitals: webVitalsAvg,
    api: {
      totalCalls: recentApiCalls.length,
      avgResponseTime: avgApiTime,
      errorRate,
      slowEndpoints,
    },
    errors: recentErrors,
    pageLoad: {
      avgTime: avgPageLoad,
      totalLoads: recentPageLoads.length,
    },
    timestamp: now,
  };
};

// Track long tasks that block the main thread
export const trackLongTask = (duration: number, attribution?: string): void => {
  if (duration > 50) { // Tasks > 50ms are considered "long"
    if (import.meta.env.DEV) {
      console.warn(`[Performance] Long task detected: ${duration.toFixed(0)}ms`, attribution);
    }
    
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `Long task: ${duration.toFixed(0)}ms`,
      level: duration > 100 ? 'warning' : 'info',
      data: { attribution },
    });
  }
};

// Track Interaction to Next Paint (INP)
let maxINP = 0;
export const trackInteraction = (duration: number, interactionType?: string): void => {
  if (duration > maxINP) {
    maxINP = duration;
    trackWebVital('INP', duration);
  }
  
  if (duration > 200) { // Poor INP threshold
    if (import.meta.env.DEV) {
      console.warn(`[Performance] Slow interaction: ${duration.toFixed(0)}ms (${interactionType})`);
    }
  }
};

// Initialize performance observer for Web Vitals
export const initPerformanceObserver = (): void => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }
  
  try {
    // Observe paint events (FCP, LCP)
    const paintObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          trackWebVital('FCP', entry.startTime);
        }
        if (entry.entryType === 'largest-contentful-paint') {
          trackWebVital('LCP', entry.startTime);
        }
      });
    });
    
    paintObserver.observe({ type: 'paint', buffered: true });
    
    // Observe LCP separately for better support
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          trackWebVital('LCP', lastEntry.startTime);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // LCP not supported in all browsers
    }
    
    // Observe layout shifts (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: PerformanceEntry) => {
          const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
            clsValue += layoutShiftEntry.value;
          }
        });
        trackWebVital('CLS', clsValue);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // CLS not supported in all browsers
    }
    
    // Observe navigation timing (TTFB)
    const navObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: PerformanceEntry) => {
        const navEntry = entry as PerformanceNavigationTiming;
        if (navEntry.responseStart) {
          trackWebVital('TTFB', navEntry.responseStart);
        }
      });
    });
    navObserver.observe({ type: 'navigation', buffered: true });
    
    // Observe long tasks (blocks main thread > 50ms)
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const attribution = (entry as unknown as { attribution?: Array<{ name?: string }> }).attribution?.[0]?.name;
          trackLongTask(entry.duration, attribution);
        });
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch {
      // Long tasks not supported in all browsers
    }
    
    // Observe Event Timing for INP
    try {
      const eventTimingObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const eventEntry = entry as PerformanceEntry & { 
            processingStart?: number; 
            processingEnd?: number;
            interactionId?: number;
          };
          
          if (eventEntry.interactionId && eventEntry.interactionId > 0) {
            const duration = entry.duration;
            trackInteraction(duration, entry.name);
          }
        });
      });
      eventTimingObserver.observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    } catch {
      // Event timing not supported in all browsers
    }
    
    // Observe First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const fidEntry = entry as PerformanceEntry & { processingStart?: number };
          if (fidEntry.processingStart) {
            const fid = fidEntry.processingStart - entry.startTime;
            trackWebVital('FID', fid);
          }
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch {
      // FID not supported in all browsers
    }
    
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('[Performance] Performance Observer not fully supported');
    }
  }
};

// Wrap fetch to track API calls
export const instrumentFetch = (): void => {
  const originalFetch = window.fetch;
  
  window.fetch = async (input, init) => {
    const startTime = performance.now();
    const url = typeof input === 'string' 
      ? input 
      : input instanceof URL 
        ? input.href 
        : input.url;
    const method = init?.method || 'GET';
    
    try {
      const response = await originalFetch(input, init);
      const duration = Math.round(performance.now() - startTime);
      
      // Only track Supabase API calls
      if (url.includes('supabase') || url.includes('/rest/') || url.includes('/functions/')) {
        trackApiCall(url, method, duration, response.status);
      }
      
      return response;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      trackApiCall(url, method, duration, 0);
      throw error;
    }
  };
};

// Export store for debugging
export const getMetricsStore = () => ({ ...metricsStore });

/**
 * Resource hints - preload/prefetch critical resources
 */
export const addResourceHint = (
  url: string,
  type: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch',
  as?: 'script' | 'style' | 'font' | 'image' | 'fetch'
): void => {
  // Avoid duplicates
  const existing = document.querySelector(`link[href="${url}"][rel="${type}"]`);
  if (existing) return;
  
  const link = document.createElement('link');
  link.rel = type;
  link.href = url;
  
  if (as && (type === 'preload' || type === 'prefetch')) {
    link.as = as;
  }
  
  if (type === 'preconnect' || type === 'dns-prefetch') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
};

/**
 * Preconnect to critical origins
 */
export const preconnectCriticalOrigins = (): void => {
  const origins = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];
  
  // Add Supabase URL if available
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    origins.push(supabaseUrl);
  }
  
  origins.forEach(origin => {
    addResourceHint(origin, 'preconnect');
    addResourceHint(origin, 'dns-prefetch');
  });
};

/**
 * Measure and log component render time
 */
export const measureRender = (componentName: string): { start: () => void; end: () => void } => {
  let startTime: number;
  
  return {
    start: () => {
      startTime = performance.now();
    },
    end: () => {
      const duration = performance.now() - startTime;
      if (import.meta.env.DEV && duration > 16) {
        console.warn(`[Performance] Slow render: ${componentName} took ${duration.toFixed(1)}ms`);
      }
    },
  };
};

/**
 * Batch DOM reads and writes to avoid layout thrashing
 */
export const scheduleDOMUpdate = (callback: () => void): void => {
  requestAnimationFrame(() => {
    callback();
  });
};

/**
 * Defer non-critical work to idle time
 */
export const scheduleIdleWork = (
  callback: () => void,
  timeout = 2000
): void => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => callback(),
      { timeout }
    );
  } else {
    setTimeout(callback, 1);
  }
};
