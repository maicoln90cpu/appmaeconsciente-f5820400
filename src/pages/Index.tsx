import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ItemDialog } from "@/components/ItemDialog";
import { EnxovalTable } from "@/components/EnxovalTable";
import { DashboardTab } from "@/components/DashboardTab";
import { RNGuideTable } from "@/components/RNGuideTable";
import { Auth } from "@/components/Auth";
import { NotificationBell } from "@/components/NotificationBell";
import { EnxovalItem } from "@/types/enxoval";
import { Baby, LogOut, Save, Shield, User } from "lucide-react";
import { useConfig } from "@/hooks/useConfig";
import { useEnxovalItems } from "@/hooks/useEnxovalItems";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<EnxovalItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // State local para configurações
  const [tempOrcamento, setTempOrcamento] = useState<number>(5000);
  const [tempDiasAlerta, setTempDiasAlerta] = useState<number>(7);
  const [tempMensagemMotivacao, setTempMensagemMotivacao] = useState<string>("");
  
  const { toast } = useToast();
  const { profile, loading: profileLoading } = useProfile();
  const { isAdmin } = useUserRole();

  const { config, loading: configLoading, updateConfig } = useConfig();
  const { items, loading: itemsLoading, addItem, updateItem, deleteItem } = useEnxovalItems(config);

  // Sincronizar state local com config carregado
  useEffect(() => {
    if (config) {
      setTempOrcamento(config.orcamento_total);
      setTempDiasAlerta(config.dias_alerta_troca);
      setTempMensagemMotivacao(config.mensagem_motivacao || "");
    }
  }, [config]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect to profile completion if needed
  useEffect(() => {
    if (session && profile && !profile.perfil_completo && !profileLoading) {
      navigate("/complete-profile");
    }
  }, [session, profile, profileLoading, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta com sucesso.",
    });
  };

  const handleAddItem = async (item: Omit<EnxovalItem, "id">) => {
    await addItem(item);
  };

  const handleEditItem = async (item: EnxovalItem) => {
    await updateItem(item);
    setEditingItem(null);
    setEditDialogOpen(false);
  };

  const handleDeleteItem = async (id: string) => {
    await deleteItem(id);
  };

  const handleEditClick = (item: EnxovalItem) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const handleSaveConfig = async () => {
    if (config) {
      await updateConfig({ 
        ...config, 
        orcamento_total: tempOrcamento,
        dias_alerta_troca: tempDiasAlerta,
        mensagem_motivacao: tempMensagemMotivacao 
      });
    }
  };

  if (loading || configLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Baby className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Baby className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Controle de Enxoval</h1>
                <p className="text-sm text-muted-foreground">Organize suas compras com economia e praticidade</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")} className="gap-2">
                <User className="h-4 w-4" />
                Meu Cadastro
              </Button>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate("/admin")} className="gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="resumo" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 h-auto p-1">
            <TabsTrigger value="resumo" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="enxoval" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Itens do Enxoval
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-6">
            {config?.mensagem_motivacao && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                <p className="text-lg font-medium text-primary">{config.mensagem_motivacao}</p>
              </div>
            )}
            <DashboardTab items={items} budget={config?.orcamento_total || 5000} />
            
            {items.length > 0 && Math.round((items.filter(i => i.status === "Comprado").length / items.length) * 100) === 100 && (
              <div className="bg-success/10 border border-success/30 rounded-lg p-6 text-center space-y-2">
                <p className="text-2xl">🎉</p>
                <p className="text-lg font-semibold text-success">Parabéns! Você finalizou o enxoval com consciência, economia e leveza.</p>
                <p className="text-muted-foreground">Seu bebê vai sentir o amor em cada escolha feita com calma. 💕</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="enxoval" className="space-y-6">
            <div className="bg-muted/30 border rounded-lg p-4 text-center space-y-1">
              <p className="text-base text-muted-foreground">
                Aqui você registra suas decisões com consciência.
              </p>
              <p className="text-sm text-muted-foreground">
                Cada item marcado é um passo a menos na ansiedade — e um passo a mais na leveza.
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Itens do Enxoval</CardTitle>
                    <CardDescription>Gerencie todos os itens do seu enxoval</CardDescription>
                  </div>
                  <ItemDialog onAdd={handleAddItem} />
                </div>
              </CardHeader>
              <CardContent>
                {itemsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Carregando itens...</p>
                  </div>
                ) : (
                  <EnxovalTable 
                    items={items} 
                    onEdit={handleEditClick}
                    onDelete={handleDeleteItem}
                    config={config}
                  />
                )}
              </CardContent>
            </Card>
            <ItemDialog
              onEdit={handleEditItem}
              editingItem={editingItem}
              open={editDialogOpen}
              onOpenChange={(open) => {
                setEditDialogOpen(open);
                if (!open) setEditingItem(null);
              }}
            />
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <div className="bg-muted/30 border rounded-lg p-4 text-center">
              <p className="text-base text-muted-foreground">
                Defina aqui o limite do seu enxoval. Este valor será seu farol — um lembrete gentil de que você está no controle do seu orçamento e da sua tranquilidade.
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>Defina o orçamento e alertas do seu enxoval</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="budget">Orçamento Total (R$)</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={tempOrcamento}
                    onChange={(e) => setTempOrcamento(Number(e.target.value))}
                    className="max-w-xs"
                  />
                  <p className="text-sm text-muted-foreground">
                    Define o valor máximo que você planeja gastar no enxoval completo
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diasAlerta">Dias para Alerta de Troca</Label>
                  <Input
                    id="diasAlerta"
                    type="number"
                    min="1"
                    value={tempDiasAlerta}
                    onChange={(e) => setTempDiasAlerta(Number(e.target.value))}
                    className="max-w-xs"
                  />
                  <p className="text-sm text-muted-foreground">
                    Número de dias antes da data limite de troca para mostrar alerta
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mensagemMotivacao">Mensagem Pessoal de Motivação</Label>
                  <Input
                    id="mensagemMotivacao"
                    type="text"
                    maxLength={100}
                    placeholder="Ex: Quero viver esta fase com leveza e consciência."
                    value={tempMensagemMotivacao}
                    onChange={(e) => setTempMensagemMotivacao(e.target.value)}
                    className="max-w-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Esta mensagem aparecerá no topo do seu Dashboard
                  </p>
                </div>

                <Button onClick={handleSaveConfig} className="gap-2">
                  <Save className="h-4 w-4" />
                  Guardar e continuar com clareza 💕
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guia de Quantidades RN — Comece com o Essencial</CardTitle>
                <CardDescription>Lembre-se: menos é mais. Você pode ajustar conforme o bebê cresce.</CardDescription>
              </CardHeader>
              <CardContent>
                <RNGuideTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Rodapé do Sistema */}
      <footer className="border-t bg-muted/30 py-6 mt-12">
        <div className="container mx-auto px-4 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            Guia do Enxoval Inteligente — Aplicação do Método M.A.E.S.
          </p>
          <p className="text-xs text-muted-foreground">
            © 2025 Isabela Santos | Maternidade Real e Consciente.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
