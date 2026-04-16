import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Scissors,
  AlertTriangle,
  Clock,
  Activity,
  Bed,
  ShieldCheck,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { differenceInWeeks, differenceInDays } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  week: number; // Semana a partir da qual é relevante
  critical?: boolean;
}

const CESAREAN_CHECKLIST: ChecklistItem[] = [
  // Semana 1
  { id: 'rest-week1', label: 'Repouso absoluto (evitar esforços)', week: 1, critical: true },
  { id: 'walk-short', label: 'Caminhadas curtas em casa', week: 1 },
  { id: 'scar-dry', label: 'Manter cicatriz limpa e seca', week: 1, critical: true },
  { id: 'no-lift', label: 'Não carregar peso (exceto bebê)', week: 1, critical: true },
  { id: 'pillow-cough', label: 'Usar travesseiro ao tossir/rir', week: 1 },

  // Semana 2
  { id: 'shower-ok', label: 'Banho normal liberado (secar bem a cicatriz)', week: 2 },
  { id: 'walks-increase', label: 'Aumentar gradualmente as caminhadas', week: 2 },
  { id: 'scar-check', label: 'Verificar sinais de infecção na cicatriz', week: 2, critical: true },

  // Semana 3-4
  { id: 'light-housework', label: 'Atividades domésticas leves permitidas', week: 3 },
  { id: 'postpartum-visit', label: 'Consulta pós-parto com obstetra', week: 4, critical: true },
  { id: 'drive-check', label: 'Verificar se pode dirigir (com liberação médica)', week: 4 },

  // Semana 6+
  { id: 'exercise-light', label: 'Exercícios leves (com liberação médica)', week: 6 },
  { id: 'pelvic-floor', label: 'Iniciar exercícios de assoalho pélvico', week: 6 },
  { id: 'intimacy-ok', label: 'Relações íntimas liberadas (com conforto)', week: 6 },
  { id: 'scar-massage', label: 'Massagem na cicatriz (após cicatrização)', week: 8 },
  { id: 'full-exercise', label: 'Exercícios moderados permitidos', week: 8 },
];

const WARNING_SIGNS = [
  'Febre acima de 38°C',
  'Vermelhidão ou inchaço na cicatriz',
  'Secreção com odor ou pus',
  'Dor intensa que não melhora',
  'Sangramento vaginal intenso',
  'Dificuldade para urinar',
];

export const CesareanRecoveryChecklist = () => {
  const { profile } = useProfile();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showAllItems, setShowAllItems] = useState(false);
  const [warningsOpen, setWarningsOpen] = useState(true);

  // Calcular semana pós-parto
  const getPostpartumWeek = () => {
    if (!profile?.delivery_date) return 0;
    const weeks = differenceInWeeks(new Date(), new Date(profile.delivery_date));
    return Math.max(0, weeks + 1); // +1 para começar da semana 1
  };

  const postpartumWeek = getPostpartumWeek();
  const postpartumDays = profile?.delivery_date
    ? differenceInDays(new Date(), new Date(profile.delivery_date))
    : 0;

  // Carregar itens salvos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cesarean-checklist');
    if (saved) {
      setCheckedItems(new Set(JSON.parse(saved)));
    }
  }, []);

  // Salvar no localStorage
  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      localStorage.setItem('cesarean-checklist', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  // Filtrar itens relevantes para a semana atual
  const relevantItems = CESAREAN_CHECKLIST.filter(
    item => showAllItems || item.week <= postpartumWeek + 1
  );

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
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Scissors className="h-5 w-5" />
              Recuperação Pós-Cesárea
            </CardTitle>
            <Badge variant="outline" className="bg-purple-100 text-purple-700">
              Semana {postpartumWeek || 1}
            </Badge>
          </div>
          <CardDescription className="text-purple-600/80 dark:text-purple-400/80">
            {postpartumDays > 0
              ? `${postpartumDays} dias desde o parto`
              : 'Configure a data do parto para acompanhar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {completedCount} de {relevantItems.length} itens
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Alertas de sinais de perigo */}
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

      {/* Checklist agrupado por semana */}
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
                    }`}
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
                      {item.critical && !checkedItems.has(item.id) && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Importante
                        </Badge>
                      )}
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dicas específicas para cesárea */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Dicas para sua Recuperação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Bed className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Posição para Levantar</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Role para o lado, depois use os braços para sentar. Evite usar os músculos
                abdominais.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Caminhadas</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Caminhe devagar mas caminhe! Ajuda na circulação e previne trombose.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Scissors className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Cuidado com a Cicatriz</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Lave com água e sabão neutro, seque bem. Não use pomadas sem orientação médica.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Roupas Confortáveis</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Use calcinhas de cintura alta que não pressione a cicatriz. Prefira tecidos de
                algodão.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
