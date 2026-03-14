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
  if (babyProfiles.length === 0) return null;

  return (
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
  );
};
