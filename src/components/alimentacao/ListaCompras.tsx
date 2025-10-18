import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Plus, Trash2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";

interface ShoppingItem {
  item: string;
  category: string;
  checked: boolean;
}

export function ListaCompras() {
  const { profile } = useProfile();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const trimester = profile?.meses_gestacao 
    ? Math.ceil(profile.meses_gestacao / 3) 
    : 1;

  useEffect(() => {
    generateShoppingList();
  }, [trimester]);

  const generateShoppingList = async () => {
    try {
      // Buscar plano alimentar da semana
      const { data: mealPlans } = await supabase
        .from('meal_plans')
        .select('ingredients')
        .eq('trimester', trimester);

      // Buscar receitas populares
      const { data: recipes } = await supabase
        .from('recipes')
        .select('ingredients, category')
        .eq('is_public', true)
        .contains('trimester_focus', [trimester])
        .limit(5);

      // Combinar todos os ingredientes
      const allIngredients = new Set<string>();
      
      mealPlans?.forEach(plan => {
        plan.ingredients?.forEach((ing: string) => allIngredients.add(ing));
      });

      recipes?.forEach(recipe => {
        recipe.ingredients?.forEach((ing: string) => allIngredients.add(ing));
      });

      // Criar lista organizada por categorias
      const categorizedItems: ShoppingItem[] = [];
      const categories = {
        'Frutas e Vegetais': ['banana', 'maçã', 'laranja', 'alface', 'tomate', 'cenoura', 'brócolis', 'espinafre'],
        'Proteínas': ['frango', 'peixe', 'carne', 'ovo', 'feijão', 'lentilha', 'grão'],
        'Laticínios': ['leite', 'queijo', 'iogurte', 'requeijão'],
        'Grãos e Cereais': ['arroz', 'aveia', 'pão', 'macarrão', 'quinoa'],
        'Outros': []
      };

      // Se não houver dados suficientes, adicionar itens essenciais básicos
      if (allIngredients.size === 0) {
        const essentialItems = [
          { item: 'Frutas variadas', category: 'Frutas e Vegetais' },
          { item: 'Vegetais folhosos', category: 'Frutas e Vegetais' },
          { item: 'Proteína magra (frango/peixe)', category: 'Proteínas' },
          { item: 'Ovos', category: 'Proteínas' },
          { item: 'Leite integral', category: 'Laticínios' },
          { item: 'Iogurte natural', category: 'Laticínios' },
          { item: 'Arroz integral', category: 'Grãos e Cereais' },
          { item: 'Aveia', category: 'Grãos e Cereais' },
          { item: 'Azeite de oliva', category: 'Outros' },
          { item: 'Castanhas variadas', category: 'Outros' },
        ];

        setItems(essentialItems.map(item => ({ ...item, checked: false })));
      } else {
        allIngredients.forEach(ingredient => {
          let category = 'Outros';
          for (const [cat, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => ingredient.toLowerCase().includes(keyword))) {
              category = cat;
              break;
            }
          }
          categorizedItems.push({ item: ingredient, category, checked: false });
        });

        setItems(categorizedItems.sort((a, b) => {
          if (a.category === b.category) return a.item.localeCompare(b.item);
          return a.category.localeCompare(b.category);
        }));
      }
    } catch (error) {
      console.error('Erro ao gerar lista:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (index: number) => {
    const newItems = [...items];
    newItems[index].checked = !newItems[index].checked;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const shareList = () => {
    const listText = items
      .filter(item => !item.checked)
      .reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item.item);
        return acc;
      }, {} as Record<string, string[]>);

    let shareText = "🛒 *Lista de Compras - Gestação Saudável*\n\n";
    
    Object.entries(listText).forEach(([category, items]) => {
      shareText += `*${category}:*\n`;
      items.forEach(item => {
        shareText += `• ${item}\n`;
      });
      shareText += "\n";
    });

    if (navigator.share) {
      navigator.share({
        title: 'Lista de Compras',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Lista copiada para a área de transferência!');
    }
  };

  const clearCompleted = () => {
    setItems(items.filter(item => !item.checked));
    toast.success('Itens marcados removidos');
  };

  if (loading) {
    return <div className="flex justify-center py-8">Gerando lista...</div>;
  }

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const completedCount = items.filter(item => item.checked).length;
  const totalCount = items.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Lista de Compras Inteligente</h2>
          <p className="text-muted-foreground">
            Baseada no seu plano alimentar e receitas do {trimester}º trimestre
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={shareList}>
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
          <Button variant="outline" onClick={clearCompleted} disabled={completedCount === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Marcados
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Progresso
              </CardTitle>
              <CardDescription>
                {completedCount} de {totalCount} itens marcados
              </CardDescription>
            </div>
            <Badge variant={completedCount === totalCount ? "default" : "secondary"}>
              {Math.round((completedCount / totalCount) * 100)}%
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{category}</CardTitle>
            <CardDescription>
              {categoryItems.filter(i => !i.checked).length} itens pendentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryItems.map((item, index) => {
                const globalIndex = items.indexOf(item);
                return (
                  <div
                    key={globalIndex}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => toggleItem(globalIndex)}
                      />
                      <span className={item.checked ? "line-through text-muted-foreground" : ""}>
                        {item.item}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(globalIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {items.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <ShoppingCart className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Lista vazia. Adicione receitas ao seu plano para gerar automaticamente!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
