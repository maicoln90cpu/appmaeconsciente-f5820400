import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import { BabyMilestoneRecord } from '@/types/development';
import { AREA_ICONS } from '@/types/development';


interface LinhaTempoMarcosProps {
  records: BabyMilestoneRecord[];
  babyAgeMonths: number;
  onMilestoneClick: (record: BabyMilestoneRecord) => void;
}

export const LinhaTempoMarcos = ({
  records,
  babyAgeMonths,
  onMilestoneClick,
}: LinhaTempoMarcosProps) => {
  // Group milestones by age range (0-3, 4-6, 7-9, 10-12 months)
  const ageGroups = [
    { label: '0-3m', min: 0, max: 3 },
    { label: '4-6m', min: 4, max: 6 },
    { label: '7-9m', min: 7, max: 9 },
    { label: '10-12m', min: 10, max: 12 },
  ];

  const getStatusIcon = (status: string, isFuture: boolean) => {
    if (isFuture) return <Circle className="h-4 w-4 text-muted-foreground" />;
    if (status === 'achieved') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === 'attention') return <AlertCircle className="h-4 w-4 text-orange-600" />;
    return <Circle className="h-4 w-4 text-blue-500" />;
  };

  const getStatusColor = (status: string, isFuture: boolean) => {
    if (isFuture) return 'bg-muted text-muted-foreground';
    if (status === 'achieved') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'attention') return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span>Conquistado</span>
            </div>
            <div className="flex items-center gap-1">
              <Circle className="h-3 w-3 text-blue-500" />
              <span>Previsto</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-orange-600" />
              <span>Atenção</span>
            </div>
            <div className="flex items-center gap-1">
              <Circle className="h-3 w-3 text-muted-foreground" />
              <span>Futuro</span>
            </div>
          </div>
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-6 pb-4">
            {ageGroups.map(group => {
              const groupMilestones = records.filter(
                r =>
                  r.milestone &&
                  r.milestone.age_min_months >= group.min &&
                  r.milestone.age_max_months <= group.max
              );

              const isFuture = group.min > babyAgeMonths;
              const isCurrent = babyAgeMonths >= group.min && babyAgeMonths <= group.max;

              return (
                <div key={group.label} className="flex-shrink-0 space-y-3 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isCurrent ? 'default' : 'outline'}
                      className={isCurrent ? 'bg-primary' : ''}
                    >
                      {group.label}
                    </Badge>
                    {isCurrent && (
                      <span className="text-xs text-muted-foreground">(idade atual)</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {groupMilestones.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhum marco nesta faixa</p>
                    ) : (
                      groupMilestones.map(record => (
                        <button
                          key={record.milestone_type_id}
                          onClick={() => onMilestoneClick(record)}
                          className={`w-full p-2 rounded-lg border text-left transition-colors hover:shadow-sm ${getStatusColor(record.status, isFuture)}`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5">{getStatusIcon(record.status, isFuture)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-xs">
                                  {record.milestone && AREA_ICONS[record.milestone.area]}
                                </span>
                              </div>
                              <p className="text-xs font-medium line-clamp-2">
                                {record.milestone?.title}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
