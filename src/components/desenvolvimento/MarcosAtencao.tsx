import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, CheckCircle2, MessageSquare, FileText } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


import {
  BabyMilestoneRecord,
  DevelopmentMilestoneType,
  AREA_LABELS,
  AREA_ICONS,
} from '@/types/development';


interface MarcosAtencaoProps {
  attentionRecords: (BabyMilestoneRecord & { milestone?: DevelopmentMilestoneType })[];
  babyAgeMonths: number;
  onMarkAsAchieved: (milestoneTypeId: string) => void;
  onMarkAsDoubt: (recordId: string) => void;
  onGenerateReport: () => void;
}

export const MarcosAtencao = ({
  attentionRecords,
  babyAgeMonths,
  onMarkAsAchieved,
  onMarkAsDoubt,
  onGenerateReport,
}: MarcosAtencaoProps) => {
  if (attentionRecords.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="h-5 w-5" />
            Tudo em dia! 🎉
          </CardTitle>
          <CardDescription className="text-green-700">
            Não há marcos que precisam de atenção especial neste momento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">
            Continue observando e registrando as conquistas do seu bebê. Você está fazendo um ótimo
            trabalho! 💕
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by area
  const byArea = attentionRecords.reduce(
    (acc, record) => {
      if (!record.milestone) return acc;
      const area = record.milestone.area;
      if (!acc[area]) acc[area] = [];
      acc[area].push(record);
      return acc;
    },
    {} as Record<string, typeof attentionRecords>
  );

  return (
    <div className="space-y-6">
      <Alert className="border-amber-200 bg-amber-50/50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Marcos para observar com mais atenção</AlertTitle>
        <AlertDescription className="text-amber-700">
          Estes marcos passaram da faixa de idade típica. Isso{' '}
          <strong>não significa que há algo errado</strong>, mas é uma boa ideia conversar com o
          pediatra na próxima consulta para avaliar juntos.
        </AlertDescription>
      </Alert>

      {Object.entries(byArea).map(([area, records]) => (
        <Card key={area}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{AREA_ICONS[area as keyof typeof AREA_ICONS]}</span>
              {AREA_LABELS[area as keyof typeof AREA_LABELS]}
              <Badge variant="outline" className="ml-auto">
                {records.length} {records.length === 1 ? 'marco' : 'marcos'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {records.map(record => {
              if (!record.milestone) return null;

              const monthsOverdue = babyAgeMonths - record.milestone.age_max_months;

              return (
                <div
                  key={record.id || record.milestone_type_id}
                  className="border rounded-lg p-4 space-y-3 bg-card"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{record.milestone.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {record.milestone.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Faixa típica: {record.milestone.age_min_months}-
                          {record.milestone.age_max_months} meses
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {monthsOverdue} {monthsOverdue === 1 ? 'mês' : 'meses'} além da faixa
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {record.milestone.pediatrician_alert && (
                    <Alert className="bg-blue-50/50 border-blue-200">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-sm text-blue-800">
                        Conversa com o pediatra
                      </AlertTitle>
                      <AlertDescription className="text-sm text-blue-700">
                        {record.milestone.pediatrician_alert}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onMarkAsAchieved(record.milestone_type_id)}
                      className="flex-1"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Meu bebê já faz isso
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => record.id && onMarkAsDoubt(record.id)}
                      className="flex-1"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Tenho dúvidas
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">📄 Relatório para o pediatra</CardTitle>
          <CardDescription>
            Prepare um relatório completo para levar na próxima consulta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onGenerateReport} className="w-full gap-2">
            <FileText className="h-4 w-4" />
            Gerar Relatório em PDF
          </Button>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Lembre-se</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            <strong>Cada bebê se desenvolve no seu próprio ritmo.</strong> Variações são
            absolutamente normais.
          </p>
          <p>
            Este monitor é uma ferramenta de acompanhamento, não de diagnóstico. O pediatra é quem
            pode avaliar de forma completa o desenvolvimento do seu bebê.
          </p>
          <p className="text-sm italic">"Observe com amor, não com ansiedade" 💕</p>
        </AlertDescription>
      </Alert>
    </div>
  );
};
