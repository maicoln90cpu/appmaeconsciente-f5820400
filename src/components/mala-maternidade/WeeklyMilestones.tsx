import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Milestone {
  id: string;
  week: number;
  title: string;
  description: string;
  tasks: {
    id: string;
    text: string;
    completed: boolean;
  }[];
  priority: 'baixa' | 'media' | 'alta';
}

interface WeeklyMilestonesProps {
  currentWeek: number;
  onMilestoneUpdate?: (milestoneId: string, taskId: string, completed: boolean) => void;
}

const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: 'week-28',
    week: 28,
    title: 'Início do Planejamento',
    description: 'Comece a pesquisar o que levar',
    priority: 'baixa',
    tasks: [
      { id: 'w28-1', text: 'Fazer lista inicial de itens necessários', completed: false },
      { id: 'w28-2', text: 'Pesquisar o que o hospital fornece', completed: false },
      {
        id: 'w28-3',
        text: 'Verificar regras do hospital (visitas, acompanhante)',
        completed: false,
      },
    ],
  },
  {
    id: 'week-32',
    week: 32,
    title: 'Preparação das Roupinhas',
    description: 'Hora de lavar e organizar as roupas',
    priority: 'media',
    tasks: [
      { id: 'w32-1', text: 'Lavar roupinhas do bebê com sabão neutro', completed: false },
      { id: 'w32-2', text: 'Separar roupas por tamanho (RN, P)', completed: false },
      { id: 'w32-3', text: 'Preparar fraldas de boca e paninhos', completed: false },
      { id: 'w32-4', text: 'Verificar se tem roupas de saída para bebê', completed: false },
    ],
  },
  {
    id: 'week-34',
    week: 34,
    title: 'Mala do Bebê',
    description: 'Monte a mala do bebê',
    priority: 'alta',
    tasks: [
      { id: 'w34-1', text: 'Separar 6-8 mudas de roupa (bodies + macacões)', completed: false },
      { id: 'w34-2', text: 'Incluir gorrinhos e luvas', completed: false },
      { id: 'w34-3', text: 'Preparar manta ou cueiro', completed: false },
      { id: 'w34-4', text: 'Fraldas RN (1 pacote pequeno)', completed: false },
      { id: 'w34-5', text: 'Lenços umedecidos', completed: false },
    ],
  },
  {
    id: 'week-35',
    week: 35,
    title: 'Mala da Mãe',
    description: 'Monte sua própria mala',
    priority: 'alta',
    tasks: [
      { id: 'w35-1', text: 'Camisolas ou pijamas com abertura frontal', completed: false },
      { id: 'w35-2', text: 'Sutiãs de amamentação', completed: false },
      {
        id: 'w35-3',
        text: 'Calcinhas confortáveis (de preferência descartáveis)',
        completed: false,
      },
      { id: 'w35-4', text: 'Absorventes pós-parto', completed: false },
      { id: 'w35-5', text: 'Itens de higiene pessoal', completed: false },
      { id: 'w35-6', text: 'Chinelo e roupão', completed: false },
    ],
  },
  {
    id: 'week-36',
    week: 36,
    title: 'Documentação',
    description: 'Organize todos os documentos',
    priority: 'alta',
    tasks: [
      { id: 'w36-1', text: 'Documentos pessoais (RG, CPF)', completed: false },
      { id: 'w36-2', text: 'Carteira do pré-natal', completed: false },
      { id: 'w36-3', text: 'Carteira do plano de saúde', completed: false },
      { id: 'w36-4', text: 'Exames recentes (ultrassons, tipo sanguíneo)', completed: false },
      { id: 'w36-5', text: 'Plano de parto (se tiver)', completed: false },
    ],
  },
  {
    id: 'week-37',
    week: 37,
    title: 'Revisão Final',
    description: 'Confira se tudo está pronto',
    priority: 'alta',
    tasks: [
      { id: 'w37-1', text: 'Revisar todas as malas', completed: false },
      { id: 'w37-2', text: 'Deixar malas em local de fácil acesso', completed: false },
      { id: 'w37-3', text: 'Informar família/acompanhante sobre localização', completed: false },
      { id: 'w37-4', text: 'Carregar celular com carregador na mala', completed: false },
      { id: 'w37-5', text: 'Verificar cadeirinha no carro', completed: false },
    ],
  },
  {
    id: 'week-38',
    week: 38,
    title: 'Últimos Ajustes',
    description: 'Tudo pronto para o grande dia!',
    priority: 'alta',
    tasks: [
      { id: 'w38-1', text: 'Adicionar itens de última hora', completed: false },
      { id: 'w38-2', text: 'Confirmar rota até o hospital', completed: false },
      { id: 'w38-3', text: 'Ter telefones de emergência anotados', completed: false },
    ],
  },
];

export const WeeklyMilestones = ({ currentWeek, onMilestoneUpdate }: WeeklyMilestonesProps) => {
  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    const saved = localStorage.getItem('mala-milestones');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_MILESTONES;
      }
    }
    return DEFAULT_MILESTONES;
  });

  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(() => {
    // Expand current and next milestone by default
    const toExpand = new Set<string>();
    const current = milestones.find(m => m.week <= currentWeek);
    const next = milestones.find(m => m.week > currentWeek);
    if (current) toExpand.add(current.id);
    if (next) toExpand.add(next.id);
    return toExpand;
  });

  useEffect(() => {
    localStorage.setItem('mala-milestones', JSON.stringify(milestones));
  }, [milestones]);

  const handleTaskToggle = (milestoneId: string, taskId: string) => {
    setMilestones(prev =>
      prev.map(milestone => {
        if (milestone.id !== milestoneId) return milestone;
        return {
          ...milestone,
          tasks: milestone.tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          ),
        };
      })
    );

    const milestone = milestones.find(m => m.id === milestoneId);
    const task = milestone?.tasks.find(t => t.id === taskId);
    if (task) {
      onMilestoneUpdate?.(milestoneId, taskId, !task.completed);
    }
  };

  const toggleMilestone = (id: string) => {
    setExpandedMilestones(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getMilestoneStatus = (
    milestone: Milestone
  ): 'pendente' | 'em_andamento' | 'concluido' | 'atrasado' => {
    const completedTasks = milestone.tasks.filter(t => t.completed).length;
    const totalTasks = milestone.tasks.length;

    if (completedTasks === totalTasks) return 'concluido';
    if (milestone.week < currentWeek && completedTasks < totalTasks) return 'atrasado';
    if (completedTasks > 0) return 'em_andamento';
    return 'pendente';
  };

  const getStatusBadge = (status: string, priority: string) => {
    switch (status) {
      case 'concluido':
        return (
          <Badge variant="default" className="bg-success text-success-foreground">
            Concluído ✓
          </Badge>
        );
      case 'atrasado':
        return <Badge variant="destructive">Atrasado!</Badge>;
      case 'em_andamento':
        return <Badge variant="secondary">Em andamento</Badge>;
      default:
        return priority === 'alta' ? (
          <Badge variant="outline" className="border-warning text-warning">
            Prioridade Alta
          </Badge>
        ) : (
          <Badge variant="outline">Pendente</Badge>
        );
    }
  };

  const totalTasks = milestones.reduce((sum, m) => sum + m.tasks.length, 0);
  const completedTasks = milestones.reduce(
    (sum, m) => sum + m.tasks.filter(t => t.completed).length,
    0
  );
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const currentMilestone =
    milestones.find(m => m.week === currentWeek) ||
    milestones.filter(m => m.week <= currentWeek).pop();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Cronograma de Preparação
            </CardTitle>
            <CardDescription>
              Semana atual: {currentWeek} | Marcos de preparação até a semana 38
            </CardDescription>
          </div>
          {progressPercent === 100 && (
            <Badge className="bg-success text-success-foreground">
              <Sparkles className="h-3 w-3 mr-1" />
              Tudo Pronto!
            </Badge>
          )}
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso geral</span>
            <span className="font-medium">
              {completedTasks}/{totalTasks} tarefas
            </span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {milestones.map(milestone => {
          const status = getMilestoneStatus(milestone);
          const isExpanded = expandedMilestones.has(milestone.id);
          const isCurrent = milestone.week === currentMilestone?.week;
          const isPast = milestone.week < currentWeek;
          const isFuture = milestone.week > currentWeek;
          const completedCount = milestone.tasks.filter(t => t.completed).length;

          return (
            <Collapsible
              key={milestone.id}
              open={isExpanded}
              onOpenChange={() => toggleMilestone(milestone.id)}
            >
              <Card
                className={`border-l-4 ${
                  status === 'concluido'
                    ? 'border-l-success bg-success/5'
                    : status === 'atrasado'
                      ? 'border-l-destructive bg-destructive/5'
                      : isCurrent
                        ? 'border-l-primary bg-primary/5'
                        : 'border-l-muted'
                }`}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full p-4 h-auto justify-between">
                    <div className="flex items-center gap-3 text-left">
                      <div
                        className={`
                        flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold
                        ${
                          status === 'concluido'
                            ? 'bg-success/20 text-success'
                            : status === 'atrasado'
                              ? 'bg-destructive/20 text-destructive'
                              : isCurrent
                                ? 'bg-primary/20 text-primary'
                                : 'bg-muted text-muted-foreground'
                        }
                      `}
                      >
                        {status === 'concluido' ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : status === 'atrasado' ? (
                          <AlertTriangle className="h-5 w-5" />
                        ) : (
                          <span>{milestone.week}</span>
                        )}
                      </div>

                      <div>
                        <div className="font-medium flex items-center gap-2">
                          Semana {milestone.week}: {milestone.title}
                          {isCurrent && (
                            <Badge variant="outline" className="text-xs">
                              Atual
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {milestone.description} • {completedCount}/{milestone.tasks.length}{' '}
                          tarefas
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(status, milestone.priority)}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-0 space-y-2">
                    {milestone.tasks.map(task => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 p-2 rounded-md ${
                          task.completed ? 'bg-success/10' : 'bg-muted/50'
                        }`}
                      >
                        <Checkbox
                          id={task.id}
                          checked={task.completed}
                          onCheckedChange={() => handleTaskToggle(milestone.id, task.id)}
                        />
                        <label
                          htmlFor={task.id}
                          className={`flex-1 text-sm cursor-pointer ${
                            task.completed ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {task.text}
                        </label>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};
