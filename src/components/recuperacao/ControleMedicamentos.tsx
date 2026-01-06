import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePostpartumMedications } from "@/hooks/postpartum";
import { Plus, Pill, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ControleMedicamentos = () => {
  const { medications, logs, addMedication, logMedication } = usePostpartumMedications();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    times_per_day: 1,
    time_of_day: [] as string[],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: '',
    is_active: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMedication(formData);
    setIsOpen(false);
    setFormData({
      medication_name: '',
      dosage: '',
      frequency: '',
      times_per_day: 1,
      time_of_day: [],
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      notes: '',
      is_active: true,
    });
  };

  const handleLogMedication = (medicationId: string) => {
    logMedication({ medication_id: medicationId });
  };

  const isTakenToday = (medicationId: string) => {
    return logs?.some(log => log.medication_id === medicationId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Medicamentos Ativos</h3>
          <p className="text-sm text-muted-foreground">Gerencie seus remédios e vitaminas</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Medicamento</DialogTitle>
              <DialogDescription>
                Registre um novo medicamento para receber lembretes
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="med-name">Nome do Medicamento *</Label>
                <Input
                  id="med-name"
                  value={formData.medication_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
                  placeholder="Ex: Ibuprofeno, Ferro, Vitamina D"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosagem *</Label>
                <Input
                  id="dosage"
                  value={formData.dosage}
                  onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                  placeholder="Ex: 600mg, 1 comprimido, 10 gotas"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência *</Label>
                <Input
                  id="frequency"
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                  placeholder="Ex: A cada 6 horas, 1x ao dia"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="times">Quantas vezes por dia?</Label>
                <Input
                  id="times"
                  type="number"
                  min={1}
                  max={10}
                  value={formData.times_per_day}
                  onChange={(e) => setFormData(prev => ({ ...prev, times_per_day: parseInt(e.target.value) }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Data de Início</Label>
                  <Input
                    id="start"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">Data de Fim (opcional)</Label>
                  <Input
                    id="end"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ex: Tomar com alimentos, evitar laticínios"
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full">Adicionar Medicamento</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {medications && medications.length > 0 ? (
        <div className="grid gap-3">
          {medications.map((med) => (
            <Card key={med.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">{med.medication_name}</CardTitle>
                  </div>
                  {isTakenToday(med.id) && (
                    <Badge variant="secondary">
                      <Check className="h-3 w-3 mr-1" />
                      Tomado hoje
                    </Badge>
                  )}
                </div>
                <CardDescription>{med.dosage} • {med.frequency}</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground">{med.times_per_day}x ao dia</span>
                    {med.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{med.notes}</p>
                    )}
                  </div>
                  {!isTakenToday(med.id) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLogMedication(med.id)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Marcar como tomado
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Pill className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum medicamento registrado ainda.</p>
            <p className="text-sm">Adicione para receber lembretes!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
