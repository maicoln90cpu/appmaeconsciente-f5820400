import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, Clock, Users, ChefHat, BookOpen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [searchTerm, selectedCategory, recipes]);

  const loadRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
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

    setFilteredRecipes(filtered);
  };

  if (loading) {
    return <div className="flex justify-center py-8">Carregando receitas...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Receitas Saudáveis</h2>
        <p className="text-muted-foreground">Receitas nutritivas e fáceis para sua gestação</p>
      </div>

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
          {filteredRecipes.map((recipe) => (
            <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{recipe.title}</CardTitle>
                    <CardDescription>{recipe.description}</CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {CATEGORIES[recipe.category as keyof typeof CATEGORIES]}
                  </Badge>
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
                {(recipe.nutrients?.proteins || recipe.nutrients?.carbs || recipe.nutrients?.fats) && (
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

                {recipe.trimester_focus && recipe.trimester_focus.length > 0 && (
                  <div className="flex gap-2">
                    {recipe.trimester_focus.map((trimester) => (
                      <Badge key={trimester} variant="outline" className="text-xs">
                        {trimester}º Trimestre
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Modo de Preparo Resumido */}
                {recipe.preparation && recipe.preparation.length > 0 && (
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <h4 className="font-semibold mb-2 text-sm">Como Preparar:</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {recipe.preparation[0]}
                      {recipe.preparation.length > 1 && ` (+ ${recipe.preparation.length - 1} passos)`}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Ingredientes:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {recipe.ingredients.slice(0, 4).map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                    {recipe.ingredients.length > 4 && (
                      <li className="text-muted-foreground">
                        + {recipe.ingredients.length - 4} ingredientes...
                      </li>
                    )}
                  </ul>
                </div>

                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recipe.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
