import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  Users, 
  BookOpen, 
  HeadphonesIcon, 
  Settings, 
  LogOut, 
  Shield, 
  LayoutDashboard,
  UserCog,
  Package,
  MessageSquare,
  Ticket,
  Bell
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    { path: "/comunidade", label: "Comunidade", icon: Users },
    { path: "/materiais", label: "Materiais", icon: BookOpen },
    { path: "/suporte", label: "Suporte", icon: HeadphonesIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/materiais" className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Maternidade Consciente
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                      isActive(item.path) ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationBell />

            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Painel ADM</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Administração</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
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
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.foto_perfil_url || undefined} />
                    <AvatarFallback>
                      {profile?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden border-t">
          <div className="container flex items-center justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors ${
                    isActive(item.path) ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t py-6 bg-muted/30">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Maternidade Consciente. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <Link to="/suporte" className="text-sm text-muted-foreground hover:text-foreground">
                Suporte
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
