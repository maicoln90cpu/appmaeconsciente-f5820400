import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProductRoute } from "@/components/ProductRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAnalytics } from "@/hooks/useAnalytics";

const Landing = lazy(() => import("./pages/Landing"));
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const Materiais = lazy(() => import("./pages/Materiais"));
const Comunidade = lazy(() => import("./pages/Comunidade"));
const Suporte = lazy(() => import("./pages/Suporte"));
const AuthPage = lazy(() => import("./pages/AuthPage"));

const queryClient = new QueryClient();

const AnalyticsWrapper = ({ children }: { children: React.ReactNode }) => {
  useAnalytics();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnalyticsWrapper>
        <Suspense fallback={<div />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected Routes with Layout */}
            <Route element={<ProtectedRoute />}>
              <Route path="/complete-profile" element={<MainLayout><CompleteProfile /></MainLayout>} />
              <Route path="/profile" element={<MainLayout><ProfileSettings /></MainLayout>} />
              <Route path="/admin" element={<MainLayout><AdminDashboard /></MainLayout>} />
              <Route path="/materiais" element={<MainLayout><Materiais /></MainLayout>} />
              <Route path="/comunidade" element={<MainLayout><Comunidade /></MainLayout>} />
              <Route path="/suporte" element={<MainLayout><Suporte /></MainLayout>} />
              
              {/* Product Routes */}
              <Route element={<ProductRoute productSlug="controle-enxoval" />}>
                <Route path="/materiais/controle-enxoval" element={<MainLayout><Index /></MainLayout>} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </AnalyticsWrapper>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
