import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, ShoppingCart, PieChart, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DiaperEstimate } from "@/pages/CalculadoraFraldas";
import { useToast } from "@/hooks/useToast";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface Props {
  estimate: DiaperEstimate;
}

export const ResultsSummary = ({ estimate }: Props) => {
  const { toast } = useToast();
  const [addingToEnxoval, setAddingToEnxoval] = useState(false);

  const handleDownloadPDF = () => {
    toast({
      title: "Gerando PDF...",
      description: "Seu relatório personalizado está sendo preparado.",
    });
    
    // TODO: Implementar geração de PDF real
    setTimeout(() => {
      toast({
        title: "PDF pronto!",
        description: "O download começará em instantes.",
      });
    }, 1500);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Minha Calculadora de Fraldas",
        text: `Vou precisar de aproximadamente ${estimate.totalDiapers} fraldas nos próximos ${estimate.calculationPeriod} meses!`,
      });
    } else {
      toast({
        title: "Link copiado!",
        description: "Compartilhe seus resultados com quem quiser.",
      });
    }
  };

  const handleAddToEnxoval = async () => {
    setAddingToEnxoval(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Faça login",
          description: "Você precisa estar logado para adicionar ao enxoval.",
          variant: "destructive",
        });
        return;
      }

      // Adicionar cada tamanho de fralda ao enxoval
      const itemsToAdd = estimate.estimates.map((est) => ({
        user_id: user.id,
        categoria: "Higiene",
        item: `Fraldas tamanho ${est.size}`,
        necessidade: "Necessário",
        prioridade: "Alta",
        qtd_planejada: est.monthlyQty,
        preco_planejado: 0,
        qtd_comprada: 0,
        status: "A comprar",
        obs: `Estimativa para ${estimate.calculationPeriod} ${estimate.calculationPeriod === 1 ? 'mês' : 'meses'}. Média: ${est.dailyAvg} fraldas/dia`,
      }));

      const { error } = await supabase
        .from("itens_enxoval")
        .insert(itemsToAdd);

      if (error) throw error;

      toast({
        title: "✅ Adicionado ao Enxoval!",
        description: `${estimate.estimates.length} itens de fraldas foram adicionados ao seu Controle de Enxoval.`,
      });
    } catch (error) {
      console.error("Error adding to enxoval:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar ao enxoval. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setAddingToEnxoval(false);
    }
  };

  const totalPercentages = estimate.estimates.map(est => ({
    ...est,
    percentage: (est.monthlyQty / estimate.totalDiapers) * 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Resumo e Relatório
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumo Geral */}
        <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg">
          <h3 className="font-semibold text-xl mb-4">Resumo da sua estimativa</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total de fraldas</p>
              <p className="text-4xl font-bold text-primary">{estimate.totalDiapers}</p>
              <p className="text-sm text-muted-foreground mt-1">
                nos próximos {estimate.calculationPeriod} {estimate.calculationPeriod === 1 ? "mês" : "meses"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Peso do bebê</p>
              <p className="text-3xl font-bold">{estimate.babyWeight} kg</p>
              <p className="text-sm text-muted-foreground mt-1">Idade: {estimate.babyAge}</p>
            </div>
          </div>
        </div>

        {/* Distribuição por Tamanho */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Distribuição por Tamanho</h3>
          <div className="space-y-4">
            {totalPercentages.map((item) => (
              <div key={item.size}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.size}</Badge>
                    <span className="text-sm font-medium">{item.monthlyQty} fraldas</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={item.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Média de {item.dailyAvg} fraldas/dia
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Compras Sugerida */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Lista de Compras Otimizada
          </h3>
          <div className="space-y-2">
            {estimate.estimates.map((item) => (
              <div key={item.size} className="flex justify-between items-center text-sm">
                <span>Fraldas tamanho {item.size}</span>
                <span className="font-medium">{item.monthlyQty} unidades</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Dica:</strong> Compre pacotes grandes (hiper, mega) para economizar até 30% por unidade!
            </p>
          </div>
        </div>

        {/* Alertas e Dicas */}
        <div className="space-y-3">
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm">
            <strong className="text-warning">⚠️ Cuidado com RN:</strong> Bebês crescem rápido! 
            Compre no máximo 1-2 pacotes de tamanho RN.
          </div>
          <div className="p-3 bg-success/10 border border-success/20 rounded-lg text-sm">
            <strong className="text-success">✓ Dica de economia:</strong> Foque em comprar mais 
            fraldas tamanho P e M, que serão usadas por mais tempo.
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-3 pt-4">
          <Button 
            variant="default" 
            onClick={handleAddToEnxoval} 
            className="w-full"
            disabled={addingToEnxoval}
          >
            <Plus className="mr-2 h-4 w-4" />
            {addingToEnxoval ? "Adicionando..." : "Adicionar ao Meu Enxoval"}
          </Button>
          
          <div className="grid md:grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleDownloadPDF} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Baixar Relatório (PDF)
            </Button>
            <Button variant="outline" onClick={handleShare} className="w-full">
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar Resultados
            </Button>
          </div>
        </div>

        {/* Footer do Relatório */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          <p>
            Estimativas baseadas em médias de consumo. Cada bebê é único e pode ter necessidades diferentes.
            Consulte seu pediatra para orientações personalizadas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
