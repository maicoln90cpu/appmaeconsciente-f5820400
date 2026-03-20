import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePregnancyExams, PregnancyExam } from "@/hooks/usePregnancyExams";
import { ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ExamChecklist() {
  const {
    exams,
    isLoading,
    toggleCompleted,
    updateExam,
    addCustomExam,
    deleteExam,
    completedCount,
    totalCount,
    progressPercent,
  } = usePregnancyExams();

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [newExamName, setNewExamName] = useState("");
  const [newExamTrimester, setNewExamTrimester] = useState("1");
  const [newExamCategory, setNewExamCategory] = useState("ambos");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredExams = exams.filter((e) => filterCategory === "all" || e.category === filterCategory);
  const groupedByTrimester = [1, 2, 3].map((tri) => ({
    trimester: tri,
    exams: filteredExams.filter((e) => e.trimester === tri),
  }));

  const trimesterLabels = ["", "1º Trimestre (1-13 sem)", "2º Trimestre (14-27 sem)", "3º Trimestre (28-40 sem)"];
  const categoryColors: Record<string, string> = { sus: "bg-primary/10 text-primary", particular: "bg-accent text-accent-foreground", ambos: "bg-secondary text-secondary-foreground" };

  const handleAddExam = () => {
    if (!newExamName.trim()) return;
    addCustomExam({ exam_name: newExamName, trimester: parseInt(newExamTrimester), category: newExamCategory });
    setNewExamName("");
    setDialogOpen(false);
  };

  if (isLoading) return <p className="text-muted-foreground text-center py-8">Carregando exames...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Checklist de Exames
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sus">SUS</SelectItem>
                  <SelectItem value="particular">Particular</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1 h-8">
                    <Plus className="h-3 w-3" /> Exame
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Exame Personalizado</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <Input placeholder="Nome do exame" value={newExamName} onChange={(e) => setNewExamName(e.target.value)} />
                    <div className="flex gap-2">
                      <Select value={newExamTrimester} onValueChange={setNewExamTrimester}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1º Trimestre</SelectItem>
                          <SelectItem value="2">2º Trimestre</SelectItem>
                          <SelectItem value="3">3º Trimestre</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={newExamCategory} onValueChange={setNewExamCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sus">SUS</SelectItem>
                          <SelectItem value="particular">Particular</SelectItem>
                          <SelectItem value="ambos">Ambos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddExam} className="w-full">Adicionar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Progress value={progressPercent} className="flex-1" />
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {completedCount}/{totalCount} ({progressPercent}%)
            </span>
          </div>

          <Accordion type="multiple" defaultValue={["tri-1", "tri-2", "tri-3"]} className="space-y-2">
            {groupedByTrimester.map(({ trimester, exams: triExams }) => (
              <AccordionItem key={trimester} value={`tri-${trimester}`} className="border rounded-lg px-2">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  {trimesterLabels[trimester]}
                  <Badge variant="secondary" className="ml-2">
                    {triExams.filter((e) => e.completed).length}/{triExams.length}
                  </Badge>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {triExams.map((exam) => (
                      <ExamRow key={exam.id} exam={exam} onToggle={toggleCompleted} onUpdate={updateExam} onDelete={deleteExam} categoryColors={categoryColors} />
                    ))}
                    {triExams.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">Nenhum exame neste filtro</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

function ExamRow({
  exam,
  onToggle,
  onUpdate,
  onDelete,
  categoryColors,
}: {
  exam: PregnancyExam;
  onToggle: (p: { id: string; completed: boolean }) => void;
  onUpdate: (p: { id: string; scheduled_date?: string; result_notes?: string }) => void;
  onDelete: (id: string) => void;
  categoryColors: Record<string, string>;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="p-2 rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={exam.completed}
          onCheckedChange={(checked) => onToggle({ id: exam.id, completed: !!checked })}
        />
        <div className="flex-1 min-w-0">
          <button
            type="button"
            className={`text-sm text-left w-full ${exam.completed ? "line-through text-muted-foreground" : ""}`}
            onClick={() => setShowDetails(!showDetails)}
          >
            {exam.exam_name}
          </button>
        </div>
        <Badge variant="secondary" className={`text-[10px] ${categoryColors[exam.category] ?? ""}`}>
          {exam.category === "ambos" ? "SUS/Part." : exam.category.toUpperCase()}
        </Badge>
        {exam.is_custom && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(exam.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      {showDetails && (
        <div className="pl-8 pt-2 space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Data agendada:</label>
            <Input
              type="date"
              className="h-7 text-xs w-40"
              value={exam.scheduled_date ?? ""}
              onChange={(e) => onUpdate({ id: exam.id, scheduled_date: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Resultado/notas:</label>
            <Input
              className="h-7 text-xs flex-1"
              placeholder="Opcional"
              value={exam.result_notes ?? ""}
              onChange={(e) => onUpdate({ id: exam.id, result_notes: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
