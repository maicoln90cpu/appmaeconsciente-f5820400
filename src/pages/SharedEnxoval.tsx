import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { EnxovalItem, Config } from "@/types/enxoval";
import { EnxovalTable } from "@/components/EnxovalTable";
import { DashboardTab } from "@/components/DashboardTab";
import { Baby } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SharedEnxoval() {
  const { token } = useParams();
  const [items, setItems] = useState<EnxovalItem[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadSharedData = async () => {
      try {
        // Verificar se o link é válido
        const { data: linkData, error: linkError } = await supabase
          .from("shared_enxoval_links")
          .select("user_id, expires_at, is_active")
          .eq("token", token)
          .single();

        if (linkError || !linkData) {
          setError("Link inválido ou expirado.");
          return;
        }

        if (!linkData.is_active) {
          setError("Este link foi revogado.");
          return;
        }

        if (new Date(linkData.expires_at) < new Date()) {
          setError("Este link expirou.");
          return;
        }

        // Incrementar contador de visualizações
        const { data: currentLink } = await supabase
          .from("shared_enxoval_links")
          .select("views_count")
          .eq("token", token)
          .single();
        
        if (currentLink) {
          await supabase
            .from("shared_enxoval_links")
            .update({ views_count: currentLink.views_count + 1 })
            .eq("token", token);
        }

        // Carregar itens do usuário
        const { data: itemsData } = await supabase
          .from("itens_enxoval")
          .select("*")
          .eq("user_id", linkData.user_id)
          .order("created_at", { ascending: false });

        // Carregar config
        const { data: configData } = await supabase
          .from("config")
          .select("*")
          .eq("user_id", linkData.user_id)
          .single();

        if (itemsData) {
          // Processar itens
          const processedItems = itemsData.map((item: any) => ({
            id: item.id,
            date: item.data,
            category: item.categoria,
            item: item.item,
            necessity: item.necessidade,
            priority: item.prioridade,
            size: item.tamanho,
            plannedQty: item.qtd_planejada,
            plannedPrice: item.preco_planejado,
            boughtQty: item.qtd_comprada,
            unitPricePaid: item.preco_unit_pago,
            frete: item.frete,
            desconto: item.desconto,
            precoReferencia: item.preco_referencia,
            subtotalPlanned: item.qtd_planejada * item.preco_planejado,
            subtotalPaid: item.qtd_comprada * (item.preco_unit_pago + item.frete - item.desconto),
            savings: (item.qtd_planejada * item.preco_planejado) - (item.qtd_comprada * (item.preco_unit_pago + item.frete - item.desconto)),
            savingsPercent: 0,
            store: item.loja,
            link: item.link,
            status: item.status,
            origin: item.origem,
            dataLimiteTroca: item.data_limite_troca,
            notes: item.obs,
            etapaMaes: item.etapa_maes,
            classificacao: item.classificacao,
            emocao: item.emocao,
          }));
          setItems(processedItems);
        }

        if (configData) {
          setConfig({
            id: configData.id,
            orcamento_total: configData.orcamento_total,
            dias_alerta_troca: configData.dias_alerta_troca,
            limites_rn: [],
            mensagem_motivacao: configData.mensagem_motivacao,
          });
        }
      } catch (error: any) {
        console.error("Erro ao carregar dados compartilhados:", error);
        setError("Erro ao carregar os dados.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadSharedData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Baby className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Baby className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Enxoval Compartilhado</h1>
              <p className="text-sm text-muted-foreground">Visualização pública</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <DashboardTab items={items} budget={config?.orcamento_total || 5000} />

        <Card>
          <CardHeader>
            <CardTitle>Itens do Enxoval</CardTitle>
          </CardHeader>
          <CardContent>
            <EnxovalTable
              items={items}
              onEdit={() => {}}
              onDelete={() => {}}
              config={config}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}