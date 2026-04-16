import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/hooks/useProfile';
import { Loader2, Baby, Scissors, Heart, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInWeeks } from 'date-fns';

type DeliveryType = 'normal' | 'cesarean' | 'forceps' | 'vacuum';

export const DeliveryTypeSelector = () => {
  const { profile, updateProfile, loading } = useProfile();
  const [deliveryType, setDeliveryType] = useState<DeliveryType | undefined>();
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.delivery_type) {
        setDeliveryType(profile.delivery_type as DeliveryType);
        setIsConfigured(true);
      }
      if (profile.delivery_date) {
        setDeliveryDate(profile.delivery_date);
      }
    }
  }, [profile]);

  const handleSave = async () => {
    if (!deliveryType) {
      toast.error('Selecione o tipo de parto');
      return;
    }

    setSaving(true);
    try {
      const { error } = await updateProfile({
        delivery_type: deliveryType,
        delivery_date: deliveryDate || undefined,
      });

      if (error) {
        toast.error('Erro ao salvar');
      } else {
        toast.success('Configurações salvas!');
        setIsConfigured(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const getPostpartumWeek = () => {
    if (!deliveryDate) return null;
    const weeks = differenceInWeeks(new Date(), new Date(deliveryDate));
    return weeks >= 0 ? weeks : null;
  };

  const postpartumWeek = getPostpartumWeek();

  const getDeliveryTypeInfo = (type: DeliveryType) => {
    switch (type) {
      case 'normal':
        return {
          icon: <Heart className="h-5 w-5" />,
          label: 'Parto Normal/Vaginal',
          description: 'Recuperação mais rápida, foco no períneo e assoalho pélvico',
          color: 'bg-green-100 text-green-700',
        };
      case 'cesarean':
        return {
          icon: <Scissors className="h-5 w-5" />,
          label: 'Cesárea',
          description: 'Cuidados com a cicatriz, repouso mais longo, retorno gradual às atividades',
          color: 'bg-purple-100 text-purple-700',
        };
      case 'forceps':
        return {
          icon: <Baby className="h-5 w-5" />,
          label: 'Fórceps',
          description: 'Atenção extra ao períneo, possível episiotomia, recuperação intermediária',
          color: 'bg-blue-100 text-blue-700',
        };
      case 'vacuum':
        return {
          icon: <Baby className="h-5 w-5" />,
          label: 'Vácuo Extrator',
          description: 'Similar ao parto normal, com atenção ao períneo',
          color: 'bg-teal-100 text-teal-700',
        };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Se já configurado, mostrar resumo compacto
  if (isConfigured && deliveryType) {
    const info = getDeliveryTypeInfo(deliveryType);
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${info.color}`}>{info.icon}</div>
              <div>
                <p className="font-medium">{info.label}</p>
                {postpartumWeek !== null && (
                  <p className="text-sm text-muted-foreground">
                    Semana {postpartumWeek + 1} de recuperação
                  </p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsConfigured(false)}>
              Editar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Baby className="h-5 w-5 text-primary" />
          Tipo de Parto
        </CardTitle>
        <CardDescription>
          Configure para receber orientações personalizadas de recuperação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={deliveryType}
          onValueChange={value => setDeliveryType(value as DeliveryType)}
        >
          {(['normal', 'cesarean', 'forceps', 'vacuum'] as DeliveryType[]).map(type => {
            const info = getDeliveryTypeInfo(type);
            return (
              <div
                key={type}
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                  deliveryType === type ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value={type} id={type} className="mt-1" />
                <Label htmlFor={type} className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`p-1 rounded ${info.color}`}>{info.icon}</span>
                    <span className="font-medium">{info.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        <div className="space-y-2">
          <Label htmlFor="delivery-date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Data do Parto
          </Label>
          <Input
            id="delivery-date"
            type="date"
            value={deliveryDate}
            onChange={e => setDeliveryDate(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
          />
          <p className="text-xs text-muted-foreground">
            Usada para calcular sua semana de recuperação
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving || !deliveryType} className="w-full">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configurações'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
