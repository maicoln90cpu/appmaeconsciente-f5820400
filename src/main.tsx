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

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
