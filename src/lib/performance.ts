/**
 * Performance monitoring utilities
 * Tracks page load times, API response times, and Core Web Vitals
 */

import * as Sentry from "@sentry/react";
import { logger } from "./logger";

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
    logger.warn(`Poor Web Vital: ${name} = ${value}ms`, { context: 'Performance' });
    
    // Send to Sentry as measurement
    Sentry.addBreadcrumb({
      category: 'web-vital',
      message: `${name}: ${value}`,
      level: 'warning',
      data: { rating: metric.rating },
    });
  }
  
  if (import.meta.env.DEV) {
    logger.debug(`Web Vital: ${name} = ${value}ms (${metric.rating})`, { context: 'Performance' });
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
    logger.warn(`Slow API call: ${method} ${endpoint} took ${duration}ms`, { context: 'Performance' });
    
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
    
  } catch (error) {
    logger.debug('Performance Observer not fully supported', { context: 'Performance' });
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
