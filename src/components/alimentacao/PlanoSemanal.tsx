import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/hooks/useProfile";
import { Calendar, Clock, Flame, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MealPlan {
  id: string;
  trimester: number;
  day_of_week: number;
  meal_type: string;
  title: string;
  description: string | null;
  calories: number | null;
  proteins: number | null;
  carbs: number | null;
  fats: number | null;
  fiber: number | null;
  iron: number | null;
  calcium: number | null;
  folic_acid: number | null;
  ingredients: string[] | null;
  preparation: string | null;
  tips: string | null;
}

interface PlanoSemanalProps {
  profile: Profile;
}

const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MEAL_TYPES = {
  cafe_manha: "Café da Manhã",
  lanche_manha: "Lanche da Manhã",
  almoco: "Almoço",
  lanche_tarde: "Lanche da Tarde",
  jantar: "Jantar",
  ceia: "Ceia"
};

export function PlanoSemanal({ profile }: PlanoSemanalProps) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  const trimester = profile.meses_gestacao 
    ? Math.ceil(profile.meses_gestacao / 3) 
    : 1;

  useEffect(() => {
    loadMealPlans();
  }, [trimester, selectedDay]);

  const loadMealPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('trimester', trimester)
        .eq('day_of_week', selectedDay)
        .order('meal_type');

      if (error) throw error;
      setMealPlans(data || []);
    } catch (error) {
      console.error('Erro ao carregar plano alimentar:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Carregando plano semanal...</div>;
  }

  if (mealPlans.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ainda não temos planos alimentares cadastrados para o seu trimestre. Em breve teremos conteúdo personalizado para você!
        </AlertDescription>
      </Alert>
    );
  }

  const totalCalories = mealPlans.reduce((sum, meal) => sum + (meal.calories || 0), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plano Alimentar do {trimester}º Trimestre</CardTitle>
              <CardDescription>
                Você está com {profile.meses_gestacao || 0} meses de gestação
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg">
              <Flame className="mr-1 h-4 w-4" />
              {totalCalories} kcal/dia
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            {DAYS_OF_WEEK.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDay(index)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedDay === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {mealPlans.map((meal) => (
              <Card key={meal.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {MEAL_TYPES[meal.meal_type as keyof typeof MEAL_TYPES]}
                      </CardTitle>
                      <CardDescription className="font-semibold text-foreground mt-1">
                        {meal.title}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {meal.calories} kcal
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {meal.description && (
                    <p className="text-muted-foreground">{meal.description}</p>
                  )}

                  {meal.ingredients && meal.ingredients.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Ingredientes:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {meal.ingredients.map((ingredient, index) => (
                          <li key={index}>{ingredient}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {meal.preparation && (
                    <div>
                      <h4 className="font-semibold mb-2">Modo de Preparo:</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {meal.preparation}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                    {meal.proteins && (
                      <div>
                        <p className="text-xs text-muted-foreground">Proteínas</p>
                        <p className="font-semibold">{meal.proteins}g</p>
                      </div>
                    )}
                    {meal.carbs && (
                      <div>
                        <p className="text-xs text-muted-foreground">Carboidratos</p>
                        <p className="font-semibold">{meal.carbs}g</p>
                      </div>
                    )}
                    {meal.iron && (
                      <div>
                        <p className="text-xs text-muted-foreground">Ferro</p>
                        <p className="font-semibold">{meal.iron}mg</p>
                      </div>
                    )}
                    {meal.calcium && (
                      <div>
                        <p className="text-xs text-muted-foreground">Cálcio</p>
                        <p className="font-semibold">{meal.calcium}mg</p>
                      </div>
                    )}
                  </div>

                  {meal.tips && (
                    <Alert>
                      <AlertDescription className="text-sm">
                        💡 <strong>Dica:</strong> {meal.tips}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
