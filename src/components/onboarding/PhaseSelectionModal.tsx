import { useState } from "react";
import { Baby, Heart } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/useToast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PhaseSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const phases = [
  {
    value: "gestante",
    label: "Estou grávida 🤰",
    description: "Ferramentas de gestação, enxoval, mala da maternidade",
    icon: Heart,
    color: "border-pink-300 bg-pink-50 dark:bg-pink-950/30 hover:border-pink-400",
  },
  {
    value: "pos-parto",
    label: "Meu bebê já nasceu 👶",
    description: "Mamadas, sono, vacinas, desenvolvimento, crescimento",
    icon: Baby,
    color: "border-sky-300 bg-sky-50 dark:bg-sky-950/30 hover:border-sky-400",
  },
] as const;

export const PhaseSelectionModal = ({ open, onOpenChange }: PhaseSelectionModalProps) => {
  const { updateProfile } = useProfile();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSelect = async (phase: string) => {
    setSaving(true);
    const { error } = await updateProfile({ fase_maternidade: phase } as any);
    setSaving(false);
    if (!error) {
      toast({ title: "Perfil atualizado!", description: phase === "gestante" ? "Mostrando ferramentas de gestação" : "Mostrando ferramentas para o bebê" });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl">Em que fase você está?</DialogTitle>
          <DialogDescription>
            Vamos personalizar sua experiência
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {phases.map((phase) => {
            const Icon = phase.icon;
            return (
              <button
                key={phase.value}
                onClick={() => handleSelect(phase.value)}
                disabled={saving}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${phase.color}`}
              >
                <div className="p-2.5 rounded-xl bg-background/80 shrink-0">
                  <Icon className="h-6 w-6 text-foreground" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{phase.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{phase.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
