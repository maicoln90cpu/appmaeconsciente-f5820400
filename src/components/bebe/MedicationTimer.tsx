import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pill, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useBabyMedications, MEDICATION_FREQUENCIES } from "@/hooks/useBabyMedications";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MedicationTimerProps {
  babyProfileId?: string;
}

export const MedicationTimer = ({ babyProfileId }: MedicationTimerProps) => {
  const {
    medications,
    isLoading,
    addMedication,
    logMedication,
    isMedicationGivenToday,
    getNextDose,
    isAdding,
  } = useBabyMedications(babyProfileId);

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    medication_name: "",
    dosage: "",
    frequency: "once_daily",
    times_per_day: 1,
    time_of_day: ["08:00"],
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    notes: "",
  });

  const handleSubmit = () => {
    addMedication({
      baby_profile_id: babyProfileId,
      medication_name: formData.medication_name,
      dosage: formData.dosage,
      frequency: formData.frequency,
      times_per_day: formData.times_per_day,
      time_of_day: formData.time_of_day.filter(t => t),
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      notes: formData.notes || null,
    });

    setFormData({
      medication_name: "",
      dosage: "",
      frequency: "once_daily",
      times_per_day: 1,
      time_of_day: ["08:00"],
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      notes: "",
    });
    setIsOpen(false);
  };

  const handleGiveMedication = (medicationId: string, dosage: string) => {
    logMedication({
      medication_id: medicationId,
      given_at: new Date().toISOString(),
      dosage_given: dosage,
    });
  };

  const handleFrequencyChange = (value: string) => {
    const timesMap: Record<string, number> = {
      'once_daily': 1,
      'twice_daily': 2,
      'three_daily': 3,
      'four_daily': 4,
      'every_8h': 3,
      'every_6h': 4,
      'as_needed': 1,
    };

    const times = timesMap[value] || 1;
    const timeSlots = Array(times).fill('').map((_, i) => {
      const hour = Math.floor(8 + (i * (14 / times)));
      return `${hour.toString().padStart(2, '0')}:00`;
    });

    setFormData(prev => ({
      ...prev,
      frequency: value,
      times_per_day: times,
      time_of_day: timeSlots,
    }));
  };

  if (isLoading) {
    return <Card className="animate-pulse h-64" />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-blue-500" />
              Timer de Medicamentos
            </CardTitle>
            <CardDescription>
              Controle os horários e doses dos medicamentos
            </CardDescription>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Medicamento</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do Medicamento *</Label>
                  <Input
                    value={formData.medication_name}
                    onChange={e => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
                    placeholder="Ex: Vitamina D"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Dosagem *</Label>
                  <Input
                    value={formData.dosage}
                    onChange={e => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="Ex: 5 gotas, 2.5ml"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select value={formData.frequency} onValueChange={handleFrequencyChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEDICATION_FREQUENCIES.map(freq => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Horários</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {formData.time_of_day.map((time, idx) => (
                      <Input
                        key={idx}
                        type="time"
                        value={time}
                        onChange={e => {
                          const newTimes = [...formData.time_of_day];
                          newTimes[idx] = e.target.value;
                          setFormData(prev => ({ ...prev, time_of_day: newTimes }));
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim (opcional)</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Dar com leite, etc..."
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full"
                  disabled={!formData.medication_name || !formData.dosage || isAdding}
                >
                  Salvar Medicamento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[350px]">
            {medications && medications.length > 0 ? (
              <div className="space-y-3">
                {medications.map(med => {
                  const isGiven = isMedicationGivenToday(med.id);
                  const nextDose = getNextDose(med);

                  return (
                    <div
                      key={med.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        isGiven ? 'bg-emerald-50 border-emerald-200' : 'bg-background hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{med.medication_name}</span>
                            <Badge variant="secondary">{med.dosage}</Badge>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {med.time_of_day?.join(', ') || 'Sem horário definido'}
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            {isGiven ? (
                              <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Dado hoje
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Próximo: {nextDose}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {!isGiven && nextDose !== 'Completo hoje' && (
                          <Button
                            size="sm"
                            onClick={() => handleGiveMedication(med.id, med.dosage)}
                            className="gap-1"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Dar agora
                          </Button>
                        )}
                      </div>

                      {med.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          📝 {med.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum medicamento cadastrado</p>
                <p className="text-sm">Adicione os medicamentos do bebê</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
