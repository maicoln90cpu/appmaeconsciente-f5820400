import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Dumbbell, Play, Clock, AlertCircle, CheckCircle2, Calendar, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { useFavorites } from '@/hooks/useFavorites';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Exercise {
  id: string;
  title: string;
  description: string;
  trimester: number[];
  category: string;
  exercise_type: string | null;
  duration_minutes: number | null;
  intensity: string | null;
  instructions: string[] | null;
  benefits: string[] | null;
  precautions: string[] | null;
  video_url: string | null;
}

interface ExerciseLog {
  id: string;
  exercise_id: string;
  duration_minutes: number;
  date: string;
  notes: string | null;
}

const CATEGORIES = {
  cardio: { label: 'Cardio', color: 'bg-red-500' },
  forca: { label: 'Força', color: 'bg-blue-500' },
  flexibilidade: { label: 'Flexibilidade', color: 'bg-green-500' },
  respiracao: { label: 'Respiração', color: 'bg-purple-500' },
  relaxamento: { label: 'Relaxamento', color: 'bg-pink-500' },
};

const INTENSITY = {
  leve: 'Leve',
  moderado: 'Moderado',
  intenso: 'Intenso',
};

const EXERCISE_TYPES = {
  em_casa: 'Em Casa',
  aerobio: 'Aeróbio',
  academia: 'Academia',
  yoga: 'Yoga',
  alongamento: 'Alongamento',
  outros: 'Outros',
};

export function ExerciciosTrimestre() {
  const { profile } = useProfile();
  const { isFavorite, toggleFavorite } = useFavorites('exercise');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [todayLogs, setTodayLogs] = useState<ExerciseLog[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logDuration, setLogDuration] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [loading, setLoading] = useState(true);

  const trimester = profile?.meses_gestacao ? Math.ceil(profile.meses_gestacao / 3) : 1;

  useEffect(() => {
    loadExercises();
    loadTodayLogs();
  }, [trimester]);

  useEffect(() => {
    if (selectedType) {
      setFilteredExercises(
        exercises.filter(
          ex =>
            ex.exercise_type === selectedType ||
            (ex.exercise_type === null && selectedType === 'outros')
        )
      );
    } else {
      setFilteredExercises(exercises);
    }
  }, [selectedType, exercises]);

  const loadExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select(
          'id, title, description, category, exercise_type, trimester, duration_minutes, intensity, instructions, precautions, benefits, image_url, video_url, is_active, created_at'
        )
        .eq('is_active', true)
        .contains('trimester', [trimester])
        .order('category');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Erro ao carregar exercícios:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayLogs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('user_exercise_logs')
        .select('id, user_id, exercise_id, date, duration_minutes, notes, created_at')
        .eq('user_id', user.id)
        .eq('date', today);

      if (error) throw error;
      setTodayLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    }
  };

  const openExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  const closeExercise = () => {
    setSelectedExercise(null);
  };

  const openLogDialog = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setLogDuration(exercise.duration_minutes?.toString() || '');
    setLogDialogOpen(true);
  };

  const logExercise = async () => {
    if (!selectedExercise || !logDuration) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('user_exercise_logs').insert({
        user_id: user.id,
        exercise_id: selectedExercise.id,
        duration_minutes: parseInt(logDuration),
        notes: logNotes || null,
      });

      if (error) throw error;

      toast.success('Exercício registrado!');
      setLogDialogOpen(false);
      setLogDuration('');
      setLogNotes('');
      setSelectedExercise(null);
      loadTodayLogs();
    } catch (error) {
      console.error('Erro ao registrar exercício:', error);
      toast.error('Erro ao registrar exercício');
    }
  };

  const hasCompletedToday = (exerciseId: string) => {
    return todayLogs.some(log => log.exercise_id === exerciseId);
  };

  const totalMinutesToday = todayLogs.reduce((sum, log) => sum + log.duration_minutes, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-9 w-24" />
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
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
        <h2 className="text-2xl font-bold mb-2">Exercícios para o {trimester}º Trimestre</h2>
        <p className="text-muted-foreground">
          Exercícios seguros e recomendados para sua fase da gestação
        </p>
      </div>

      {/* Resumo do Dia */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Atividade de Hoje</p>
              <p className="text-2xl font-bold">{totalMinutesToday} minutos</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{format(new Date(), "d 'de' MMMM", { locale: ptBR })}</span>
            </div>
          </div>

          {/* Filtros por Tipo */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedType === null ? 'default' : 'outline'}
              onClick={() => setSelectedType(null)}
              size="sm"
            >
              Todos
            </Button>
            {Object.entries(EXERCISE_TYPES).map(([key, label]) => (
              <Button
                key={key}
                variant={selectedType === key ? 'default' : 'outline'}
                onClick={() => setSelectedType(key)}
                size="sm"
                className="whitespace-nowrap"
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredExercises.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Dumbbell className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>
              {exercises.length === 0
                ? `Em breve teremos exercícios para o ${trimester}º trimestre!`
                : 'Nenhum exercício encontrado com o filtro selecionado.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredExercises.map(exercise => {
            const completed = hasCompletedToday(exercise.id);
            const isFav = isFavorite(exercise.id);
            const categoryConfig = CATEGORIES[exercise.category as keyof typeof CATEGORIES];

            return (
              <Card key={exercise.id} className="relative">
                {completed && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Feito
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className={`${categoryConfig.color} p-2 rounded-lg`}>
                      <Dumbbell className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{exercise.title}</CardTitle>
                          <CardDescription>{exercise.description}</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavorite(exercise.id, 'exercise')}
                          className="shrink-0"
                          aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        >
                          <Heart
                            className={`h-5 w-5 ${isFav ? 'fill-red-500 text-red-500' : ''}`}
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{categoryConfig.label}</Badge>
                    {exercise.intensity && (
                      <Badge variant="secondary">
                        {INTENSITY[exercise.intensity as keyof typeof INTENSITY]}
                      </Badge>
                    )}
                    {exercise.duration_minutes && (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {exercise.duration_minutes} min
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => openExercise(exercise)}
                    >
                      Ver Detalhes
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => openLogDialog(exercise)}
                      disabled={completed}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {completed ? 'Concluído' : 'Começar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de Detalhes */}
      {selectedExercise && !logDialogOpen && (
        <Dialog open={!!selectedExercise} onOpenChange={() => closeExercise()}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedExercise.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <p className="text-muted-foreground">{selectedExercise.description}</p>

              {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Como Fazer
                  </h3>
                  <ol className="list-decimal list-inside space-y-2">
                    {selectedExercise.instructions.map((instruction, index) => (
                      <li key={index} className="text-sm">
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {selectedExercise.benefits && selectedExercise.benefits.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Benefícios
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedExercise.benefits.map((benefit, index) => (
                      <li key={index} className="text-sm">
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedExercise.precautions && selectedExercise.precautions.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <AlertCircle className="h-4 w-4" />
                    Precauções
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedExercise.precautions.map((precaution, index) => (
                      <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                        {precaution}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => {
                  closeExercise();
                  openLogDialog(selectedExercise);
                }}
              >
                <Play className="h-4 w-4 mr-2" />
                Começar Exercício
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Registro */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Exercício</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                type="number"
                value={logDuration}
                onChange={e => setLogDuration(e.target.value)}
                placeholder="Ex: 30"
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={logNotes}
                onChange={e => setLogNotes(e.target.value)}
                placeholder="Como você se sentiu?"
              />
            </div>

            <Button className="w-full" onClick={logExercise} disabled={!logDuration}>
              Registrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
