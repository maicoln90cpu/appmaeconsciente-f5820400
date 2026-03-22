import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeethTracker, BABY_TEETH, TOOTH_SYMPTOMS, RELIEF_METHODS } from "@/hooks/useTeethTracker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Trash2, SmilePlus } from "lucide-react";

interface Props {
  babyProfileId?: string;
}

export const TeethTracker = ({ babyProfileId }: Props) => {
  const { logs, loading, addTooth, removeTooth } = useTeethTracker(babyProfileId);
  const [open, setOpen] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [noticedDate, setNoticedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [painLevel, setPainLevel] = useState(0);
  const [reliefMethods, setReliefMethods] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const registeredNumbers = new Set(logs.map(l => l.tooth_number));
  const availableTeeth = BABY_TEETH.filter(t => !registeredNumbers.has(t.number));

  const handleSave = async () => {
    if (!selectedTooth) return;
    const tooth = BABY_TEETH.find(t => t.number === selectedTooth)!;
    await addTooth({
      baby_profile_id: babyProfileId || null,
      tooth_number: tooth.number,
      tooth_name: tooth.name,
      tooth_position: tooth.position,
      noticed_date: noticedDate,
      symptoms,
      pain_level: painLevel,
      relief_methods: reliefMethods,
      notes: notes || null,
      photo_url: null,
    });
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedTooth(null);
    setNoticedDate(format(new Date(), "yyyy-MM-dd"));
    setSymptoms([]);
    setPainLevel(0);
    setReliefMethods([]);
    setNotes("");
  };

  const toggleArrayItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  const upperTeeth = BABY_TEETH.filter(t => t.position === "upper");
  const lowerTeeth = BABY_TEETH.filter(t => t.position === "lower");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            🦷 Rastreador de Dentes
          </h3>
          <p className="text-sm text-muted-foreground">
            {logs.length} de 20 dentes registrados
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={availableTeeth.length === 0}>
              <Plus className="h-4 w-4 mr-1" /> Novo dente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar novo dente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Qual dente nasceu?</Label>
                <Select value={selectedTooth?.toString() || ""} onValueChange={v => setSelectedTooth(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o dente" /></SelectTrigger>
                  <SelectContent>
                    {availableTeeth.map(t => (
                      <SelectItem key={t.number} value={t.number.toString()}>
                        {t.name} (~{t.avgMonth}m)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data que notou</Label>
                <Input type="date" value={noticedDate} onChange={e => setNoticedDate(e.target.value)} />
              </div>

              <div>
                <Label>Sintomas observados</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {TOOTH_SYMPTOMS.map(s => (
                    <Badge
                      key={s}
                      variant={symptoms.includes(s) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleArrayItem(symptoms, s, setSymptoms)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Nível de desconforto: {painLevel}/5</Label>
                <div className="flex gap-1 mt-1">
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <Button
                      key={n}
                      size="sm"
                      variant={painLevel === n ? "default" : "outline"}
                      onClick={() => setPainLevel(n)}
                      className="w-9 h-9 p-0"
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Métodos de alívio</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {RELIEF_METHODS.map(m => (
                    <Badge
                      key={m}
                      variant={reliefMethods.includes(m) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleArrayItem(reliefMethods, m, setReliefMethods)}
                    >
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas adicionais..." />
              </div>

              <Button onClick={handleSave} disabled={!selectedTooth} className="w-full">
                Registrar dente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mapa visual da boca */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Mapa Dental</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2">
            {/* Arcada superior */}
            <div className="flex gap-1 justify-center flex-wrap">
              {upperTeeth.map(t => (
                <div
                  key={t.number}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    registeredNumbers.has(t.number)
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-muted/30 border-muted-foreground/20 text-muted-foreground/40"
                  }`}
                  title={t.name}
                >
                  {registeredNumbers.has(t.number) ? "🦷" : t.number}
                </div>
              ))}
            </div>
            <div className="w-20 border-t-2 border-muted-foreground/20" />
            {/* Arcada inferior */}
            <div className="flex gap-1 justify-center flex-wrap">
              {lowerTeeth.map(t => (
                <div
                  key={t.number}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    registeredNumbers.has(t.number)
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-muted/30 border-muted-foreground/20 text-muted-foreground/40"
                  }`}
                  title={t.name}
                >
                  {registeredNumbers.has(t.number) ? "🦷" : t.number}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico */}
      {logs.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Histórico ({logs.length} dentes)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border">
                <div className="space-y-1">
                  <p className="font-medium text-sm">🦷 {log.tooth_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(log.noticed_date), "dd/MM/yyyy", { locale: ptBR })}
                    {log.pain_level > 0 && ` • Desconforto: ${log.pain_level}/5`}
                  </p>
                  {log.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {log.symptoms.map(s => (
                        <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeTooth(log.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-8 text-center">
            <SmilePlus className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum dente registrado ainda</p>
            <p className="text-xs text-muted-foreground">O primeiro dente costuma aparecer por volta dos 6 meses</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
