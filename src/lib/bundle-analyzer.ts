/**
 * Bundle analysis utilities for performance monitoring
 * Helps identify large chunks and optimization opportunities
 */

interface ChunkInfo {
  name: string;
  size: number;
  loadTime: number;
  cached: boolean;
}

interface BundleAnalysis {
  chunks: ChunkInfo[];
  totalSize: number;
  cachedSize: number;
  networkSize: number;
  loadTime: number;
}

// Store loaded chunks
const loadedChunks: Map<string, ChunkInfo> = new Map();

/**
 * Track chunk loading performance
 * Call this from dynamic imports to monitor bundle sizes
 */
export function trackChunkLoad(chunkName: string, startTime: number): void {
  const loadTime = performance.now() - startTime;
  
  // Check if chunk was served from cache
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const chunkEntry = entries.find(e => e.name.includes(chunkName));
  
  const info: ChunkInfo = {
    name: chunkName,
    size: chunkEntry?.transferSize ?? 0,
    loadTime,
    cached: chunkEntry?.transferSize === 0 && (chunkEntry?.decodedBodySize ?? 0) > 0,
  };
  
  loadedChunks.set(chunkName, info);
  
  if (import.meta.env.DEV) {
    console.debug(`[Bundle] Loaded ${chunkName}: ${formatBytes(info.size)} in ${loadTime.toFixed(0)}ms${info.cached ? ' (cached)' : ''}`);
  }
}

/**
 * Get current bundle analysis
 */
export function getBundleAnalysis(): BundleAnalysis {
  const chunks = Array.from(loadedChunks.values());
  
  const totalSize = chunks.reduce((sum, c) => sum + c.size, 0);
  const cachedSize = chunks.filter(c => c.cached).reduce((sum, c) => sum + c.size, 0);
  const networkSize = totalSize - cachedSize;
  const loadTime = chunks.reduce((sum, c) => sum + c.loadTime, 0);
  
  return {
    chunks: chunks.sort((a, b) => b.size - a.size),
    totalSize,
    cachedSize,
    networkSize,
    loadTime,
  };
}

/**
 * Analyze initial page load performance
 */
export function analyzePageLoad(): {
  resources: { type: string; count: number; size: number }[];
  timing: Record<string, number>;
  recommendations: string[];
} {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  // Group by type
  const byType = new Map<string, { count: number; size: number }>();
  
  entries.forEach(entry => {
    const type = getResourceType(entry.name);
    const current = byType.get(type) || { count: 0, size: 0 };
    byType.set(type, {
      count: current.count + 1,
      size: current.size + (entry.transferSize || 0),
    });
  });
  
  const resources = Array.from(byType.entries())
    .map(([type, data]) => ({ type, ...data }))
    .sort((a, b) => b.size - a.size);
  
  // Navigation timing
  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const timing: Record<string, number> = {};
  
  if (navEntry) {
    timing.dns = navEntry.domainLookupEnd - navEntry.domainLookupStart;
    timing.tcp = navEntry.connectEnd - navEntry.connectStart;
    timing.ttfb = navEntry.responseStart - navEntry.requestStart;
    timing.download = navEntry.responseEnd - navEntry.responseStart;
    timing.domInteractive = navEntry.domInteractive - navEntry.responseEnd;
    timing.domComplete = navEntry.domComplete - navEntry.domInteractive;
    timing.total = navEntry.loadEventEnd - navEntry.startTime;
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  const jsSize = resources.find(r => r.type === 'script')?.size || 0;
  if (jsSize > 500 * 1024) {
    recommendations.push(`JavaScript bundle is ${formatBytes(jsSize)}. Consider code splitting.`);
  }
  
  const cssSize = resources.find(r => r.type === 'stylesheet')?.size || 0;
  if (cssSize > 100 * 1024) {
    recommendations.push(`CSS is ${formatBytes(cssSize)}. Consider removing unused styles.`);
  }
  
  const imgCount = resources.find(r => r.type === 'image')?.count || 0;
  if (imgCount > 20) {
    recommendations.push(`${imgCount} images loaded. Consider lazy loading.`);
  }
  
  if (timing.ttfb && timing.ttfb > 600) {
    recommendations.push(`TTFB is ${timing.ttfb.toFixed(0)}ms. Server response is slow.`);
  }
  
  const uncachedResources = entries.filter(e => e.transferSize > 0).length;
  const cachedResources = entries.filter(e => e.transferSize === 0 && e.decodedBodySize > 0).length;
  const cacheRate = cachedResources / (cachedResources + uncachedResources);
  
  if (cacheRate < 0.5) {
    recommendations.push(`Cache hit rate is ${(cacheRate * 100).toFixed(0)}%. Improve caching strategy.`);
  }
  
  return { resources, timing, recommendations };
}

/**
 * Monitor long tasks that block the main thread
 */
export function observeLongTasks(callback: (task: { duration: number; startTime: number }) => void): () => void {
  if (!('PerformanceObserver' in window)) {
    return () => {};
  }
  
  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        callback({
          duration: entry.duration,
          startTime: entry.startTime,
        });
      });
    });
    
    observer.observe({ type: 'longtask', buffered: true });
    
    return () => observer.disconnect();
  } catch {
    return () => {};
  }
}

/**
 * Get memory usage information (Chrome only)
 */
export function getMemoryInfo(): { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } | null {
  const memory = (performance as Performance & { memory?: { 
    usedJSHeapSize: number; 
    totalJSHeapSize: number; 
    jsHeapSizeLimit: number;
  } }).memory;
  
  if (!memory) return null;
  
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
  };
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get resource type from URL
 */
function getResourceType(url: string): string {
  const extension = url.split('?')[0].split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'js':
    case 'mjs':
      return 'script';
    case 'css':
      return 'stylesheet';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'svg':
    case 'ico':
      return 'image';
    case 'woff':
    case 'woff2':
    case 'ttf':
    case 'eot':
      return 'font';
    case 'json':
      return 'data';
    default:
      if (url.includes('/rest/') || url.includes('/functions/')) {
        return 'api';
      }
      return 'other';
  }
}

/**
 * Export bundle report for analysis
 */
export function exportBundleReport(): string {
  const analysis = getBundleAnalysis();
  const pageLoad = analyzePageLoad();
  const memory = getMemoryInfo();
  
  const report = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    bundle: analysis,
    pageLoad,
    memory: memory ? {
      used: formatBytes(memory.usedJSHeapSize),
      total: formatBytes(memory.totalJSHeapSize),
      limit: formatBytes(memory.jsHeapSizeLimit),
      utilization: `${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1)}%`,
    } : null,
  };
  
  return JSON.stringify(report, null, 2);
}

/**
 * Prefetch configuration for routes
 */
interface PrefetchConfig {
  path: string;
  priority: 'high' | 'low';
  loader: () => Promise<unknown>;
}

// Track prefetched routes
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a route's chunk during idle time
 */
export function prefetchRoute(config: PrefetchConfig): void {
  if (prefetchedRoutes.has(config.path)) return;
  
  const prefetch = () => {
    const startTime = performance.now();
    
    config.loader()
      .then(() => {
        prefetchedRoutes.add(config.path);
        trackChunkLoad(config.path, startTime);
        
        if (import.meta.env.DEV) {
          console.debug(`[Bundle] Prefetched ${config.path}`);
        }
      })
      .catch(() => {
        // Silently fail - prefetch is optimization only
      });
  };

  if (config.priority === 'high') {
    // Prefetch immediately after current task
    setTimeout(prefetch, 0);
  } else {
    // Prefetch during idle time
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => prefetch(), { timeout: 5000 });
    } else {
      setTimeout(prefetch, 2000);
    }
  }
}

/**
 * Prefetch routes based on user navigation patterns
 */
export function setupSmartPrefetch(routes: PrefetchConfig[]): void {
  // Don't prefetch on slow connections
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
  
  if (connection?.saveData) {
    if (import.meta.env.DEV) {
      console.debug('[Bundle] Save-Data enabled, skipping prefetch');
    }
    return;
  }
  
  const isSlowConnection = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';
  
  if (isSlowConnection) {
    if (import.meta.env.DEV) {
      console.debug('[Bundle] Slow connection detected, limiting prefetch');
    }
    // Only prefetch high priority routes on slow connections
    routes.filter(r => r.priority === 'high').forEach(prefetchRoute);
    return;
  }
  
  // Prefetch high priority first, then low priority
  const highPriority = routes.filter(r => r.priority === 'high');
  const lowPriority = routes.filter(r => r.priority === 'low');
  
  highPriority.forEach(prefetchRoute);
  
  // Delay low priority prefetching
  setTimeout(() => {
    lowPriority.forEach(prefetchRoute);
  }, 3000);
}

/**
 * Observe which routes users navigate to for analytics
 */
const routeFrequency = new Map<string, number>();

export function trackRouteVisit(path: string): void {
  const count = routeFrequency.get(path) || 0;
  routeFrequency.set(path, count + 1);
}

export function getMostVisitedRoutes(limit = 5): { path: string; visits: number }[] {
  return Array.from(routeFrequency.entries())
    .map(([path, visits]) => ({ path, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, limit);
}

/**
 * Check if a route has been prefetched
 */
export function isRoutePrefetched(path: string): boolean {
  return prefetchedRoutes.has(path);
}

/**
 * Get prefetch status for debugging
 */
export function getPrefetchStatus(): { prefetched: string[]; pending: number } {
  return {
    prefetched: Array.from(prefetchedRoutes),
    pending: 0, // Would need to track pending prefetches
  };
}
