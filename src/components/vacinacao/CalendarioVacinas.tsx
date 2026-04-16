import { useMemo } from 'react';

import { differenceInMonths } from 'date-fns';
import { Info, Check, Clock, AlertCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import type {
  BabyVaccinationProfile,
  VaccinationCalendar,
  BabyVaccination,
} from '@/types/vaccination';

interface CalendarioVacinasProps {
  profile: BabyVaccinationProfile;
  calendar: VaccinationCalendar[];
  vaccinations: BabyVaccination[];
  onRegisterClick: (vaccine: VaccinationCalendar) => void;
}

export const CalendarioVacinas = ({
  profile,
  calendar,
  vaccinations,
  onRegisterClick,
}: CalendarioVacinasProps) => {
  const babyAgeMonths = differenceInMonths(new Date(), new Date(profile.birth_date));

  const groupedVaccines = useMemo(() => {
    const groups: { [key: number]: VaccinationCalendar[] } = {};
    calendar.forEach(vaccine => {
      if (!groups[vaccine.age_months]) {
        groups[vaccine.age_months] = [];
      }
      groups[vaccine.age_months].push(vaccine);
    });
    return groups;
  }, [calendar]);

  const getVaccineStatus = (vaccine: VaccinationCalendar) => {
    const applied = vaccinations.find(
      v => v.vaccine_name === vaccine.vaccine_name && v.dose_label === vaccine.dose_label
    );

    if (applied) return 'completed';
    if (vaccine.age_months <= babyAgeMonths) return 'overdue';
    if (vaccine.age_months === babyAgeMonths + 1) return 'upcoming';
    return 'pending';
  };

  const getAgeLabel = (months: number) => {
    if (months === 0) return 'Ao nascer';
    if (months === 12) return '1 ano';
    if (months === 48) return '4 anos';
    if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    return `${Math.floor(months / 12)} anos`;
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedVaccines)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([ageMonths, vaccines]) => (
          <Card key={ageMonths}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📅 {getAgeLabel(Number(ageMonths))}
                {Number(ageMonths) === babyAgeMonths && (
                  <Badge variant="secondary">Idade atual</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vaccines.map(vaccine => {
                const status = getVaccineStatus(vaccine);
                const applied = vaccinations.find(
                  v =>
                    v.vaccine_name === vaccine.vaccine_name && v.dose_label === vaccine.dose_label
                );

                return (
                  <div
                    key={vaccine.id}
                    className={`p-4 rounded-lg border-2 ${
                      status === 'completed'
                        ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                        : status === 'overdue'
                          ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                          : status === 'upcoming'
                            ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
                            : 'bg-card border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{vaccine.vaccine_name}</h4>
                          {vaccine.dose_label && (
                            <Badge variant="outline">{vaccine.dose_label}</Badge>
                          )}
                          {status === 'completed' && <Check className="h-4 w-4 text-green-600" />}
                          {status === 'upcoming' && <Clock className="h-4 w-4 text-yellow-600" />}
                          {status === 'overdue' && <AlertCircle className="h-4 w-4 text-red-600" />}
                        </div>

                        {vaccine.description && (
                          <p className="text-sm text-muted-foreground">{vaccine.description}</p>
                        )}

                        {applied && (
                          <div className="text-sm text-muted-foreground">
                            Aplicada em:{' '}
                            {new Date(applied.application_date).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Info className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{vaccine.vaccine_name}</DialogTitle>
                              <DialogDescription>{vaccine.dose_label}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {vaccine.purpose && (
                                <div>
                                  <h4 className="font-semibold mb-1">💊 Para que serve</h4>
                                  <p className="text-sm">{vaccine.purpose}</p>
                                </div>
                              )}
                              {vaccine.application_type && (
                                <div>
                                  <h4 className="font-semibold mb-1">💉 Via de aplicação</h4>
                                  <p className="text-sm">{vaccine.application_type}</p>
                                </div>
                              )}
                              {vaccine.side_effects && (
                                <div>
                                  <h4 className="font-semibold mb-1">
                                    ⚠️ Efeitos colaterais esperados
                                  </h4>
                                  <p className="text-sm">{vaccine.side_effects}</p>
                                </div>
                              )}
                              {vaccine.post_vaccine_tips && (
                                <div>
                                  <h4 className="font-semibold mb-1">💡 Dicas pós-vacina</h4>
                                  <p className="text-sm">{vaccine.post_vaccine_tips}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        {!applied && (
                          <Button
                            size="sm"
                            onClick={() => onRegisterClick(vaccine)}
                            variant={status === 'overdue' ? 'destructive' : 'default'}
                          >
                            Registrar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
    </div>
  );
};
