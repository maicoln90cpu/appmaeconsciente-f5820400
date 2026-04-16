import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Share2,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type Urgency = 'high' | 'medium' | 'low';

interface Document {
  type: string;
  label: string;
  deadline: string;
  description: string;
  urgency: Urgency;
}

const DOCUMENTS: Document[] = [
  {
    type: 'certidao_nascimento',
    label: 'Certidão de Nascimento',
    deadline: 'Até 15 dias após o nascimento',
    description:
      'Vá ao Cartório de Registro Civil mais próximo com: DNV (Declaração de Nascido Vivo), RG e CPF dos pais, Certidão de Casamento ou Declaração de União Estável.',
    urgency: 'high',
  },
  {
    type: 'cpf',
    label: 'CPF do Bebê',
    deadline: 'Após a Certidão de Nascimento',
    description:
      'Pode ser feito gratuitamente nas agências do Banco do Brasil, Caixa Econômica ou Correios. Leve a Certidão de Nascimento e documento dos pais.',
    urgency: 'high',
  },
  {
    type: 'sus',
    label: 'Cartão do SUS',
    deadline: 'O quanto antes',
    description:
      'Vá a uma Unidade Básica de Saúde (UBS) com a Certidão de Nascimento, CPF do bebê e comprovante de residência.',
    urgency: 'high',
  },
  {
    type: 'plano_saude',
    label: 'Inclusão no Plano de Saúde',
    deadline: 'Até 30 dias do nascimento',
    description:
      'Entre em contato com a operadora do plano. Geralmente pedem: Certidão de Nascimento, CPF, DNV e declaração do hospital.',
    urgency: 'medium',
  },
  {
    type: 'vacina',
    label: 'Caderneta de Vacinação',
    deadline: 'Ao nascer',
    description:
      'Entregue na maternidade junto com as primeiras vacinas (BCG e Hepatite B). Guarde com cuidado — será usada em toda a infância.',
    urgency: 'high',
  },
  {
    type: 'rg',
    label: 'RG / Carteira de Identidade',
    deadline: 'Sem prazo obrigatório',
    description:
      'Procure o órgão emissor do seu estado (Poupatempo, Detran, etc). Leve Certidão de Nascimento e CPF do bebê.',
    urgency: 'low',
  },
  {
    type: 'passaporte',
    label: 'Passaporte',
    deadline: 'Se necessário para viagem',
    description:
      'Agende pela Polícia Federal (gov.br). Ambos os pais devem comparecer com o bebê. Leve: Certidão de Nascimento, RG, CPF e foto 5x7.',
    urgency: 'low',
  },
  {
    type: 'registro_civil',
    label: 'Registro na Receita Federal (dependente)',
    deadline: 'Até a declaração de IR',
    description:
      'Inclua o bebê como dependente na sua declaração de Imposto de Renda. Necessário: CPF do bebê e Certidão de Nascimento.',
    urgency: 'low',
  },
];

const URGENCY_CONFIG: Record<
  Urgency,
  { label: string; color: string; borderColor: string; bgColor: string; icon: typeof AlertTriangle }
> = {
  high: {
    label: 'Urgente',
    color: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-300 dark:border-red-700',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    icon: AlertTriangle,
  },
  medium: {
    label: 'Atenção',
    color: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-300 dark:border-amber-700',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    icon: Clock,
  },
  low: {
    label: 'Sem pressa',
    color: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-300 dark:border-green-700',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    icon: CheckCircle2,
  },
};

const ChecklistDocumentos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('baby_documents_checklist')
        .select('document_type, completed')
        .eq('user_id', user.id);

      if (data) {
        const map: Record<string, boolean> = {};
        data.forEach(d => {
          map[d.document_type] = d.completed;
        });
        setItems(map);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const toggle = async (docType: string) => {
    if (!user) return;
    const newVal = !items[docType];
    setItems(prev => ({ ...prev, [docType]: newVal }));

    const doc = DOCUMENTS.find(d => d.type === docType)!;
    const { data: existing } = await supabase
      .from('baby_documents_checklist')
      .select('id')
      .eq('user_id', user.id)
      .eq('document_type', docType)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('baby_documents_checklist')
        .update({
          completed: newVal,
          completed_at: newVal ? new Date().toISOString() : null,
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('baby_documents_checklist').insert({
        user_id: user.id,
        document_type: docType,
        document_label: doc.label,
        description: doc.description,
        deadline_info: doc.deadline,
        completed: newVal,
        completed_at: newVal ? new Date().toISOString() : null,
      });
    }
    toast.success(newVal ? '✅ Marcado como concluído' : 'Desmarcado');
  };

  const handleSharePending = () => {
    const pending = DOCUMENTS.filter(d => !items[d.type]);
    if (pending.length === 0) {
      toast.success('🎉 Todos os documentos já foram providenciados!');
      return;
    }

    const text = `📋 Documentos do Bebê — Pendentes\n\n${pending.map((d, i) => `${i + 1}. ${d.label} — ${d.deadline}`).join('\n')}\n\nPreciso de ajuda com esses! 💕`;

    if (navigator.share) {
      navigator.share({ title: 'Documentos do Bebê - Pendentes', text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Lista copiada! Cole onde quiser compartilhar.');
    }
  };

  const completed = Object.values(items).filter(Boolean).length;
  const progress = (completed / DOCUMENTS.length) * 100;

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/materiais')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Documentos do Bebê</h1>
          <p className="text-sm text-muted-foreground">Checklist passo-a-passo com prioridades</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSharePending} className="gap-1.5">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Compartilhar</span>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {completed} de {DOCUMENTS.length} concluídos
            </span>
            <span className="font-bold">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Legenda de urgência */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(['high', 'medium', 'low'] as Urgency[]).map(u => {
          const cfg = URGENCY_CONFIG[u];
          const Icon = cfg.icon;
          return (
            <span key={u} className={`flex items-center gap-1 ${cfg.color}`}>
              <Icon className="h-3.5 w-3.5" />
              {cfg.label}
            </span>
          );
        })}
      </div>

      <div className="space-y-3">
        {DOCUMENTS.map(doc => {
          const urgCfg = URGENCY_CONFIG[doc.urgency];
          const isDone = items[doc.type];
          const UrgIcon = urgCfg.icon;

          return (
            <Card
              key={doc.type}
              className={`transition-all ${isDone ? 'opacity-60 border-green-200 dark:border-green-800' : urgCfg.borderColor}`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isDone || false}
                    onCheckedChange={() => toggle(doc.type)}
                    className="mt-1"
                    disabled={loading}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-medium ${isDone ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {doc.label}
                      </span>
                      {!isDone && (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${urgCfg.bgColor} ${urgCfg.color}`}
                        >
                          <UrgIcon className="h-3 w-3" />
                          {urgCfg.label}
                        </span>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {doc.deadline}
                      </Badge>
                    </div>

                    <button
                      onClick={() => setExpanded(expanded === doc.type ? null : doc.type)}
                      className="text-xs text-primary mt-1 flex items-center gap-1 hover:underline"
                    >
                      {expanded === doc.type ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      {expanded === doc.type ? 'Menos detalhes' : 'Ver detalhes'}
                    </button>

                    {expanded === doc.type && (
                      <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-3 rounded-lg">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ChecklistDocumentos;
