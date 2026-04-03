import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Plus, CalendarClock, CheckCircle2, Circle, Trash2, Sparkles } from "lucide-react";
import { useBabyRoutines, ROUTINE_TYPES, DAYS_OF_WEEK } from "@/hooks/useBabyRoutines";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const AGE_TEMPLATES = {
  "0-3": {
    label: "0–3 meses",
    description: "Recém-nascido: foco em alimentação e sono frequentes",
    routines: [
      { title: "Mamada da madrugada", routine_type: "feeding", scheduled_time: "03:00", duration_minutes: 30 },
      { title: "Mamada da manhã", routine_type: "feeding", scheduled_time: "06:00", duration_minutes: 30 },
      { title: "Soneca da manhã", routine_type: "sleep", scheduled_time: "08:00", duration_minutes: 90 },
      { title: "Mamada", routine_type: "feeding", scheduled_time: "09:30", duration_minutes: 30 },
      { title: "Banho", routine_type: "bath", scheduled_time: "10:00", duration_minutes: 15 },
      { title: "Soneca da tarde", routine_type: "sleep", scheduled_time: "12:00", duration_minutes: 120 },
      { title: "Mamada da tarde", routine_type: "feeding", scheduled_time: "14:00", duration_minutes: 30 },
      { title: "Passeio leve", routine_type: "play", scheduled_time: "16:00", duration_minutes: 20 },
      { title: "Mamada da noite", routine_type: "feeding", scheduled_time: "18:00", duration_minutes: 30 },
      { title: "Rotina de sono", routine_type: "sleep", scheduled_time: "19:30", duration_minutes: 30 },
    ],
  },
  "3-6": {
    label: "3–6 meses",
    description: "Mais interação: brincadeiras e sonecas mais definidas",
    routines: [
      { title: "Mamada da manhã", routine_type: "feeding", scheduled_time: "06:30", duration_minutes: 25 },
      { title: "Brincadeira no tapete", routine_type: "play", scheduled_time: "07:30", duration_minutes: 30 },
      { title: "Soneca da manhã", routine_type: "sleep", scheduled_time: "09:00", duration_minutes: 60 },
      { title: "Mamada", routine_type: "feeding", scheduled_time: "10:00", duration_minutes: 25 },
      { title: "Estímulo sensorial", routine_type: "play", scheduled_time: "11:00", duration_minutes: 20 },
      { title: "Soneca da tarde", routine_type: "sleep", scheduled_time: "12:30", duration_minutes: 90 },
      { title: "Mamada da tarde", routine_type: "feeding", scheduled_time: "14:00", duration_minutes: 25 },
      { title: "Banho", routine_type: "bath", scheduled_time: "17:00", duration_minutes: 20 },
      { title: "Mamada da noite", routine_type: "feeding", scheduled_time: "18:30", duration_minutes: 25 },
      { title: "Hora de dormir", routine_type: "sleep", scheduled_time: "19:00", duration_minutes: 30 },
    ],
  },
  "6-12": {
    label: "6–12 meses",
    description: "Introdução alimentar, menos sonecas, mais brincadeiras",
    routines: [
      { title: "Mamada + café da manhã", routine_type: "feeding", scheduled_time: "07:00", duration_minutes: 30 },
      { title: "Brincadeira livre", routine_type: "play", scheduled_time: "08:00", duration_minutes: 40 },
      { title: "Soneca da manhã", routine_type: "sleep", scheduled_time: "09:30", duration_minutes: 60 },
      { title: "Lanche da manhã", routine_type: "feeding", scheduled_time: "10:30", duration_minutes: 20 },
      { title: "Passeio / ar livre", routine_type: "play", scheduled_time: "11:00", duration_minutes: 30 },
      { title: "Almoço", routine_type: "feeding", scheduled_time: "12:00", duration_minutes: 30 },
      { title: "Soneca da tarde", routine_type: "sleep", scheduled_time: "13:00", duration_minutes: 90 },
      { title: "Lanche da tarde", routine_type: "feeding", scheduled_time: "15:00", duration_minutes: 20 },
      { title: "Brincadeira / estimulação", routine_type: "play", scheduled_time: "16:00", duration_minutes: 30 },
      { title: "Jantar", routine_type: "feeding", scheduled_time: "17:30", duration_minutes: 30 },
      { title: "Banho e rotina de sono", routine_type: "bath", scheduled_time: "18:30", duration_minutes: 30 },
    ],
  },
} as const;

interface RoutinePlannerProps {
  babyProfileId?: string;
}

export const RoutinePlanner = ({ babyProfileId }: RoutinePlannerProps) => {
  const {
    todaysRoutines,
    isLoading,
    addRoutine,
    deleteRoutine,
    logRoutine,
    isRoutineCompletedToday,
    progress,
    completedToday,
    isAdding,
  } = useBabyRoutines(babyProfileId);

  const [isOpen, setIsOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [formData, setFormData] = useState({
    title: "",
    routine_type: "feeding",
    scheduled_time: "08:00",
    duration_minutes: 30,
    notes: "",
  });

  const applyTemplate = (ageKey: keyof typeof AGE_TEMPLATES) => {
    const template = AGE_TEMPLATES[ageKey];
    template.routines.forEach(r => {
      addRoutine({
        baby_profile_id: babyProfileId,
        title: r.title,
        routine_type: r.routine_type,
        scheduled_time: r.scheduled_time,
        duration_minutes: r.duration_minutes,
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
        notes: null,
      });
    });
    setShowTemplates(false);
    toast.success(`Template "${template.label}" aplicado com ${template.routines.length} rotinas!`);
  };

  const handleSubmit = () => {
    addRoutine({
      baby_profile_id: babyProfileId,
      title: formData.title,
      routine_type: formData.routine_type,
      scheduled_time: formData.scheduled_time,
      duration_minutes: formData.duration_minutes,
      days_of_week: selectedDays,
      notes: formData.notes || null,
    });

    setFormData({
      title: "",
      routine_type: "feeding",
      scheduled_time: "08:00",
      duration_minutes: 30,
      notes: "",
    });
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setIsOpen(false);
  };

  const handleCompleteRoutine = (routineId: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

    logRoutine({
      routine_id: routineId,
      actual_time: timeStr,
    });
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const getTypeInfo = (type: string) => {
    return ROUTINE_TYPES.find(t => t.value === type) || ROUTINE_TYPES[9];
  };

  if (isLoading) {
    return <Card className="animate-pulse h-64" />;
  }

  return (
    <div className="space-y-4">
      {/* Progress Card */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-violet-700">Progresso de Hoje</span>
            <Badge className="bg-violet-100 text-violet-700">
              {completedToday}/{todaysRoutines.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-violet-600 mt-2">
            {progress === 100
              ? '🎉 Todas as rotinas concluídas!'
              : `${Math.round(progress)}% concluído`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-violet-500" />
              Planner de Rotina
            </CardTitle>
            <CardDescription>
              Organize a rotina diária do bebê
            </CardDescription>
          </div>

          <div className="flex gap-2">
            <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Templates
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Templates por Faixa Etária</DialogTitle>
                  <DialogDescription>Escolha um modelo pronto para preencher a rotina automaticamente</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  {(Object.keys(AGE_TEMPLATES) as Array<keyof typeof AGE_TEMPLATES>).map(key => {
                    const tmpl = AGE_TEMPLATES[key];
                    return (
                      <button
                        key={key}
                        onClick={() => applyTemplate(key)}
                        className="w-full text-left p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{tmpl.label}</span>
                          <Badge variant="secondary">{tmpl.routines.length} rotinas</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{tmpl.description}</p>
                      </button>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Rotina
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Rotina</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Mamadeira da manhã"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.routine_type}
                    onValueChange={v => setFormData(prev => ({ ...prev, routine_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUTINE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            {type.icon} {type.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={formData.scheduled_time}
                      onChange={e => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duração (min)</Label>
                    <Input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={e => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 30 }))}
                      min={5}
                      max={180}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dias da Semana</Label>
                  <div className="flex gap-1">
                    {DAYS_OF_WEEK.map(day => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={selectedDays.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        className="flex-1 px-1"
                        onClick={() => toggleDay(day.value)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Detalhes adicionais..."
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full"
                  disabled={!formData.title || selectedDays.length === 0 || isAdding}
                >
                  Criar Rotina
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[350px]">
            {todaysRoutines.length > 0 ? (
              <div className="space-y-2">
                {todaysRoutines.map(routine => {
                  const typeInfo = getTypeInfo(routine.routine_type);
                  const isCompleted = isRoutineCompletedToday(routine.id);

                  return (
                    <div
                      key={routine.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        isCompleted
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-background hover:bg-muted/50"
                      )}
                    >
                      <button
                        onClick={() => !isCompleted && handleCompleteRoutine(routine.id)}
                        className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                          isCompleted
                            ? "bg-emerald-500 text-white"
                            : "border-2 border-muted-foreground/30 hover:border-primary"
                        )}
                        disabled={isCompleted}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/50" />
                        )}
                      </button>

                      <div className={cn(
                        "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg",
                        typeInfo.color
                      )}>
                        {typeInfo.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-medium",
                            isCompleted && "line-through text-muted-foreground"
                          )}>
                            {routine.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{routine.scheduled_time?.slice(0, 5)}</span>
                          <span>•</span>
                          <span>{routine.duration_minutes}min</span>
                        </div>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteRoutine(routine.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarClock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma rotina para hoje</p>
                <p className="text-sm">Crie rotinas diárias para o bebê</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
