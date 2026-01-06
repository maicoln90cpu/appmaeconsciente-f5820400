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
import { Progress } from "@/components/ui/progress";
import { Plus, CalendarClock, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { useBabyRoutines, ROUTINE_TYPES, DAYS_OF_WEEK } from "@/hooks/useBabyRoutines";
import { cn } from "@/lib/utils";

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
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [formData, setFormData] = useState({
    title: "",
    routine_type: "feeding",
    scheduled_time: "08:00",
    duration_minutes: 30,
    notes: "",
  });

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
