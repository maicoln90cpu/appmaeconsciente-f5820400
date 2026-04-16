import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, ShoppingCart, PieChart, Plus, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DiaperEstimate } from '@/pages/CalculadoraFraldas';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { usePDFExport } from '@/hooks/usePDFExport';
import { toast } from 'sonner';

interface Props {
  estimate: DiaperEstimate;
}

const getSavingsTips = (estimate: DiaperEstimate): string[] => {
  const tips: string[] = [];
  const sizes = estimate.estimates.map(e => e.size);

  if (sizes.includes('RN')) {
    tips.push('⚠️ Compre no máximo 2 pacotes de RN — bebês crescem muito rápido nessa fase!');
  }

  const biggestSize = estimate.estimates.reduce((a, b) => (a.monthlyQty > b.monthlyQty ? a : b));
  tips.push(
    `📦 Foque em estocar tamanho ${biggestSize.size} — é o que você mais vai usar (${biggestSize.monthlyQty} unidades).`
  );

  if (estimate.totalDiapers > 300) {
    tips.push('💰 Compre pacotes hiper/mega em promoção — economia de até 30% por fralda!');
  }

  if (estimate.calculationPeriod >= 6) {
    tips.push(
      '🛒 Assine clubes de fraldas (ex: Amazon, drogarias) para descontos recorrentes de 10-15%.'
    );
  }

  tips.push(
    '🌿 Considere usar fraldas de pano durante o dia — pode economizar até 40% no longo prazo.'
  );

  if (estimate.totalDiapers > 500) {
    tips.push(
      '🎁 Peça fraldas de diferentes tamanhos no chá de bebê — evite acumular só um tamanho.'
    );
  }

  return tips;
};

export const ResultsSummary = ({ estimate }: Props) => {
  const { generatePDF } = usePDFExport();
  const [addingToEnxoval, setAddingToEnxoval] = useState(false);

  const savingsTips = getSavingsTips(estimate);

  const handleDownloadPDF = async () => {
    await generatePDF({
      title: 'Relatório de Fraldas',
      subtitle: `Estimativa para ${estimate.calculationPeriod} ${estimate.calculationPeriod === 1 ? 'mês' : 'meses'}`,
      filename: 'relatorio-fraldas',
      sections: [
        {
          title: 'Dados do Bebê',
          type: 'text',
          content: [
            `Idade: ${estimate.babyAge}`,
            `Peso: ${estimate.babyWeight} kg`,
            `Período calculado: ${estimate.calculationPeriod} ${estimate.calculationPeriod === 1 ? 'mês' : 'meses'}`,
            `Total estimado: ${estimate.totalDiapers} fraldas`,
          ],
        },
        {
          title: 'Distribuição por Tamanho',
          type: 'table',
          tableHead: ['Tamanho', 'Quantidade', 'Média/dia', '% do Total'],
          tableBody: estimate.estimates.map(est => [
            est.size,
            String(est.monthlyQty),
            String(est.dailyAvg),
            `${((est.monthlyQty / estimate.totalDiapers) * 100).toFixed(1)}%`,
          ]),
          tableColor: [147, 51, 234],
        },
        {
          title: 'Dicas de Economia',
          type: 'text',
          content: savingsTips.map(tip => tip.replace(/^[^\s]+ /, '')),
        },
      ],
      footer: 'Mãe Consciente — Calculadora de Fraldas',
    });
  };

  const handleShare = () => {
    const text = `🍼 Calculadora de Fraldas — Mãe Consciente\n\nVou precisar de aproximadamente ${estimate.totalDiapers} fraldas nos próximos ${estimate.calculationPeriod} meses!\n\nDistribuição:\n${estimate.estimates.map(e => `• ${e.size}: ${e.monthlyQty} unidades`).join('\n')}`;

    if (navigator.share) {
      navigator.share({ title: 'Minha Calculadora de Fraldas', text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Texto copiado para a área de transferência!');
    }
  };

  const handleAddToEnxoval = async () => {
    setAddingToEnxoval(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar logado para adicionar ao enxoval.');
        return;
      }

      const itemsToAdd = estimate.estimates.map(est => ({
        user_id: user.id,
        categoria: 'Higiene',
        item: `Fraldas tamanho ${est.size}`,
        necessidade: 'Necessário',
        prioridade: 'Alta',
        qtd_planejada: est.monthlyQty,
        preco_planejado: 0,
        qtd_comprada: 0,
        status: 'A comprar',
        obs: `Estimativa para ${estimate.calculationPeriod} ${estimate.calculationPeriod === 1 ? 'mês' : 'meses'}. Média: ${est.dailyAvg} fraldas/dia`,
      }));

      const { error } = await supabase.from('itens_enxoval').insert(itemsToAdd);
      if (error) throw error;

      toast.success(`${estimate.estimates.length} itens de fraldas adicionados ao enxoval!`);
    } catch (error) {
      console.error('Error adding to enxoval:', error);
      toast.error('Não foi possível adicionar ao enxoval. Tente novamente.');
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
                nos próximos {estimate.calculationPeriod}{' '}
                {estimate.calculationPeriod === 1 ? 'mês' : 'meses'}
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
            {totalPercentages.map(item => (
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

        {/* Dicas de Economia Contextuais */}
        <div className="p-4 border border-accent/30 rounded-lg bg-accent/5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent-foreground" />
            Dicas de Economia Personalizadas
          </h3>
          <div className="space-y-2">
            {savingsTips.map((tip, i) => (
              <p key={i} className="text-sm leading-relaxed">
                {tip}
              </p>
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
            {estimate.estimates.map(item => (
              <div key={item.size} className="flex justify-between items-center text-sm">
                <span>Fraldas tamanho {item.size}</span>
                <span className="font-medium">{item.monthlyQty} unidades</span>
              </div>
            ))}
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
            {addingToEnxoval ? 'Adicionando...' : 'Adicionar ao Meu Enxoval'}
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

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          <p>
            Estimativas baseadas em médias de consumo. Cada bebê é único e pode ter necessidades
            diferentes. Consulte seu pediatra para orientações personalizadas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
