import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initSentry } from "@/lib/sentry";
import { 
  initPerformanceObserver, 
  instrumentFetch, 
  preconnectCriticalOrigins,
  trackWebVital 
} from "@/lib/performance";
import { observeLongTasks } from "@/lib/bundle-analyzer";
import { prefetchCommonRoutes } from "@/lib/lazy-utils";

// Preconnect to critical origins ASAP
preconnectCriticalOrigins();

// Initialize Sentry before rendering
initSentry();

// Initialize performance monitoring
initPerformanceObserver();
instrumentFetch();

// Track long tasks that block main thread
observeLongTasks((task) => {
  if (task.duration > 50) {
    trackWebVital('LongTask', task.duration);
  }
});

// Prefetch common routes during idle time
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Wait for initial render to complete
    requestIdleCallback(() => prefetchCommonRoutes(), { timeout: 3000 });
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
