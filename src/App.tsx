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
import { FeatureErrorBoundary } from "@/components/FeatureErrorBoundary";

import { AuthProvider } from "@/contexts/AuthContext";

import { useAnalytics } from "@/hooks/useAnalytics";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";

import { lazyWithRetry, prefetchCommonRoutes } from "@/lib/lazy-utils";
import { defaultQueryClientConfig } from "@/lib/query-config";

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
const CalculadoraSemanas = lazyWithRetry(() => import("./pages/CalculadoraSemanas"));
const ChecklistDocumentos = lazyWithRetry(() => import("./pages/ChecklistDocumentos"));
const ChecklistQuartinho = lazyWithRetry(() => import("./pages/ChecklistQuartinho"));
const TimerMamada = lazyWithRetry(() => import("./pages/TimerMamada"));
const DiarioCrescimento = lazyWithRetry(() => import("./pages/DiarioCrescimento"));
const PlanejadorRotina = lazyWithRetry(() => import("./pages/PlanejadorRotina"));
const IntroducaoAlimentar = lazyWithRetry(() => import("./pages/IntroducaoAlimentar"));
const AlbumMarcos = lazyWithRetry(() => import("./pages/AlbumMarcos"));
const Blog = lazyWithRetry(() => import("./pages/Blog"));
const BlogPost = lazyWithRetry(() => import("./pages/BlogPost"));
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

/** Helper to wrap a page with FeatureErrorBoundary + MainLayout + animation */
const FeaturePage = ({ name, children }: { name: string; children: React.ReactNode }) => (
  <MainLayout>
    <FeatureErrorBoundary featureName={name}>
      <div className="animate-scale-in">{children}</div>
    </FeatureErrorBoundary>
  </MainLayout>
);

const App = () => {
  // QueryClient com configuração centralizada — importação síncrona
  const [queryClient] = useState(() => new QueryClient(defaultQueryClientConfig));

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
            <Route path="/blog" element={<div className="animate-fade-in"><Blog /></div>} />
            <Route path="/blog/:slug" element={<div className="animate-fade-in"><BlogPost /></div>} />
            
            {/* Protected Routes with Layout */}
            <Route element={<ProtectedRoute />}>
              <Route path="/complete-profile" element={<FeaturePage name="Perfil"><CompleteProfile /></FeaturePage>} />
              <Route path="/dashboard" element={<FeaturePage name="Dashboard"><Dashboard /></FeaturePage>} />
              <Route path="/profile" element={<FeaturePage name="Perfil"><ProfileSettings /></FeaturePage>} />
              <Route path="/admin" element={<FeaturePage name="Admin"><AdminDashboard /></FeaturePage>} />
              <Route path="/materiais" element={<FeaturePage name="Materiais"><Materiais /></FeaturePage>} />
              <Route path="/clube-premium" element={<FeaturePage name="Premium"><ClubePremium /></FeaturePage>} />
              <Route path="/dashboard-bebe" element={<FeaturePage name="Dashboard Bebê"><DashboardBebe /></FeaturePage>} />
              <Route path="/conquistas" element={<FeaturePage name="Conquistas"><MinhasConquistas /></FeaturePage>} />
              <Route path="/comunidade" element={<FeaturePage name="Comunidade"><Comunidade /></FeaturePage>} />
              <Route path="/suporte" element={<FeaturePage name="Suporte"><Suporte /></FeaturePage>} />
              
              {/* Product Routes */}
              <Route element={<ProductRoute productSlug="controle-enxoval" />}>
                <Route path="/materiais/controle-enxoval" element={<FeaturePage name="Enxoval"><Index /></FeaturePage>} />
              </Route>
              
              <Route element={<ProductRoute productSlug="calculadora-fraldas" />}>
                <Route path="/materiais/calculadora-fraldas" element={<FeaturePage name="Calculadora de Fraldas"><CalculadoraFraldas /></FeaturePage>} />
              </Route>

              <Route element={<ProductRoute productSlug="mala-maternidade" />}>
                <Route path="/materiais/mala-maternidade" element={<FeaturePage name="Mala da Maternidade"><MalaDaMaternidade /></FeaturePage>} />
              </Route>

              <Route element={<ProductRoute productSlug="guia-alimentacao" />}>
                <Route path="/materiais/guia-alimentacao" element={<FeaturePage name="Alimentação"><GuiaAlimentacao /></FeaturePage>} />
              </Route>

              <Route element={<ProductRoute productSlug="diario-sono" />}>
                <Route path="/materiais/diario-sono" element={<FeaturePage name="Diário de Sono"><DiarioSono /></FeaturePage>} />
              </Route>

              <Route element={<ProductRoute productSlug="rastreador-amamentacao" />}>
                <Route path="/materiais/rastreador-amamentacao" element={<FeaturePage name="Amamentação"><RastreadorAmamentacao /></FeaturePage>} />
              </Route>

              <Route element={<ProductRoute productSlug="cartao-vacinacao" />}>
                <Route path="/materiais/cartao-vacinacao" element={<FeaturePage name="Vacinação"><CartaoVacinacao /></FeaturePage>} />
              </Route>

              <Route element={<ProductRoute productSlug="recuperacao-pos-parto" />}>
                <Route path="/materiais/recuperacao-pos-parto" element={<FeaturePage name="Recuperação Pós-Parto"><RecuperacaoPosPartoPage /></FeaturePage>} />
              </Route>

              <Route element={<ProductRoute productSlug="monitor-desenvolvimento" />}>
                <Route path="/materiais/monitor-desenvolvimento" element={<FeaturePage name="Desenvolvimento"><MonitorDesenvolvimento /></FeaturePage>} />
              </Route>

              <Route element={<ProductRoute productSlug="ferramentas-gestacao" />}>
                <Route path="/materiais/ferramentas-gestacao" element={<FeaturePage name="Gestação"><FerramentasGestacao /></FeaturePage>} />
              </Route>

              <Route element={<ProductRoute productSlug="calculadora-semanas" />}>
                <Route path="/calculadora-semanas" element={<FeaturePage name="Calculadora de Semanas"><CalculadoraSemanas /></FeaturePage>} />
              </Route>

              <Route element={<ProductRoute productSlug="checklist-documentos" />}>
                <Route path="/checklist-documentos" element={<FeaturePage name="Checklist Documentos"><ChecklistDocumentos /></FeaturePage>} />
              </Route>

              <Route element={<ProductRoute productSlug="checklist-quartinho" />}>
                <Route path="/checklist-quartinho" element={<FeaturePage name="Checklist Quartinho"><ChecklistQuartinho /></FeaturePage>} />
              </Route>

              <Route element={<ProductRoute productSlug="timer-mamada" />}>
                <Route path="/timer-mamada" element={<FeaturePage name="Timer de Mamada"><TimerMamada /></FeaturePage>} />
              </Route>

              <Route element={<ProductRoute productSlug="diario-crescimento" />}>
                <Route path="/diario-crescimento" element={<FeaturePage name="Diário de Crescimento"><DiarioCrescimento /></FeaturePage>} />
              </Route>

              <Route element={<ProductRoute productSlug="planejador-rotina" />}>
                <Route path="/planejador-rotina" element={<FeaturePage name="Planejador de Rotina"><PlanejadorRotina /></FeaturePage>} />
              </Route>

              <Route element={<ProductRoute productSlug="introducao-alimentar" />}>
                <Route path="/introducao-alimentar" element={<FeaturePage name="Introdução Alimentar"><IntroducaoAlimentar /></FeaturePage>} />
              </Route>

              <Route element={<ProductRoute productSlug="album-marcos" />}>
                <Route path="/album-marcos" element={<FeaturePage name="Álbum de Marcos"><AlbumMarcos /></FeaturePage>} />
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
