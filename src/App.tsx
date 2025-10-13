import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProductRoute } from "@/components/ProductRoute";
import { MainLayout } from "@/components/layout/MainLayout";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected Routes with Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout><Routes><Route path="*" element={null} /></Routes></MainLayout>}>
                <Route path="/complete-profile" element={<CompleteProfile />} />
                <Route path="/profile" element={<ProfileSettings />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/materiais" element={<Materiais />} />
                <Route path="/comunidade" element={<Comunidade />} />
                <Route path="/suporte" element={<Suporte />} />
                
                {/* Product Routes */}
                <Route element={<ProductRoute productSlug="controle-enxoval" />}>
                  <Route path="/materiais/controle-enxoval" element={<Index />} />
                </Route>
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
