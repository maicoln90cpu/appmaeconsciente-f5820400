import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { VaccinationCalendar, BabyVaccination } from "@/types/vaccination";

interface RegistroVacinaProps {
  vaccine?: VaccinationCalendar;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (vaccination: Partial<BabyVaccination>) => Promise<any>;
}

export const RegistroVacina = ({ vaccine, open, onOpenChange, onSave }: RegistroVacinaProps) => {
  const [formData, setFormData] = useState({
    application_date: new Date().toISOString().split('T')[0],
    batch_number: '',
    manufacturer: '',
    application_site: '',
    health_professional: '',
    reactions: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const vaccinationData: Partial<BabyVaccination> = {
      ...formData,
      vaccine_name: vaccine?.vaccine_name || '',
      dose_label: vaccine?.dose_label,
      calendar_vaccine_id: vaccine?.id,
    };

    const result = await onSave(vaccinationData);
    if (!result.error) {
      onOpenChange(false);
      setFormData({
        application_date: new Date().toISOString().split('T')[0],
        batch_number: '',
        manufacturer: '',
        application_site: '',
        health_professional: '',
        reactions: '',
        notes: '',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>💉 Registrar Vacina</DialogTitle>
          <DialogDescription>
            {vaccine?.vaccine_name} {vaccine?.dose_label && `- ${vaccine.dose_label}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="application_date">Data de aplicação *</Label>
              <Input
                id="application_date"
                type="date"
                value={formData.application_date}
                onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch_number">Lote</Label>
              <Input
                id="batch_number"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                placeholder="Ex: L123456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Fabricante</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="Ex: Instituto Butantan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="application_site">Local de aplicação</Label>
              <Input
                id="application_site"
                value={formData.application_site}
                onChange={(e) => setFormData({ ...formData, application_site: e.target.value })}
                placeholder="Ex: Braço direito, Coxa esquerda"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="health_professional">Profissional de saúde</Label>
              <Input
                id="health_professional"
                value={formData.health_professional}
                onChange={(e) => setFormData({ ...formData, health_professional: e.target.value })}
                placeholder="Ex: Enf. Maria Silva"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reactions">Reações observadas</Label>
              <Textarea
                id="reactions"
                value={formData.reactions}
                onChange={(e) => setFormData({ ...formData, reactions: e.target.value })}
                placeholder="Ex: Febre baixa, irritabilidade leve"
                rows={2}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Observações adicionais</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Qualquer informação adicional relevante"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Registro
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
