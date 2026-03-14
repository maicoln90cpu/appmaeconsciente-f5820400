import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Bell,
  BookOpen, 
  FileText,
  HeadphonesIcon, 
  Heart,
  Home,
  Lock,
  LogOut, 
  MessageSquare,
  Package,
  Settings, 
  Shield, 
  Ticket,
  UserCog,
  Users, 
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OfflineBanner, SyncQueueManager } from "@/components/offline";

import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/useToast";
import { useUserRole } from "@/hooks/useUserRole";

import { supabase } from "@/integrations/supabase/client";
import { preloadComponent, routeImports } from "@/lib/lazy-utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logout realizado com sucesso" });
    navigate("/");
  };

  const navItems = [
    { path: "/dashboard-bebe", label: "Início", icon: Home, preload: routeImports.dashboard },
    { path: "/comunidade", label: "Comunidade", icon: Users, preload: routeImports.comunidade },
    { path: "/materiais", label: "Ferramentas", icon: BookOpen, preload: routeImports.materiais },
    { path: "/suporte", label: "Suporte", icon: HeadphonesIcon, preload: routeImports.suporte },
  ];

  const footerLinks = {
    resources: [
      { path: "/materiais", label: "Ferramentas" },
      { path: "/comunidade", label: "Comunidade" },
      { path: "/clube-premium", label: "Clube Premium" },
    ],
    support: [
      { path: "/suporte", label: "Central de Ajuda" },
      { path: "/suporte", label: "Fale Conosco" },
    ],
    legal: [
      { path: "#", label: "Termos de Uso" },
      { path: "#", label: "Política de Privacidade" },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with enhanced backdrop blur */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 overflow-x-hidden">
        <div className="container flex h-16 items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 md:gap-8 min-w-0 flex-1">
            <Link 
              to="/materiais" 
              className="group flex items-center gap-2 text-base sm:text-lg md:text-xl font-display font-bold shrink-0"
            >
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent transition-all group-hover:to-primary/50 truncate">
                <span className="hidden xs:inline">Maternidade Consciente</span>
                <span className="xs:hidden">M.C.</span>
              </span>
            </Link>

            {/* Desktop Navigation with animated indicator */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onMouseEnter={() => preloadComponent(item.preload)}
                    onFocus={() => preloadComponent(item.preload)}
                    className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-accent/50 active:scale-[0.98] ${
                      active 
                        ? "text-primary" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {/* Animated active indicator */}
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full animate-scale-in" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <SyncQueueManager className="hidden sm:flex" />
            <ThemeToggle />
            <NotificationBell />

            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                    <Shield className="h-4 w-4" />
                    <span>Painel ADM</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Administração</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate("/admin?tab=users")}>
                    <UserCog className="mr-2 h-4 w-4" />
                    Gerenciar Usuários
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate("/admin?tab=products")}>
                    <Package className="mr-2 h-4 w-4" />
                    Gerenciar Produtos
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate("/admin?tab=posts")}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Moderar Posts
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate("/admin?tab=tickets")}>
                    <Ticket className="mr-2 h-4 w-4" />
                    Gerenciar Tickets
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate("/admin?tab=notifications")}>
                    <Bell className="mr-2 h-4 w-4" />
                    Enviar Notificações
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => navigate("/admin?tab=hotmart")}>
                    <Package className="mr-2 h-4 w-4" />
                    Integração Hotmart
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.foto_perfil_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {profile?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">Minha Conta</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - 5 items with FAB gap */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-xl safe-bottom overflow-x-hidden">
        <div className="flex items-center justify-around py-1 px-1">
          {mobileNavItems.map((item, index) => {
            // Center spacer for FAB
            if (item.spacer) {
              return <div key="fab-spacer" className="w-14 shrink-0" />;
            }
            const Icon = item.icon!;
            const active = isActive(item.path!);
            return (
              <Link
                key={item.path}
                to={item.path!}
                className={`relative flex flex-col items-center gap-0.5 px-1 py-1.5 min-h-[52px] min-w-0 flex-1 text-[10px] xs:text-xs font-medium transition-all duration-200 active:scale-95 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`relative p-1 xs:p-1.5 rounded-xl transition-all duration-200 ${
                  active ? "bg-primary/10" : ""
                }`}>
                  <Icon className={`h-4 w-4 xs:h-5 xs:w-5 transition-transform duration-200 ${active ? "scale-110" : ""}`} />
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-scale-in" />
                  )}
                </div>
                <span className={`truncate max-w-full transition-all duration-200 ${active ? "font-semibold" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Quick Record FAB */}
      <QuickRecordFAB />

      {/* Main Content with bottom padding for mobile nav and skip link target */}
      <main id="main-content" tabIndex={-1} className="flex-1 pb-20 md:pb-0 outline-none">{children}</main>

      {/* Offline Sync Banner */}
      <OfflineBanner />

      {/* Enhanced Footer */}
      <footer className="hidden md:block border-t border-border/50 bg-surface-2">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <Link to="/" className="inline-block">
                <span className="text-lg font-display font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Maternidade Consciente
                </span>
              </Link>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Sua jornada para uma maternidade consciente e econômica.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 text-primary" />
                <span>Feito com amor para mães</span>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-display font-semibold text-foreground mb-4">Recursos</h3>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.label}>
                    <Link 
                      to={link.path} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-display font-semibold text-foreground mb-4">Suporte</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link, i) => (
                  <li key={i}>
                    <Link 
                      to={link.path} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-display font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.label} className="flex items-center gap-2">
                    {link.label.includes("Privacidade") ? (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <FileText className="h-3 w-3 text-muted-foreground" />
                    )}
                    <Link 
                      to={link.path} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-10 pt-6 border-t border-border/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Maternidade Consciente. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  Versão 2.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
