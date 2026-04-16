import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DevelopmentSummary } from '@/types/development';
import { AREA_LABELS, AREA_ICONS } from '@/types/development';
import { AlertCircle, TrendingUp, Baby } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardDesenvolvimentoProps {
  summary: DevelopmentSummary;
}

export const DashboardDesenvolvimento = ({ summary }: DashboardDesenvolvimentoProps) => {
  const areas = [
    { key: 'motor_grosso', label: AREA_LABELS.motor_grosso, icon: AREA_ICONS.motor_grosso },
    { key: 'motor_fino', label: AREA_LABELS.motor_fino, icon: AREA_ICONS.motor_fino },
    { key: 'linguagem', label: AREA_LABELS.linguagem, icon: AREA_ICONS.linguagem },
    { key: 'cognitivo', label: AREA_LABELS.cognitivo, icon: AREA_ICONS.cognitivo },
    {
      key: 'social_emocional',
      label: AREA_LABELS.social_emocional,
      icon: AREA_ICONS.social_emocional,
    },
  ] as const;

  const calculatePercentage = (achieved: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((achieved / total) * 100);
  };

  const getMessage = () => {
    const totalExpected = areas.reduce(
      (sum, area) => sum + (summary[`${area.key}_total` as keyof DevelopmentSummary] as number),
      0
    );
    const totalAchieved = areas.reduce(
      (sum, area) => sum + (summary[`${area.key}_achieved` as keyof DevelopmentSummary] as number),
      0
    );
    const percentage = totalExpected > 0 ? (totalAchieved / totalExpected) * 100 : 0;

    if (percentage >= 90)
      return 'Seu bebê está acompanhando lindamente todos os marcos esperados! 🌟';
    if (percentage >= 70)
      return 'Ótimo progresso! Continue estimulando e acompanhando com carinho 💕';
    if (percentage >= 50)
      return 'Seu bebê está evoluindo bem. Cada conquista no tempo dele é especial 🌱';
    return 'Lembre-se: cada bebê tem seu próprio ritmo. O importante é observar com amor 💚';
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5" />
                {summary.baby_name} - {summary.age_months} meses
              </CardTitle>
              <CardDescription className="mt-2 text-base">{getMessage()}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Attention Alert */}
      {summary.attention_count > 0 && (
        <Alert variant="default" className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            {summary.attention_count} marco{summary.attention_count > 1 ? 's' : ''} para observar
            com mais atenção. Vale comentar com o pediatra na próxima consulta. Isso não significa
            que algo está errado, mas é uma informação importante.
          </AlertDescription>
        </Alert>
      )}

      {/* Areas Progress */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {areas.map(area => {
          const total = summary[`${area.key}_total` as keyof DevelopmentSummary] as number;
          const achieved = summary[`${area.key}_achieved` as keyof DevelopmentSummary] as number;
          const percentage = calculatePercentage(achieved, total);

          return (
            <Card key={area.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{area.icon}</span>
                    {area.label}
                  </span>
                  <Badge variant="secondary">
                    {achieved}/{total}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {percentage}% dos marcos esperados
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Last Milestone */}
      {summary.last_milestone_date && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Última conquista registrada</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(summary.last_milestone_date), "dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Alert>
        <AlertDescription className="text-xs text-muted-foreground">
          <strong>Importante:</strong> Este monitor é apenas uma ferramenta de acompanhamento. Não
          substitui consultas médicas. Cada bebê se desenvolve em seu próprio ritmo, e isso é
          perfeitamente normal. Em caso de dúvidas, sempre converse com o pediatra.
        </AlertDescription>
      </Alert>
    </div>
  );
};
