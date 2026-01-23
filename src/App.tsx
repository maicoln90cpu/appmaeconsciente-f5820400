import React, { Suspense, lazy, useState, useEffect } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageLoader } from "@/components/ui/page-loader";

import { GTMScript } from "@/components/GTMScript";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProductRoute } from "@/components/ProductRoute";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SkipLink } from "@/components/SkipLink";
import { InstallPrompt } from "@/components/install/InstallPrompt";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";

import { AuthProvider } from "@/contexts/AuthContext";

import { useAnalytics } from "@/hooks/useAnalytics";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";

import { lazyWithRetry, prefetchCommonRoutes } from "@/lib/lazy-utils";

// Lazy load com retry automático para resiliência de rede
const Landing = lazyWithRetry(() => import("./pages/Landing"));
const Index = lazyWithRetry(() => import("./pages/Index"));
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const CompleteProfile = lazyWithRetry(() => import("./pages/CompleteProfile"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const ProfileSettings = lazyWithRetry(() => import("./pages/ProfileSettings"));
const Materiais = lazyWithRetry(() => import("./pages/Materiais"));
const ClubePremium = lazyWithRetry(() => import("./pages/ClubePremium"));
const DashboardBebe = lazyWithRetry(() => import("./pages/DashboardBebe"));
const MinhasConquistas = lazyWithRetry(() => import("./pages/MinhasConquistas"));
const Comunidade = lazyWithRetry(() => import("./pages/Comunidade"));
const Suporte = lazyWithRetry(() => import("./pages/Suporte"));
const AuthPage = lazyWithRetry(() => import("./pages/AuthPage"));
const SharedEnxoval = lazyWithRetry(() => import("./pages/SharedEnxoval"));
const CalculadoraFraldas = lazyWithRetry(() => import("./pages/CalculadoraFraldas"));
const MalaDaMaternidade = lazyWithRetry(() => import("./pages/MalaDaMaternidade"));
const GuiaAlimentacao = lazyWithRetry(() => import("./pages/GuiaAlimentacao"));
const DiarioSono = lazyWithRetry(() => import("./pages/DiarioSono"));
const RastreadorAmamentacao = lazyWithRetry(() => import("./pages/RastreadorAmamentacao"));
const CartaoVacinacao = lazyWithRetry(() => import("./pages/CartaoVacinacao"));
const RecuperacaoPosPartoPage = lazyWithRetry(() => import("./pages/RecuperacaoPosPartoPage"));
const MonitorDesenvolvimento = lazyWithRetry(() => import("./pages/MonitorDesenvolvimento"));
const FerramentasGestacao = lazyWithRetry(() => import("./pages/FerramentasGestacao"));
const Offline = lazy(() => import("./pages/Offline"));

const AnalyticsWrapper = ({ children }: { children: React.ReactNode }) => {
  useAnalytics();
  usePerformanceMonitoring();
  
  useEffect(() => {
    // Prefetch rotas comuns em idle time
    prefetchCommonRoutes();
  }, []);
  
  return <>{children}</>;
};

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  
  return null;
};

const App = () => {
  // QueryClient com configuração centralizada
  const [queryClient] = useState(() => {
    // Importação dinâmica lazy para não bloquear
    import('@/lib/query-config').then(({ defaultQueryClientConfig }) => {
      queryClient.setDefaultOptions(defaultQueryClientConfig.defaultOptions);
    });
    
    return new QueryClient({
      defaultOptions: {
        queries: {
          // Configuração inicial (será sobrescrita após load)
          staleTime: 1000 * 60 * 5, // 5 minutos
          gcTime: 1000 * 60 * 30, // 30 minutos
          refetchOnWindowFocus: false,
          refetchOnReconnect: true,
          retry: (failureCount, error) => {
            // Não retry em erros de autenticação
            if (error instanceof Error && error.message.includes('401')) {
              return false;
            }
            return failureCount < 2;
          },
        },
        mutations: {
          retry: 1,
        },
      },
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <SkipLink />
          <Toaster />
          <Sonner />
          <GTMScript />
          <InstallPrompt />
          <UpdatePrompt />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <AnalyticsWrapper>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<div className="animate-fade-in"><Landing /></div>} />
            <Route path="/auth" element={<div className="animate-fade-in"><AuthPage /></div>} />
            <Route path="/shared/:token" element={<div className="animate-fade-in"><SharedEnxoval /></div>} />
            
            {/* Protected Routes with Layout */}
            <Route element={<ProtectedRoute />}>
              <Route path="/complete-profile" element={<MainLayout><div className="animate-scale-in"><CompleteProfile /></div></MainLayout>} />
              <Route path="/dashboard" element={<MainLayout><div className="animate-scale-in"><Dashboard /></div></MainLayout>} />
              <Route path="/profile" element={<MainLayout><div className="animate-scale-in"><ProfileSettings /></div></MainLayout>} />
              <Route path="/admin" element={<MainLayout><div className="animate-scale-in"><AdminDashboard /></div></MainLayout>} />
              <Route path="/materiais" element={<MainLayout><div className="animate-scale-in"><Materiais /></div></MainLayout>} />
              <Route path="/clube-premium" element={<MainLayout><div className="animate-scale-in"><ClubePremium /></div></MainLayout>} />
              <Route path="/dashboard-bebe" element={<MainLayout><div className="animate-scale-in"><DashboardBebe /></div></MainLayout>} />
              <Route path="/conquistas" element={<MainLayout><div className="animate-scale-in"><MinhasConquistas /></div></MainLayout>} />
              <Route path="/comunidade" element={<MainLayout><div className="animate-scale-in"><Comunidade /></div></MainLayout>} />
              <Route path="/suporte" element={<MainLayout><div className="animate-scale-in"><Suporte /></div></MainLayout>} />
              
              {/* Product Routes */}
              <Route element={<ProductRoute productSlug="controle-enxoval" />}>
                <Route path="/materiais/controle-enxoval" element={<MainLayout><div className="animate-scale-in"><Index /></div></MainLayout>} />
              </Route>
              
              <Route element={<ProductRoute productSlug="calculadora-fraldas" />}>
                <Route path="/materiais/calculadora-fraldas" element={<MainLayout><div className="animate-scale-in"><CalculadoraFraldas /></div></MainLayout>} />
              </Route>

              <Route element={<ProductRoute productSlug="mala-maternidade" />}>
                <Route path="/materiais/mala-maternidade" element={<MainLayout><div className="animate-scale-in"><MalaDaMaternidade /></div></MainLayout>} />
              </Route>

              <Route element={<ProductRoute productSlug="guia-alimentacao" />}>
                <Route path="/materiais/guia-alimentacao" element={<MainLayout><div className="animate-scale-in"><GuiaAlimentacao /></div></MainLayout>} />
              </Route>

              <Route element={<ProductRoute productSlug="diario-sono" />}>
                <Route path="/materiais/diario-sono" element={<MainLayout><div className="animate-scale-in"><DiarioSono /></div></MainLayout>} />
              </Route>

              <Route element={<ProductRoute productSlug="rastreador-amamentacao" />}>
                <Route path="/materiais/rastreador-amamentacao" element={<MainLayout><div className="animate-scale-in"><RastreadorAmamentacao /></div></MainLayout>} />
              </Route>

              <Route element={<ProductRoute productSlug="cartao-vacinacao" />}>
                <Route path="/materiais/cartao-vacinacao" element={<MainLayout><div className="animate-scale-in"><CartaoVacinacao /></div></MainLayout>} />
              </Route>

              <Route element={<ProductRoute productSlug="recuperacao-pos-parto" />}>
                <Route path="/materiais/recuperacao-pos-parto" element={<MainLayout><div className="animate-scale-in"><RecuperacaoPosPartoPage /></div></MainLayout>} />
              </Route>

              <Route element={<ProductRoute productSlug="monitor-desenvolvimento" />}>
                <Route path="/materiais/monitor-desenvolvimento" element={<MainLayout><div className="animate-scale-in"><MonitorDesenvolvimento /></div></MainLayout>} />
              </Route>

              <Route element={<ProductRoute productSlug="ferramentas-gestacao" />}>
                <Route path="/materiais/ferramentas-gestacao" element={<MainLayout><div className="animate-scale-in"><FerramentasGestacao /></div></MainLayout>} />
              </Route>
            </Route>

            {/* Offline fallback */}
            <Route path="/offline" element={<div className="animate-fade-in"><Offline /></div>} />
            
            {/* Catch-all */}
            <Route path="*" element={<div className="animate-fade-in"><NotFound /></div>} />
          </Routes>
        </Suspense>
        </AnalyticsWrapper>
        </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
