/**
 * @fileoverview Diário de Introdução Alimentar
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useFoodIntroduction,
  FOOD_CATEGORIES,
  REACTION_TYPES,
  COMMON_SYMPTOMS,
  ALLERGENIC_FOODS,
} from "@/hooks/useFoodIntroduction";
import {
  Plus,
  Apple,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Search,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FoodIntroductionDiaryProps {
  babyProfileId?: string;
}

export const FoodIntroductionDiary = ({ babyProfileId }: FoodIntroductionDiaryProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [newFood, setNewFood] = useState({
    food_name: "",
    food_category: "frutas",
    introduction_date: format(new Date(), "yyyy-MM-dd"),
    reaction_type: "nenhuma",
    reaction_symptoms: [] as string[],
    accepted: true,
    notes: "",
  });

  const {
    foodLogs,
    isLoading,
    stats,
    foodsWithReactions,
    addFoodLog,
    deleteFoodLog,
    isAdding,
    wasFoodIntroduced,
  } = useFoodIntroduction(babyProfileId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addFoodLog({
      baby_profile_id: babyProfileId,
      ...newFood,
    });
    setIsDialogOpen(false);
    setNewFood({
      food_name: "",
      food_category: "frutas",
      introduction_date: format(new Date(), "yyyy-MM-dd"),
      reaction_type: "nenhuma",
      reaction_symptoms: [],
      accepted: true,
      notes: "",
    });
  };

  const toggleSymptom = (symptom: string) => {
    setNewFood((prev) => ({
      ...prev,
      reaction_symptoms: prev.reaction_symptoms.includes(symptom)
        ? prev.reaction_symptoms.filter((s) => s !== symptom)
        : [...prev.reaction_symptoms, symptom],
    }));
  };

  const filteredLogs = foodLogs.filter((log) => {
    const matchesSearch = log.food_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || log.food_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getReactionColor = (type: string) => {
    switch (type) {
      case "leve":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "moderada":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "severa":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-green-100 text-green-800 border-green-300";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts for reactions */}
      {foodsWithReactions.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção: Alimentos com reações</AlertTitle>
          <AlertDescription>
            {foodsWithReactions.length} alimento(s) causaram reações. Evite reintroduzir e consulte o pediatra.
            <div className="mt-2 flex flex-wrap gap-2">
              {foodsWithReactions.slice(0, 5).map((food) => (
                <Badge key={food.id} variant="outline" className={getReactionColor(food.reaction_type)}>
                  {food.food_name}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.totalFoods}</p>
            <p className="text-xs text-muted-foreground">Alimentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.acceptedFoods}</p>
            <p className="text-xs text-muted-foreground">Aceitos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{stats.reactionsCount}</p>
            <p className="text-xs text-muted-foreground">Reações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{stats.allergenicFoods}</p>
            <p className="text-xs text-muted-foreground">Alergênicos</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-5 w-5 text-primary shrink-0" />
                <span className="truncate">Diário de Introdução Alimentar</span>
              </CardTitle>
              <CardDescription className="line-clamp-2">
                Registre e acompanhe os alimentos introduzidos
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 shrink-0 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  <span className="hidden xs:inline">Novo Alimento</span>
                  <span className="xs:hidden">Novo</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Registrar Alimento</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="food_name">Nome do Alimento</Label>
                    <Input
                      id="food_name"
                      placeholder="Ex: Banana"
                      value={newFood.food_name}
                      onChange={(e) => setNewFood({ ...newFood, food_name: e.target.value })}
                      required
                    />
                    {ALLERGENIC_FOODS.some((f) =>
                      newFood.food_name.toLowerCase().includes(f.toLowerCase())
                    ) && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Este é um alimento potencialmente alergênico
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Categoria</Label>
                      <Select
                        value={newFood.food_category}
                        onValueChange={(v) => setNewFood({ ...newFood, food_category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FOOD_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.emoji} {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={newFood.introduction_date}
                        onChange={(e) =>
                          setNewFood({ ...newFood, introduction_date: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Bebê aceitou?</Label>
                    <div className="flex gap-4 mt-2">
                      <Button
                        type="button"
                        variant={newFood.accepted ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewFood({ ...newFood, accepted: true })}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Sim
                      </Button>
                      <Button
                        type="button"
                        variant={!newFood.accepted ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => setNewFood({ ...newFood, accepted: false })}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Não
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Reação</Label>
                    <Select
                      value={newFood.reaction_type}
                      onValueChange={(v) => setNewFood({ ...newFood, reaction_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REACTION_TYPES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newFood.reaction_type !== "nenhuma" && (
                    <div>
                      <Label>Sintomas</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {COMMON_SYMPTOMS.map((symptom) => (
                          <div key={symptom} className="flex items-center space-x-2">
                            <Checkbox
                              id={symptom}
                              checked={newFood.reaction_symptoms.includes(symptom)}
                              onCheckedChange={() => toggleSymptom(symptom)}
                            />
                            <label htmlFor={symptom} className="text-xs">
                              {symptom}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      placeholder="Ex: Gostou bastante, comeu toda a porção"
                      value={newFood.notes}
                      onChange={(e) => setNewFood({ ...newFood, notes: e.target.value })}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isAdding}>
                    {isAdding && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Salvar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="categories">Por Categoria</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              {/* Filters */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar alimento..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {FOOD_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.emoji} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Food list */}
              <ScrollArea className="h-96">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Apple className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum alimento registrado ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredLogs.map((log) => {
                      const category = FOOD_CATEGORIES.find((c) => c.value === log.food_category);
                      return (
                        <div
                          key={log.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            log.reaction_type !== "nenhuma" && "border-orange-300 bg-orange-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{category?.emoji || "🍽️"}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{log.food_name}</p>
                                {log.is_allergenic && (
                                  <Badge variant="outline" className="text-xs">
                                    Alergênico
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(parseISO(log.introduction_date), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })}
                                {log.accepted ? (
                                  <span className="text-green-600">• Aceito</span>
                                ) : (
                                  <span className="text-red-600">• Rejeitado</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {log.reaction_type !== "nenhuma" && (
                              <Badge className={getReactionColor(log.reaction_type)}>
                                {log.reaction_type}
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => deleteFoodLog(log.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="categories">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats.byCategory.map((cat) => (
                  <Card key={cat.value} className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setSelectedCategory(cat.value);
                    }}
                  >
                    <CardContent className="pt-4 text-center">
                      <span className="text-3xl">{cat.emoji}</span>
                      <p className="font-medium mt-2">{cat.label}</p>
                      <p className="text-2xl font-bold text-primary">{cat.count}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
