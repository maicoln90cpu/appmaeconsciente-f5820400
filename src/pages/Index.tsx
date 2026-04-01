import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { Baby, Info, LogOut, Save, Shield, Star, Trophy, User } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Auth } from "@/components/Auth";
import { DashboardTab } from "@/components/DashboardTab";
import { EnxovalTable } from "@/components/EnxovalTable";
import { ExportEnxoval } from "@/components/ExportEnxoval";
import { ItemDialog } from "@/components/ItemDialog";
import { NotificationBell } from "@/components/NotificationBell";
import { RNGuideTable } from "@/components/RNGuideTable";
import { ShareEnxoval } from "@/components/ShareEnxoval";
import { SizeCalculator } from "@/components/SizeCalculator";

import { useConfig } from "@/hooks/useConfig";
import { useEnxovalItems } from "@/hooks/useEnxovalItems";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/useToast";
import { useUserRole } from "@/hooks/useUserRole";

import { supabase } from "@/integrations/supabase/client";

import type { EnxovalItem } from "@/types/enxoval";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<EnxovalItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [hasBreastfeeding, setHasBreastfeeding] = useState(false);
  const [hasClubAccess, setHasClubAccess] = useState(false);

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

  // Check breastfeeding and club access
  useEffect(() => {
    const checkBreastfeeding = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("baby_feeding_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("feeding_type", "breastfeeding")
        .limit(1)
        .maybeSingle();

      setHasBreastfeeding(!!data);

      // Check club access
      const { data: clubData } = await supabase
        .from("user_club_access")
        .select("has_active_access")
        .eq("user_id", user.id)
        .maybeSingle();

      setHasClubAccess(clubData?.has_active_access || false);
    };

    if (session) checkBreastfeeding();
  }, [session]);

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
        mensagem_motivacao: tempMensagemMotivacao,
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
              {hasClubAccess && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">
                  <Star className="h-3 w-3 mr-1" />
                  Membro Premium
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/conquistas")}
                className="gap-2"
              >
                <Trophy className="h-4 w-4 text-yellow-500" />
                Conquistas
              </Button>
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
            <TabsTrigger
              value="resumo"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="enxoval"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Itens do Enxoval
            </TabsTrigger>
            <TabsTrigger
              value="config"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-6">
            {config?.mensagem_motivacao && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                <p className="text-lg font-medium text-primary">{config.mensagem_motivacao}</p>
              </div>
            )}
            
            {profile?.meses_gestacao && profile.meses_gestacao >= 8 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  🎒 Sua gestação está em {profile.meses_gestacao} meses. Já conferiu o{" "}
                  <button
                    onClick={() => navigate("/materiais/mala-maternidade")}
                    className="font-semibold underline hover:text-primary"
                  >
                    Checklist de Mala da Maternidade
                  </button>
                  ? É importante estar preparada!
                </AlertDescription>
              </Alert>
            )}

            {hasBreastfeeding && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Você está amamentando! Não esqueça de adicionar absorventes de seio ao enxoval.</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      addItem({
                        item: "Absorventes de seio",
                        category: "Mãe",
                        necessity: "Necessário",
                        priority: "Alta",
                        status: "A comprar",
                        plannedQty: 3,
                        plannedPrice: 0,
                        boughtQty: 0,
                        unitPricePaid: 0,
                        frete: 0,
                        desconto: 0,
                        precoReferencia: 0,
                        subtotalPlanned: 0,
                        subtotalPaid: 0,
                        savings: 0,
                        savingsPercent: 0,
                      });
                    }}
                  >
                    Adicionar ao Enxoval
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <DashboardTab items={items} budget={config?.orcamento_total || 5000} />

            {items.length > 0 &&
              Math.round((items.filter((i) => i.status === "Comprado").length / items.length) * 100) === 100 && (
                <div className="bg-success/10 border border-success/30 rounded-lg p-6 text-center space-y-2">
                  <p className="text-2xl">🎉</p>
                  <p className="text-lg font-semibold text-success">
                    Parabéns! Você finalizou o enxoval com consciência, economia e leveza.
                  </p>
                  <p className="text-muted-foreground">
                    Seu bebê vai sentir o amor em cada escolha feita com calma. 💕
                  </p>
                </div>
              )}
          </TabsContent>

          <TabsContent value="enxoval" className="space-y-6">
            <div className="bg-muted/30 border rounded-lg p-4 text-center space-y-1">
              <p className="text-base text-muted-foreground">Aqui você registra suas decisões com consciência.</p>
              <p className="text-sm text-muted-foreground">
                Cada item marcado é um passo a menos na ansiedade — e um passo a mais na leveza.
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle>Itens do Enxoval</CardTitle>
                    <CardDescription>Gerencie todos os itens do seu enxoval</CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <SizeCalculator />
                    <ShareEnxoval />
                    <ExportEnxoval items={items} />
                    <ItemDialog onAdd={handleAddItem} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {itemsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Carregando itens...</p>
                  </div>
                ) : (
                  <EnxovalTable items={items} onEdit={handleEditClick} onDelete={handleDeleteItem} config={config} />
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
                Defina aqui o limite do seu enxoval. Este valor será seu farol — um lembrete gentil de que você está no
                controle do seu orçamento e da sua tranquilidade.
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
                  <p className="text-sm text-muted-foreground">Esta mensagem aparecerá no topo do seu Dashboard</p>
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
            Guia do Enxoval Consciente — Mãe Consciente
          </p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Mãe Consciente. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
