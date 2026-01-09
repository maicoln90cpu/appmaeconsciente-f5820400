import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initSentry } from "@/lib/sentry";
import { initPerformanceObserver, instrumentFetch } from "@/lib/performance";

// Initialize Sentry before rendering
initSentry();

// Initialize performance monitoring
initPerformanceObserver();
instrumentFetch();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
