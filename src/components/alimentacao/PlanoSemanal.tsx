import { useState, useEffect } from 'react';

import { Calendar, Clock, Flame, AlertCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import { Profile } from '@/hooks/useProfile';

import { supabase } from '@/integrations/supabase/client';


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

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MEAL_TYPES = {
  breakfast: 'Café da Manhã',
  lunch: 'Almoço',
  dinner: 'Jantar',
};

export function PlanoSemanal({ profile }: PlanoSemanalProps) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  const trimester = profile.meses_gestacao ? Math.min(Math.ceil(profile.meses_gestacao / 3), 3) : 1;

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
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-7 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-8 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <Skeleton key={i} className="h-10 w-24" />
              ))}
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-5 w-48" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mealPlans.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ainda não temos planos alimentares cadastrados para o seu trimestre. Em breve teremos
          conteúdo personalizado para você!
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
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pb-4 mb-6">
            {DAYS_OF_WEEK.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDay(index)}
                className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                  selectedDay === index
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <span className="sm:hidden">{day.substring(0, 3)}</span>
                <span className="hidden sm:inline">{day}</span>
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {mealPlans.map(meal => (
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
                    <Badge variant="secondary">{meal.calories} kcal</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {meal.description && <p className="text-muted-foreground">{meal.description}</p>}

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
