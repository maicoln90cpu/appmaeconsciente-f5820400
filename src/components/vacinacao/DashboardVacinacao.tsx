import { useMemo } from 'react';

import { differenceInMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, Syringe, CalendarClock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';


import { usePDFExport } from '@/hooks/usePDFExport';

import type {
  BabyVaccinationProfile,
  VaccinationCalendar,
  BabyVaccination,
} from '@/types/vaccination';

interface DashboardVacinacaoProps {
  profile: BabyVaccinationProfile;
  calendar: VaccinationCalendar[];
  vaccinations: BabyVaccination[];
}

export const DashboardVacinacao = ({
  profile,
  calendar,
  vaccinations,
}: DashboardVacinacaoProps) => {
  const { generatePDF } = usePDFExport();

  const stats = useMemo(() => {
    const babyAgeMonths = differenceInMonths(new Date(), new Date(profile.birth_date));

    const expectedVaccines = calendar.filter(v => v.age_months <= babyAgeMonths);
    const totalExpected = expectedVaccines.length;
    const totalApplied = vaccinations.length;
    const percentage = totalExpected > 0 ? Math.round((totalApplied / totalExpected) * 100) : 0;

    const overdueVaccines = expectedVaccines.filter(expected => {
      return !vaccinations.some(
        v => v.vaccine_name === expected.vaccine_name && v.dose_label === expected.dose_label
      );
    });

    const upcomingVaccines = calendar.filter(
      v => v.age_months > babyAgeMonths && v.age_months <= babyAgeMonths + 3
    );

    // Próxima vacina pendente (atrasada ou futura)
    const nextVaccine =
      overdueVaccines.length > 0
        ? overdueVaccines[0]
        : upcomingVaccines.length > 0
          ? upcomingVaccines[0]
          : null;

    const nextVaccineIsOverdue = overdueVaccines.length > 0;

    return {
      totalExpected,
      totalApplied,
      percentage,
      overdueCount: overdueVaccines.length,
      overdueVaccines,
      upcomingCount: upcomingVaccines.length,
      babyAgeMonths,
      nextVaccine,
      nextVaccineIsOverdue,
    };
  }, [profile, calendar, vaccinations]);

  const getMessage = () => {
    if (stats.percentage === 100) return '👏 Parabéns, todas as vacinas estão atualizadas!';
    if (stats.percentage >= 80) return '💪 Falta pouco — continue assim!';
    if (stats.percentage >= 50) return '📝 Você está no caminho certo!';
    return '⚠️ Algumas vacinas precisam de atenção.';
  };

  const handleExportPDF = async () => {
    const appliedRows = vaccinations.map(v => [
      v.vaccine_name,
      v.dose_label || '—',
      format(new Date(v.application_date), 'dd/MM/yyyy', { locale: ptBR }),
      v.batch_number || '—',
      v.health_professional || '—',
    ]);

    const pendingRows = stats.overdueVaccines.map(v => [
      v.vaccine_name,
      v.dose_label || '—',
      `${v.age_months} meses`,
      'Pendente',
    ]);

    await generatePDF({
      title: `Cartão de Vacinação — ${profile.nickname || profile.baby_name}`,
      subtitle: `Nascimento: ${format(new Date(profile.birth_date), 'dd/MM/yyyy', { locale: ptBR })} • ${stats.babyAgeMonths} meses`,
      filename: `cartao-vacinacao-${profile.baby_name.toLowerCase().replace(/\s/g, '-')}`,
      sections: [
        {
          title: 'Resumo',
          type: 'text',
          content: [
            `Vacinas aplicadas: ${stats.totalApplied} de ${stats.totalExpected}`,
            `Progresso: ${stats.percentage}%`,
            `Vacinas atrasadas: ${stats.overdueCount}`,
          ],
        },
        ...(appliedRows.length > 0
          ? [
              {
                title: 'Vacinas Aplicadas',
                type: 'table' as const,
                tableHead: ['Vacina', 'Dose', 'Data', 'Lote', 'Profissional'],
                tableBody: appliedRows,
                tableColor: [34, 197, 94] as [number, number, number],
              },
            ]
          : []),
        ...(pendingRows.length > 0
          ? [
              {
                title: 'Vacinas Pendentes',
                type: 'table' as const,
                tableHead: ['Vacina', 'Dose', 'Idade recomendada', 'Status'],
                tableBody: pendingRows,
                tableColor: [239, 68, 68] as [number, number, number],
              },
            ]
          : []),
      ],
      footer: 'Mãe Consciente — Cartão de Vacinação Digital',
    });
  };

  return (
    <div className="space-y-4">
      {/* Card Próxima Vacina em destaque */}
      {stats.nextVaccine && (
        <Card
          className={`border-2 ${stats.nextVaccineIsOverdue ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/30' : 'border-primary/40 bg-primary/5'}`}
        >
          <CardContent className="py-5">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-full shrink-0 ${stats.nextVaccineIsOverdue ? 'bg-red-100 dark:bg-red-900' : 'bg-primary/10'}`}
              >
                <Syringe
                  className={`h-6 w-6 ${stats.nextVaccineIsOverdue ? 'text-red-600 dark:text-red-400' : 'text-primary'}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {stats.nextVaccineIsOverdue ? '⚠️ Vacina atrasada' : 'Próxima vacina'}
                  </p>
                  {stats.nextVaccineIsOverdue && (
                    <Badge variant="destructive" className="text-[10px]">
                      Atrasada
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-bold">{stats.nextVaccine.vaccine_name}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  {stats.nextVaccine.dose_label && <span>{stats.nextVaccine.dose_label}</span>}
                  <span className="flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Recomendada aos {stats.nextVaccine.age_months} meses
                  </span>
                </div>
                {stats.nextVaccine.purpose && (
                  <p className="text-xs text-muted-foreground mt-2">{stats.nextVaccine.purpose}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>📊 Progresso de Vacinação</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Vacinas aplicadas</span>
              <span className="text-sm font-medium">
                {stats.totalApplied} de {stats.totalExpected}
              </span>
            </div>
            <Progress value={stats.percentage} className="h-3" />
            <p className="text-center mt-2 text-lg font-semibold text-primary">
              {stats.percentage}% completo
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-base font-medium">{getMessage()}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.totalApplied}
                </p>
                <p className="text-xs text-muted-foreground">Aplicadas</p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.upcomingCount}
                </p>
                <p className="text-xs text-muted-foreground">Próximas</p>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.overdueCount}
                </p>
                <p className="text-xs text-muted-foreground">Atrasadas</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.babyAgeMonths}
                </p>
                <p className="text-xs text-muted-foreground">Meses de vida</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
