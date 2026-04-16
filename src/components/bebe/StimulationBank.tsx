import { useState, useCallback } from "react";
import { useSubmitGuard } from "@/hooks/useSubmitGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStimulationBank, ACTIVITY_CATEGORIES, DEVELOPMENT_AREAS } from "@/hooks/useStimulationBank";
import { Plus, Star, StarOff, CheckCircle2, Trash2, Sparkles, Filter } from "lucide-react";

interface Props {
  babyProfileId?: string;
}

export const StimulationBank = ({ babyProfileId }: Props) => {
  const { activities, loading, addActivity, markDone, toggleFavorite, removeActivity, seedDefaults } = useStimulationBank(babyProfileId);
  const [open, setOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAge, setFilterAge] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("motor");
  const [ageStart, setAgeStart] = useState(0);
  const [ageEnd, setAgeEnd] = useState(12);
  const [duration, setDuration] = useState(10);
  const [devAreas, setDevAreas] = useState<string[]>([]);

  const handleSaveRaw = useCallback(async () => {
    if (!title.trim()) return;
    await addActivity({
      title,
      description: description || null,
      category,
      age_range_start: ageStart,
      age_range_end: ageEnd,
      duration_minutes: duration,
      materials: [],
      development_areas: devAreas,
      baby_profile_id: babyProfileId || null,
    });
    setOpen(false);
    setTitle(""); setDescription(""); setDevAreas([]);
  }, [title, description, category, ageStart, ageEnd, duration, devAreas, babyProfileId, addActivity]);

  const [isSaving, handleSave] = useSubmitGuard(handleSaveRaw);

  const filtered = activities.filter(a => {
    if (filterCategory !== "all" && a.category !== filterCategory) return false;
    if (filterAge !== "all") {
      const [start, end] = filterAge.split("-").map(Number);
      if (a.age_range_start > end || a.age_range_end < start) return false;
    }
    if (showFavoritesOnly && !a.is_favorite) return false;
    return true;
  });

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold">🧩 Banco de Estimulação</h3>
          <p className="text-sm text-muted-foreground">{activities.length} atividades disponíveis</p>
        </div>
        <div className="flex gap-2">
          {activities.length === 0 && (
            <Button variant="outline" size="sm" onClick={() => seedDefaults()}>
              <Sparkles className="h-4 w-4 mr-1" /> Carregar sugestões
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Criar atividade</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nova atividade</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Título</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Brincar com blocos" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Como realizar..." />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Categoria</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_CATEGORIES.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duração (min)</Label>
                    <Input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Idade mín (meses)</Label>
                    <Input type="number" value={ageStart} onChange={e => setAgeStart(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Idade máx (meses)</Label>
                    <Input type="number" value={ageEnd} onChange={e => setAgeEnd(Number(e.target.value))} />
                  </div>
                </div>
                <div>
                  <Label>Áreas de desenvolvimento</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {DEVELOPMENT_AREAS.map(area => (
                      <Badge
                        key={area}
                        variant={devAreas.includes(area) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => setDevAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area])}
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button onClick={handleSave} disabled={!title.trim() || isSaving} className="w-full">
                  {isSaving ? "Salvando..." : "Salvar atividade"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-36"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {ACTIVITY_CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterAge} onValueChange={setFilterAge}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas idades</SelectItem>
            <SelectItem value="0-3">0-3 meses</SelectItem>
            <SelectItem value="3-6">3-6 meses</SelectItem>
            <SelectItem value="6-9">6-9 meses</SelectItem>
            <SelectItem value="9-12">9-12 meses</SelectItem>
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant={showFavoritesOnly ? "default" : "outline"}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Star className="h-3 w-3 mr-1" /> Favoritas
        </Button>
      </div>

      {/* Lista */}
      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(activity => {
            const cat = ACTIVITY_CATEGORIES.find(c => c.value === activity.category);
            return (
              <Card key={activity.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium">
                      {cat?.icon} {activity.title}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleFavorite(activity.id)}>
                        {activity.is_favorite ? <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> : <StarOff className="h-3.5 w-3.5" />}
                      </Button>
                      {activity.is_custom && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeActivity(activity.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {activity.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-[10px]">{activity.age_range_start}-{activity.age_range_end}m</Badge>
                    <Badge variant="secondary" className="text-[10px]">{activity.duration_minutes} min</Badge>
                    {activity.completed_count > 0 && (
                      <Badge variant="outline" className="text-[10px]">✅ {activity.completed_count}x feita</Badge>
                    )}
                  </div>
                  {activity.development_areas.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {activity.development_areas.slice(0, 3).map(area => (
                        <Badge key={area} variant="outline" className="text-[10px]">{area}</Badge>
                      ))}
                    </div>
                  )}
                  <Button size="sm" variant="outline" className="w-full mt-1" onClick={() => markDone(activity.id)}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Marcar como feita
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-8 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              {activities.length === 0 ? "Clique em 'Carregar sugestões' para começar" : "Nenhuma atividade encontrada com esses filtros"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
