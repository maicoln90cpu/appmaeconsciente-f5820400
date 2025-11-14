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
const ClubePremium = lazy(() => import("./pages/ClubePremium"));
const DashboardBebe = lazy(() => import("./pages/DashboardBebe"));
const MinhasConquistas = lazy(() => import("./pages/MinhasConquistas"));
const Comunidade = lazy(() => import("./pages/Comunidade"));
const Suporte = lazy(() => import("./pages/Suporte"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const SharedEnxoval = lazy(() => import("./pages/SharedEnxoval"));
const CalculadoraFraldas = lazy(() => import("./pages/CalculadoraFraldas"));
const MalaDaMaternidade = lazy(() => import("./pages/MalaDaMaternidade"));
const GuiaAlimentacao = lazy(() => import("./pages/GuiaAlimentacao"));
const DiarioSono = lazy(() => import("./pages/DiarioSono"));
const RastreadorAmamentacao = lazy(() => import("./pages/RastreadorAmamentacao"));
const CartaoVacinacao = lazy(() => import("./pages/CartaoVacinacao"));
const RecuperacaoPosPartoPage = lazy(() => import("./pages/RecuperacaoPosPartoPage"));
const MonitorDesenvolvimento = lazy(() => import("./pages/MonitorDesenvolvimento"));

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
