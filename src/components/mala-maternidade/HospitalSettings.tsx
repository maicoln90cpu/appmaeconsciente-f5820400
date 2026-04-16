import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface HospitalSettingsProps {
  selectedHospital: string;
  onHospitalChange: (hospital: string) => void;
  deliveryType: string;
  onDeliveryTypeChange: (type: string) => void;
  weeksPregnant: number;
  onWeeksChange: (weeks: number) => void;
}

const hospitals = [
  { id: 'none', name: 'Selecione seu hospital', info: '' },
  { id: 'einstein', name: 'Hospital Albert Einstein', info: 'Fornece: fraldas, lenços, pomada' },
  { id: 'sirio', name: 'Hospital Sírio-Libanês', info: 'Fornece: fraldas, roupas básicas' },
  { id: 'samaritano', name: 'Hospital Samaritano', info: 'Fornece: fraldas, toalhas' },
  { id: 'santa-catarina', name: 'Santa Catarina', info: 'Fornece: fraldas' },
  { id: 'beneficencia', name: 'Beneficência Portuguesa', info: 'Fornece: fraldas, lenços' },
  { id: 'oswaldo-cruz', name: 'Hospital Oswaldo Cruz', info: 'Fornece: fraldas' },
  { id: 'pro-matre', name: 'Pro Matre Paulista', info: 'Fornece: fraldas, roupas' },
  { id: 'santa-joana', name: 'Santa Joana', info: 'Fornece: fraldas, lenços, roupas' },
  { id: 'other', name: 'Outro hospital', info: 'Confirme com o hospital o que é fornecido' },
];

export const HospitalSettings = ({
  selectedHospital,
  onHospitalChange,
  deliveryType,
  onDeliveryTypeChange,
  weeksPregnant,
  onWeeksChange,
}: HospitalSettingsProps) => {
  const selectedHospitalInfo = hospitals.find(h => h.id === selectedHospital);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hospital">Hospital</Label>
        <Select value={selectedHospital} onValueChange={onHospitalChange}>
          <SelectTrigger id="hospital">
            <SelectValue placeholder="Selecione seu hospital" />
          </SelectTrigger>
          <SelectContent>
            {hospitals.map(hospital => (
              <SelectItem key={hospital.id} value={hospital.id}>
                {hospital.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedHospitalInfo && selectedHospitalInfo.info && (
          <p className="text-xs text-muted-foreground">{selectedHospitalInfo.info}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tipo de Parto</Label>
        <RadioGroup value={deliveryType} onValueChange={onDeliveryTypeChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="normal" id="normal" />
            <Label htmlFor="normal" className="font-normal cursor-pointer">
              Parto Normal
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cesarea" id="cesarea" />
            <Label htmlFor="cesarea" className="font-normal cursor-pointer">
              Cesárea
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="indefinido" id="indefinido" />
            <Label htmlFor="indefinido" className="font-normal cursor-pointer">
              Ainda não sei
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="weeks">Semanas de Gestação</Label>
        <Input
          id="weeks"
          type="number"
          min="1"
          max="42"
          value={weeksPregnant}
          onChange={e => onWeeksChange(parseInt(e.target.value) || 0)}
        />
        <p className="text-xs text-muted-foreground">
          {weeksPregnant < 32 && 'Ainda há tempo para organizar tudo com calma'}
          {weeksPregnant >= 32 &&
            weeksPregnant < 37 &&
            'Bom momento para começar a preparar as malas'}
          {weeksPregnant >= 37 &&
            'Sua mala deve estar pronta! O bebê pode chegar a qualquer momento'}
        </p>
      </div>
    </div>
  );
};
