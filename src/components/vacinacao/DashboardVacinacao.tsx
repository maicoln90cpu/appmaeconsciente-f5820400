import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { differenceInMonths } from "date-fns";
import type { BabyVaccinationProfile, VaccinationCalendar, BabyVaccination } from "@/types/vaccination";

interface DashboardVacinacaoProps {
  profile: BabyVaccinationProfile;
  calendar: VaccinationCalendar[];
  vaccinations: BabyVaccination[];
}

export const DashboardVacinacao = ({ profile, calendar, vaccinations }: DashboardVacinacaoProps) => {
  const stats = useMemo(() => {
    const babyAgeMonths = differenceInMonths(new Date(), new Date(profile.birth_date));
    
    // Vacinas esperadas para a idade do bebê
    const expectedVaccines = calendar.filter(v => v.age_months <= babyAgeMonths);
    const totalExpected = expectedVaccines.length;
    
    // Vacinas aplicadas
    const totalApplied = vaccinations.length;
    
    // Calcular percentual
    const percentage = totalExpected > 0 ? Math.round((totalApplied / totalExpected) * 100) : 0;
    
    // Vacinas atrasadas (esperadas mas não aplicadas)
    const now = new Date();
    const overdueCount = expectedVaccines.filter(expected => {
      const hasVaccine = vaccinations.some(v => 
        v.vaccine_name === expected.vaccine_name && 
        v.dose_label === expected.dose_label
      );
      return !hasVaccine;
    }).length;

    // Próximas doses
    const upcomingVaccines = calendar.filter(v => v.age_months > babyAgeMonths && v.age_months <= babyAgeMonths + 1);

    return {
      totalExpected,
      totalApplied,
      percentage,
      overdueCount,
      upcomingCount: upcomingVaccines.length,
      babyAgeMonths,
    };
  }, [profile, calendar, vaccinations]);

  const getMessage = () => {
    if (stats.percentage === 100) {
      return "👏 Parabéns, todas as vacinas estão atualizadas!";
    }
    if (stats.percentage >= 80) {
      return "💪 Falta pouco — continue assim!";
    }
    if (stats.percentage >= 50) {
      return "📝 Você está no caminho certo!";
    }
    return "⚠️ Algumas vacinas precisam de atenção.";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>📊 Progresso de Vacinação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Vacinas aplicadas</span>
              <span className="text-sm font-medium">{stats.totalApplied} de {stats.totalExpected}</span>
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
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalApplied}</p>
                <p className="text-xs text-muted-foreground">Aplicadas</p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.upcomingCount}</p>
                <p className="text-xs text-muted-foreground">Próximas</p>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdueCount}</p>
                <p className="text-xs text-muted-foreground">Atrasadas</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.babyAgeMonths}</p>
                <p className="text-xs text-muted-foreground">Meses de vida</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
