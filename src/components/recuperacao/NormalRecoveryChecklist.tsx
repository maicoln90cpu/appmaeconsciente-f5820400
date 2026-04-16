import { useState, useEffect } from 'react';

import { differenceInWeeks, differenceInDays } from 'date-fns';
import {
  Heart,
  AlertTriangle,
  Clock,
  Activity,
  Flower2,
  ShieldCheck,
  Droplets,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';


import { useProfile } from '@/hooks/useProfile';


interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  week: number;
  critical?: boolean;
  episiotomy?: boolean; // Específico para episiotomia
}

const NORMAL_CHECKLIST: ChecklistItem[] = [
  // Semana 1
  { id: 'rest-recover', label: 'Descansar sempre que possível', week: 1 },
  {
    id: 'perineum-care',
    label: 'Cuidados com o períneo (banho de assento)',
    week: 1,
    critical: true,
  },
  { id: 'kegel-gentle', label: 'Exercícios de Kegel gentis (se confortável)', week: 1 },
  { id: 'lochia-monitor', label: 'Monitorar sangramento (lóquios)', week: 1, critical: true },
  { id: 'hydrate', label: 'Manter boa hidratação', week: 1 },

  // Semana 1-2 (Episiotomia)
  {
    id: 'episio-clean',
    label: 'Limpar região da episiotomia após urinar',
    week: 1,
    episiotomy: true,
  },
  { id: 'episio-dry', label: 'Secar bem a região dos pontos', week: 1, episiotomy: true },
  {
    id: 'episio-sitz',
    label: 'Banho de assento 2-3x ao dia',
    week: 1,
    episiotomy: true,
    critical: true,
  },

  // Semana 2
  { id: 'walks-short', label: 'Caminhadas curtas diárias', week: 2 },
  { id: 'pelvic-awareness', label: 'Perceber músculos do assoalho pélvico', week: 2 },
  { id: 'bleeding-decrease', label: 'Sangramento diminuindo gradualmente', week: 2 },

  // Semana 3-4
  { id: 'light-activity', label: 'Retomar atividades leves em casa', week: 3 },
  { id: 'postpartum-visit', label: 'Consulta pós-parto com obstetra', week: 4, critical: true },
  { id: 'kegel-regular', label: 'Exercícios de Kegel regulares', week: 4 },

  // Semana 6+
  { id: 'exercise-start', label: 'Exercícios leves (com liberação médica)', week: 6 },
  { id: 'intimacy-ready', label: 'Relações íntimas quando se sentir pronta', week: 6 },
  { id: 'pelvic-physio', label: 'Avaliar fisioterapia pélvica se necessário', week: 6 },
  { id: 'full-activity', label: 'Retorno gradual a atividades normais', week: 8 },
];

const WARNING_SIGNS = [
  'Febre acima de 38°C',
  'Sangramento intenso (encharca absorvente em 1h)',
  'Coágulos grandes (maiores que uma laranja)',
  'Dor intensa no períneo que piora',
  'Secreção com mau cheiro',
  'Dificuldade para urinar ou evacuar',
  'Incontinência urinária persistente',
];

const KEGEL_EXERCISES = [
  {
    step: 1,
    instruction: 'Identifique os músculos do assoalho pélvico (como se fosse segurar o xixi)',
  },
  { step: 2, instruction: 'Contraia por 3-5 segundos' },
  { step: 3, instruction: 'Relaxe por 3-5 segundos' },
  { step: 4, instruction: 'Repita 10-15 vezes' },
  { step: 5, instruction: 'Faça 3 séries por dia' },
];

export const NormalRecoveryChecklist = () => {
  const { profile } = useProfile();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showAllItems, setShowAllItems] = useState(false);
  const [hasEpisiotomy, setHasEpisiotomy] = useState(false);
  const [warningsOpen, setWarningsOpen] = useState(true);
  const [kegelOpen, setKegelOpen] = useState(false);

  const getPostpartumWeek = () => {
    if (!profile?.delivery_date) return 0;
    const weeks = differenceInWeeks(new Date(), new Date(profile.delivery_date));
    return Math.max(0, weeks + 1);
  };

  const postpartumWeek = getPostpartumWeek();
  const postpartumDays = profile?.delivery_date
    ? differenceInDays(new Date(), new Date(profile.delivery_date))
    : 0;

  useEffect(() => {
    const saved = localStorage.getItem('normal-checklist');
    const savedEpisio = localStorage.getItem('has-episiotomy');
    if (saved) {
      setCheckedItems(new Set(JSON.parse(saved)));
    }
    if (savedEpisio) {
      setHasEpisiotomy(JSON.parse(savedEpisio));
    }
  }, []);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      localStorage.setItem('normal-checklist', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const toggleEpisiotomy = () => {
    setHasEpisiotomy(!hasEpisiotomy);
    localStorage.setItem('has-episiotomy', JSON.stringify(!hasEpisiotomy));
  };

  // Filtrar itens relevantes
  const relevantItems = NORMAL_CHECKLIST.filter(item => {
    const weekMatch = showAllItems || item.week <= postpartumWeek + 1;
    const episioMatch = !item.episiotomy || hasEpisiotomy;
    return weekMatch && episioMatch;
  });

  const completedCount = relevantItems.filter(item => checkedItems.has(item.id)).length;
  const progress =
    relevantItems.length > 0 ? Math.round((completedCount / relevantItems.length) * 100) : 0;

  // Agrupar por semana
  const groupedItems = relevantItems.reduce(
    (acc, item) => {
      const weekLabel =
        item.week <= 1
          ? 'Semana 1'
          : item.week <= 2
            ? 'Semana 2'
            : item.week <= 4
              ? 'Semanas 3-4'
              : 'Semanas 6+';

      if (!acc[weekLabel]) acc[weekLabel] = [];
      acc[weekLabel].push(item);
      return acc;
    },
    {} as Record<string, ChecklistItem[]>
  );

  return (
    <div className="space-y-4">
      {/* Header com progresso */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Heart className="h-5 w-5" />
              Recuperação Pós-Parto Normal
            </CardTitle>
            <Badge variant="outline" className="bg-green-100 text-green-700">
              Semana {postpartumWeek || 1}
            </Badge>
          </div>
          <CardDescription className="text-green-600/80 dark:text-green-400/80">
            {postpartumDays > 0
              ? `${postpartumDays} dias desde o parto`
              : 'Configure a data do parto para acompanhar'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {completedCount} de {relevantItems.length} itens
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Toggle Episiotomia */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-black/20">
            <Checkbox
              id="has-episiotomy"
              checked={hasEpisiotomy}
              onCheckedChange={toggleEpisiotomy}
            />
            <Label htmlFor="has-episiotomy" className="text-sm cursor-pointer">
              Tive episiotomia (pontos no períneo)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      <Collapsible open={warningsOpen} onOpenChange={setWarningsOpen}>
        <CollapsibleTrigger asChild>
          <Alert variant="destructive" className="cursor-pointer hover:bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              Sinais de Alerta - Procure Ajuda
              {warningsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </AlertTitle>
          </Alert>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2 border-destructive/50">
            <CardContent className="pt-4">
              <ul className="grid gap-2 md:grid-cols-2">
                {WARNING_SIGNS.map((sign, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-destructive">⚠️</span>
                    {sign}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Checklist */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Checklist de Recuperação
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowAllItems(!showAllItems)}>
              {showAllItems ? 'Ver relevantes' : 'Ver todos'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedItems).map(([weekLabel, items]) => (
            <div key={weekLabel}>
              <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {weekLabel}
              </h4>
              <div className="space-y-3">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                      checkedItems.has(item.id)
                        ? 'bg-green-50 dark:bg-green-950/20'
                        : 'hover:bg-muted/50'
                    } ${item.episiotomy ? 'border-l-2 border-pink-300' : ''}`}
                  >
                    <Checkbox
                      id={item.id}
                      checked={checkedItems.has(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="mt-0.5"
                    />
                    <Label htmlFor={item.id} className="flex-1 cursor-pointer">
                      <span
                        className={`${checkedItems.has(item.id) ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {item.label}
                      </span>
                      {item.episiotomy && (
                        <Badge variant="outline" className="ml-2 text-xs bg-pink-50 text-pink-600">
                          Episiotomia
                        </Badge>
                      )}
                      {item.critical && !checkedItems.has(item.id) && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Importante
                        </Badge>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Exercícios de Kegel */}
      <Collapsible open={kegelOpen} onOpenChange={setKegelOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Flower2 className="h-5 w-5 text-pink-500" />
                  Exercícios de Kegel
                </span>
                {kegelOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CardTitle>
              <CardDescription>
                Fortalecem o assoalho pélvico e ajudam na recuperação
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {KEGEL_EXERCISES.map(exercise => (
                  <div key={exercise.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                      {exercise.step}
                    </div>
                    <p className="text-sm flex-1">{exercise.instruction}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Dicas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            Cuidados com o Períneo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-3 rounded-lg bg-muted/50">
              <span className="font-medium text-sm">Banho de Assento</span>
              <p className="text-sm text-muted-foreground mt-1">
                Água morna por 10-15 min, 2-3x ao dia. Ajuda na cicatrização e alivia desconforto.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <span className="font-medium text-sm">Compressa Fria</span>
              <p className="text-sm text-muted-foreground mt-1">
                Nos primeiros dias, compressa fria ajuda a reduzir inchaço. Use por 10-20 min.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <span className="font-medium text-sm">Posição para Amamentar</span>
              <p className="text-sm text-muted-foreground mt-1">
                Use almofada de amamentação. Evite sentar diretamente sobre o períneo.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <span className="font-medium text-sm">Higiene</span>
              <p className="text-sm text-muted-foreground mt-1">
                Use chuveirinho após ir ao banheiro. Seque delicadamente sem esfregar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
