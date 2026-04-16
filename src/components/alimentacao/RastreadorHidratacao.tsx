import { useState, useEffect, useRef } from "react";
import { useSubmitGuard } from "@/hooks/useSubmitGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Droplets, Plus, Trash2, Target } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WaterIntake {
  id: string;
  amount_ml: number;
  time: string;
  created_at: string;
}

interface WaterGoal {
  daily_goal_ml: number;
}

const QUICK_AMOUNTS = [200, 300, 500, 750];

export function RastreadorHidratacao() {
  const [todayIntake, setTodayIntake] = useState<WaterIntake[]>([]);
  const [goal, setGoal] = useState<number>(2000);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar meta
      const { data: goalData } = await supabase
        .from('water_goals')
        .select('daily_goal_ml')
        .eq('user_id', user.id)
        .single();

      if (goalData) {
        setGoal(goalData.daily_goal_ml);
      } else {
        // Criar meta padrão
        await supabase
          .from('water_goals')
          .insert({ user_id: user.id, daily_goal_ml: 2000 });
      }

      // Carregar consumo de hoje
      const today = format(new Date(), "yyyy-MM-dd");
      const { data: intakeData, error } = await supabase
        .from('water_intake')
        .select('id, user_id, date, time, amount_ml, created_at')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodayIntake(intakeData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados de hidratação');
    } finally {
      setLoading(false);
    }
  };

  const addWater = async (amount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('water_intake')
        .insert({
          user_id: user.id,
          amount_ml: amount
        });

      if (error) throw error;

      toast.success(`${amount}ml adicionados!`);
      loadData();
      setCustomAmount("");
    } catch (error) {
      console.error('Erro ao adicionar água:', error);
      toast.error('Erro ao registrar consumo de água');
    }
  };

  const deleteIntake = async (id: string) => {
    try {
      const { error } = await supabase
        .from('water_intake')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Registro removido');
      loadData();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao remover registro');
    }
  };

  const updateGoal = async (newGoal: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('water_goals')
        .upsert({
          user_id: user.id,
          daily_goal_ml: newGoal
        });

      if (error) throw error;

      setGoal(newGoal);
      toast.success('Meta atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      toast.error('Erro ao atualizar meta');
    }
  };

  const totalToday = todayIntake.reduce((sum, intake) => sum + intake.amount_ml, 0);
  const progress = (totalToday / goal) * 100;
  const remainingML = Math.max(0, goal - totalToday);

  if (loading) {
    return <div className="flex justify-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Rastreador de Hidratação</h2>
        <p className="text-muted-foreground">
          Manter-se bem hidratada é essencial durante a gestação
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Card de Progresso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              Progresso de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {totalToday} <span className="text-xl text-muted-foreground">ml</span>
              </div>
              <p className="text-sm text-muted-foreground">
                de {goal}ml (meta diária)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{Math.round(progress)}% da meta</span>
                <span className="text-muted-foreground">
                  Faltam {remainingML}ml
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {progress >= 100 && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  🎉 Parabéns! Você atingiu sua meta de hoje!
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4" />
                <span className="text-sm font-medium">Meta Diária</span>
              </div>
              <div className="flex gap-2">
                {[1500, 2000, 2500, 3000].map((amount) => (
                  <Button
                    key={amount}
                    variant={goal === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateGoal(amount)}
                  >
                    {amount}ml
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Adicionar Água */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Consumo</CardTitle>
            <CardDescription>
              Registre quantos ml de água você bebeu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-3">Quantidades Rápidas</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => addWater(amount)}
                    className="h-auto py-4"
                  >
                    <div className="text-center">
                      <Droplets className="h-5 w-5 mx-auto mb-1" />
                      <p className="font-semibold">{amount}ml</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Quantidade Personalizada</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Ex: 350"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  min="1"
                />
                <Button
                  onClick={() => customAmount && addWater(parseInt(customAmount))}
                  disabled={!customAmount || parseInt(customAmount) <= 0}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Hoje */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Hoje</CardTitle>
          <CardDescription>
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayIntake.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum registro ainda. Adicione seu primeiro copo de água!
            </p>
          ) : (
            <div className="space-y-2">
              {todayIntake.map((intake) => (
                <div
                  key={intake.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium">{intake.amount_ml}ml</p>
                      <p className="text-xs text-muted-foreground">
                        {intake.time}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteIntake(intake.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
