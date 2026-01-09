import { Baby } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BabyProfile {
  id: string;
  baby_name: string;
}

interface DashboardBebeHeaderProps {
  babyProfiles: BabyProfile[];
  selectedBabyId: string;
  onBabyChange: (id: string) => void;
}

export const DashboardBebeHeader = ({ 
  babyProfiles, 
  selectedBabyId, 
  onBabyChange 
}: DashboardBebeHeaderProps) => {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Baby className="h-10 w-10 text-primary" />
          Minha Rotina do Bebê
        </h1>
        <p className="text-muted-foreground">
          Visão 360° da rotina: mamadas, sono, crescimento e alimentação
        </p>
      </div>
      {babyProfiles.length > 0 && (
        <Select value={selectedBabyId} onValueChange={onBabyChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione o bebê" />
          </SelectTrigger>
          <SelectContent>
            {babyProfiles.map((baby) => (
              <SelectItem key={baby.id} value={baby.id}>
                {baby.baby_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};
