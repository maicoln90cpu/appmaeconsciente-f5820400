import { useState } from 'react';

import { CheckCircle2, Calendar } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

import { DevelopmentMilestoneType } from '@/types/development';
import { AREA_LABELS, AREA_ICONS } from '@/types/development';


interface RegistroRapidoMarcosProps {
  milestones: DevelopmentMilestoneType[];
  babyAgeMonths: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (milestoneIds: string[], date: Date) => Promise<void>;
}

export const RegistroRapidoMarcos = ({
  milestones,
  babyAgeMonths,
  open,
  onOpenChange,
  onSave,
}: RegistroRapidoMarcosProps) => {
  const [selectedMilestones, setSelectedMilestones] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter milestones relevant to current age (with margin)
  const relevantMilestones = milestones.filter(
    m => babyAgeMonths >= m.age_min_months - 1 && babyAgeMonths <= m.age_max_months + 2
  );

  // Group by area
  const milestonesByArea = relevantMilestones.reduce(
    (acc, milestone) => {
      if (!acc[milestone.area]) acc[milestone.area] = [];
      acc[milestone.area].push(milestone);
      return acc;
    },
    {} as Record<string, DevelopmentMilestoneType[]>
  );

  const handleToggle = (milestoneId: string) => {
    const newSelected = new Set(selectedMilestones);
    if (newSelected.has(milestoneId)) {
      newSelected.delete(milestoneId);
    } else {
      newSelected.add(milestoneId);
    }
    setSelectedMilestones(newSelected);
  };

  const handleSave = async () => {
    if (selectedMilestones.size === 0) return;

    setIsSubmitting(true);
    try {
      await onSave(Array.from(selectedMilestones), new Date(selectedDate));
      setSelectedMilestones(new Set());
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Registrar conquistas do bebê</DialogTitle>
          <DialogDescription>
            Marque os marcos que seu bebê já alcançou. Você pode selecionar vários de uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Data das conquistas</Label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                id="date"
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              />
            </div>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {Object.entries(milestonesByArea).map(([area, areaMilestones]) => (
                <div key={area} className="space-y-3">
                  <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
                    <span className="text-lg">{AREA_ICONS[area as keyof typeof AREA_ICONS]}</span>
                    <h3 className="font-medium">{AREA_LABELS[area as keyof typeof AREA_LABELS]}</h3>
                    <Badge variant="outline" className="ml-auto">
                      {areaMilestones.length} marcos
                    </Badge>
                  </div>

                  <div className="space-y-2 pl-2">
                    {areaMilestones.map(milestone => (
                      <div
                        key={milestone.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleToggle(milestone.id)}
                      >
                        <Checkbox
                          id={milestone.id}
                          checked={selectedMilestones.has(milestone.id)}
                          onCheckedChange={() => handleToggle(milestone.id)}
                        />
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={milestone.id}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {milestone.title}
                          </Label>
                          <p className="text-xs text-muted-foreground">{milestone.description}</p>
                          <Badge variant="secondary" className="text-xs">
                            {milestone.age_min_months}-{milestone.age_max_months} meses
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={selectedMilestones.size === 0 || isSubmitting}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {isSubmitting
              ? 'Salvando...'
              : `Salvar ${selectedMilestones.size} conquista${selectedMilestones.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
