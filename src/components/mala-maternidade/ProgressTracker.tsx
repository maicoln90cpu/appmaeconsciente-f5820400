import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";

interface ChecklistItem {
  id: string;
  name: string;
  checked: boolean;
}

interface ProgressTrackerProps {
  motherItems: ChecklistItem[];
  babyItems: ChecklistItem[];
  companionItems: ChecklistItem[];
}

export const ProgressTracker = ({
  motherItems,
  babyItems,
  companionItems,
}: ProgressTrackerProps) => {
  const calculateProgress = (items: ChecklistItem[]) => {
    if (items.length === 0) return 0;
    return (items.filter(i => i.checked).length / items.length) * 100;
  };

  const motherProgress = calculateProgress(motherItems);
  const babyProgress = calculateProgress(babyItems);
  const companionProgress = calculateProgress(companionItems);

  const totalItems = motherItems.length + babyItems.length + companionItems.length;
  const totalChecked =
    motherItems.filter(i => i.checked).length +
    babyItems.filter(i => i.checked).length +
    companionItems.filter(i => i.checked).length;
  const totalProgress = (totalChecked / totalItems) * 100;

  const isComplete = totalProgress === 100;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progresso Total</span>
          <span className="text-sm text-muted-foreground">
            {totalChecked}/{totalItems} itens
          </span>
        </div>
        <Progress value={totalProgress} className="h-3" />
        {isComplete && (
          <div className="flex items-center gap-2 mt-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Todas as malas estão prontas! 🎉</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">👩 Mãe</span>
            <span className="text-xs text-muted-foreground">
              {Math.round(motherProgress)}%
            </span>
          </div>
          <Progress value={motherProgress} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">👶 Bebê</span>
            <span className="text-xs text-muted-foreground">
              {Math.round(babyProgress)}%
            </span>
          </div>
          <Progress value={babyProgress} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">👤 Acompanhante</span>
            <span className="text-xs text-muted-foreground">
              {Math.round(companionProgress)}%
            </span>
          </div>
          <Progress value={companionProgress} className="h-2" />
        </div>
      </div>

      {totalProgress < 100 && totalProgress > 0 && (
        <div className="text-sm text-muted-foreground text-center pt-2">
          Continue assim! Você está {Math.round(100 - totalProgress)}% de finalizar.
        </div>
      )}
    </div>
  );
};
