import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BabyMilestoneRecord } from "@/types/development";
import { AREA_LABELS, AREA_ICONS } from "@/types/development";
import { CheckCircle2, AlertCircle, Lightbulb, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MilestoneDetailDialogProps {
  record: BabyMilestoneRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAsAchieved: (milestoneTypeId: string, date: Date, notes?: string) => Promise<void>;
}

export const MilestoneDetailDialog = ({
  record,
  open,
  onOpenChange,
  onMarkAsAchieved
}: MilestoneDetailDialogProps) => {
  const [notes, setNotes] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!record || !record.milestone) return null;

  const milestone = record.milestone;
  const isAchieved = record.status === 'achieved';

  const handleMarkAsAchieved = async () => {
    setIsSubmitting(true);
    try {
      await onMarkAsAchieved(milestone.id, new Date(selectedDate), notes || undefined);
      setNotes("");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                <span className="text-2xl">{AREA_ICONS[milestone.area]}</span>
                {milestone.title}
              </DialogTitle>
              <DialogDescription className="mt-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {AREA_LABELS[milestone.area]}
                  </Badge>
                  <Badge variant="outline">
                    {milestone.age_min_months}-{milestone.age_max_months} meses
                  </Badge>
                  {isAchieved && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Conquistado
                    </Badge>
                  )}
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">O que é</TabsTrigger>
            <TabsTrigger value="how">Como estimular</TabsTrigger>
            <TabsTrigger value="when">Quando observar</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground">{milestone.description}</p>
            </div>
          </TabsContent>

          <TabsContent value="how" className="space-y-4">
            {milestone.stimulation_tips && milestone.stimulation_tips.length > 0 ? (
              <div className="space-y-3">
                {milestone.stimulation_tips.map((tip, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{tip}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma dica de estimulação disponível ainda.
              </p>
            )}
          </TabsContent>

          <TabsContent value="when" className="space-y-4">
            {milestone.pediatrician_alert ? (
              <Alert variant="default" className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-900">
                  Quando conversar com o pediatra
                </AlertTitle>
                <AlertDescription className="text-orange-800">
                  {milestone.pediatrician_alert}
                </AlertDescription>
              </Alert>
            ) : (
              <p className="text-sm text-muted-foreground">
                Se tiver qualquer dúvida ou preocupação, não hesite em conversar com o pediatra.
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Section */}
        <div className="mt-6 space-y-4">
          {isAchieved ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Conquistado!</AlertTitle>
              <AlertDescription className="text-green-800">
                {record.achieved_date && (
                  <span>
                    Registrado em {format(new Date(record.achieved_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                )}
                {record.mother_notes && (
                  <p className="mt-2 text-sm italic">"{record.mother_notes}"</p>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                <span>Seu bebê já faz isso?</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Data da conquista</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ex: Começou a engatinhar na casa da vovó..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleMarkAsAchieved}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Salvando..." : "Registrar conquista"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
