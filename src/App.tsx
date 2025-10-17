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
const SharedEnxoval = lazy(() => import("./pages/SharedEnxoval"));
const CalculadoraFraldas = lazy(() => import("./pages/CalculadoraFraldas"));

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
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse">Carregando...</div>
        </div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<div className="animate-fade-in"><Landing /></div>} />
            <Route path="/auth" element={<div className="animate-fade-in"><AuthPage /></div>} />
            <Route path="/shared/:token" element={<div className="animate-fade-in"><SharedEnxoval /></div>} />
            
            {/* Protected Routes with Layout */}
            <Route element={<ProtectedRoute />}>
              <Route path="/complete-profile" element={<MainLayout><div className="animate-scale-in"><CompleteProfile /></div></MainLayout>} />
              <Route path="/profile" element={<MainLayout><div className="animate-scale-in"><ProfileSettings /></div></MainLayout>} />
              <Route path="/admin" element={<MainLayout><div className="animate-scale-in"><AdminDashboard /></div></MainLayout>} />
              <Route path="/materiais" element={<MainLayout><div className="animate-scale-in"><Materiais /></div></MainLayout>} />
              <Route path="/comunidade" element={<MainLayout><div className="animate-scale-in"><Comunidade /></div></MainLayout>} />
              <Route path="/suporte" element={<MainLayout><div className="animate-scale-in"><Suporte /></div></MainLayout>} />
              
              {/* Product Routes */}
              <Route element={<ProductRoute productSlug="controle-enxoval" />}>
                <Route path="/materiais/controle-enxoval" element={<MainLayout><div className="animate-scale-in"><Index /></div></MainLayout>} />
              </Route>
              
              <Route element={<ProductRoute productSlug="calculadora-fraldas" />}>
                <Route path="/materiais/calculadora-fraldas" element={<MainLayout><div className="animate-scale-in"><CalculadoraFraldas /></div></MainLayout>} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<div className="animate-fade-in"><NotFound /></div>} />
          </Routes>
        </Suspense>
        </AnalyticsWrapper>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
