import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Search, Clock, Users, ChefHat, BookOpen, Heart, ChevronDown, ChevronUp, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFavorites } from "@/hooks/useFavorites";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  category: string;
  prep_time: number | null;
  servings: number;
  calories: number | null;
  nutrients: any;
  ingredients: string[];
  preparation: string[];
  tips: string | null;
  tags: string[] | null;
  trimester_focus: number[] | null;
}

const CATEGORIES = {
  cafe_manha: "Café da Manhã",
  almoco: "Almoço",
  jantar: "Jantar",
  lanche: "Lanche",
  sobremesa: "Sobremesa"
};

export function Receitas() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTrimester, setSelectedTrimester] = useState<string | null>(null);
  const [selectedPrepTime, setSelectedPrepTime] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const { isFavorite, toggleFavorite, updateNotes, getNotes } = useFavorites('recipe');

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [searchTerm, selectedCategory, selectedTrimester, selectedPrepTime, selectedTag, recipes]);

  const loadRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title, description, category, ingredients, preparation, prep_time, servings, calories, proteins, carbs, fats, nutrients, image_url, tags, trimester_focus, tips, is_public, created_at')
        .eq('is_public', true)
        .order('title');

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecipes = () => {
    let filtered = recipes;

    if (searchTerm) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(recipe => recipe.category === selectedCategory);
    }

    if (selectedTrimester) {
      filtered = filtered.filter(recipe => 
        recipe.trimester_focus && recipe.trimester_focus.includes(parseInt(selectedTrimester))
      );
    }

    if (selectedPrepTime) {
      const maxTime = parseInt(selectedPrepTime);
      filtered = filtered.filter(recipe => 
        recipe.prep_time && recipe.prep_time <= maxTime
      );
    }

    if (selectedTag) {
      filtered = filtered.filter(recipe =>
        recipe.tags && recipe.tags.includes(selectedTag)
      );
    }

    setFilteredRecipes(filtered);
  };

  const toggleExpanded = (recipeId: string) => {
    setExpandedRecipes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  };

  const handleEditNotes = (recipeId: string) => {
    setEditingNotes(recipeId);
    setNoteText(getNotes(recipeId) || '');
  };

  const handleSaveNotes = async (recipeId: string) => {
    await updateNotes(recipeId, noteText);
    setEditingNotes(null);
  };

  const handleCancelNotes = () => {
    setEditingNotes(null);
    setNoteText('');
  };

  // Extract all unique tags from recipes
  const allTags = Array.from(new Set(recipes.flatMap(r => r.tags || [])));

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Receitas Saudáveis</h2>
        <p className="text-muted-foreground">Receitas nutritivas e fáceis para sua gestação</p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar receitas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filtros de Categoria */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            size="sm"
          >
            Todas
          </Button>
          {Object.entries(CATEGORIES).map(([key, label]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              onClick={() => setSelectedCategory(key)}
              size="sm"
              className="whitespace-nowrap"
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Filtros Avançados */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select value={selectedTrimester || ""} onValueChange={(v) => setSelectedTrimester(v || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Trimestre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os trimestres</SelectItem>
              <SelectItem value="1">1º Trimestre</SelectItem>
              <SelectItem value="2">2º Trimestre</SelectItem>
              <SelectItem value="3">3º Trimestre</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPrepTime || ""} onValueChange={(v) => setSelectedPrepTime(v || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Tempo de preparo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Qualquer tempo</SelectItem>
              <SelectItem value="15">Até 15 min</SelectItem>
              <SelectItem value="30">Até 30 min</SelectItem>
              <SelectItem value="45">Até 45 min</SelectItem>
              <SelectItem value="60">Até 1 hora</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTag || ""} onValueChange={(v) => setSelectedTag(v || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Tags nutricionais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as tags</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <Alert>
          <BookOpen className="h-4 w-4" />
          <AlertDescription>
            {recipes.length === 0
              ? "Em breve teremos receitas deliciosas e nutritivas para você!"
              : "Nenhuma receita encontrada com os filtros selecionados."}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredRecipes.map((recipe) => {
            const isExpanded = expandedRecipes.has(recipe.id);
            const isFav = isFavorite(recipe.id);
            
            return (
              <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{recipe.title}</CardTitle>
                      <CardDescription>{recipe.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(recipe.id, 'recipe')}
                        className="shrink-0"
                        aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      >
                        <Heart className={`h-5 w-5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                      <Badge variant="secondary" className="shrink-0">
                        {CATEGORIES[recipe.category as keyof typeof CATEGORIES]}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                    {recipe.prep_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {recipe.prep_time} min
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {recipe.servings} {recipe.servings === 1 ? 'porção' : 'porções'}
                    </div>
                    {recipe.calories && (
                      <div className="flex items-center gap-1">
                        <ChefHat className="h-4 w-4" />
                        {recipe.calories} kcal
                      </div>
                    )}
                  </div>

                  {/* Informações Nutricionais */}
                  {recipe.nutrients && (recipe.nutrients.proteins || recipe.nutrients.carbs || recipe.nutrients.fats) && (
                    <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg">
                      {recipe.nutrients.proteins && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Proteínas</p>
                          <p className="font-semibold text-sm">{recipe.nutrients.proteins}g</p>
                        </div>
                      )}
                      {recipe.nutrients.carbs && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Carboidratos</p>
                          <p className="font-semibold text-sm">{recipe.nutrients.carbs}g</p>
                        </div>
                      )}
                      {recipe.nutrients.fats && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Gorduras</p>
                          <p className="font-semibold text-sm">{recipe.nutrients.fats}g</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Aviso para receitas sem info nutricional */}
                  {!recipe.nutrients && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground italic">
                        Informações nutricionais não disponíveis para esta receita
                      </p>
                    </div>
                  )}

                  {recipe.trimester_focus && recipe.trimester_focus.length > 0 && (
                    <div className="flex gap-2">
                      {recipe.trimester_focus.map((trimester) => (
                        <Badge key={trimester} variant="outline" className="text-xs">
                          {trimester}º Trimestre
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Ingredientes - Resumido ou Completo */}
                  <div>
                    <h4 className="font-semibold mb-2">Ingredientes:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {(isExpanded ? recipe.ingredients : recipe.ingredients.slice(0, 4)).map((ingredient, index) => (
                        <li key={index}>{ingredient}</li>
                      ))}
                      {!isExpanded && recipe.ingredients.length > 4 && (
                        <li className="text-muted-foreground">
                          + {recipe.ingredients.length - 4} ingredientes...
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Modo de Preparo - Expandível */}
                  {recipe.preparation && recipe.preparation.length > 0 && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <h4 className="font-semibold mb-2 text-sm">Como Preparar:</h4>
                      {isExpanded ? (
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                          {recipe.preparation.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {recipe.preparation[0]}
                          {recipe.preparation.length > 1 && ` (+ ${recipe.preparation.length - 1} passos)`}
                        </p>
                      )}
                    </div>
                  )}

                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {recipe.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Botão Expandir/Recolher */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpanded(recipe.id)}
                    className="w-full"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Ver menos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Ver detalhes completos
                      </>
                    )}
                  </Button>

                  {/* Notes section for favorited recipes */}
                  {isFav && (
                    <div className="pt-4 border-t mt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-foreground">Minhas Anotações</h4>
                          {editingNotes !== recipe.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditNotes(recipe.id)}
                            >
                              {getNotes(recipe.id) ? 'Editar' : 'Adicionar nota'}
                            </Button>
                          )}
                        </div>
                        
                        {editingNotes === recipe.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Adicione ajustes, substituições, ou observações pessoais sobre esta receita..."
                              className="min-h-[100px]"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveNotes(recipe.id)}
                                className="gap-2"
                              >
                                <Save className="h-4 w-4" />
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelNotes}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          getNotes(recipe.id) && (
                            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                              {getNotes(recipe.id)}
                            </p>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
