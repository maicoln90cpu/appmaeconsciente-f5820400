import { useProfile } from '@/hooks/useProfile';
import { DeliveryTypeSelector } from './DeliveryTypeSelector';
import { CesareanRecoveryChecklist } from './CesareanRecoveryChecklist';
import { NormalRecoveryChecklist } from './NormalRecoveryChecklist';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Baby, Info } from 'lucide-react';

export const DeliveryTypeContent = () => {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const deliveryType = profile?.delivery_type;

  return (
    <div className="space-y-6">
      {/* Seletor de Tipo de Parto */}
      <DeliveryTypeSelector />

      {/* Conteúdo Personalizado */}
      {!deliveryType ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-muted-foreground" />
              Configure seu Tipo de Parto
            </CardTitle>
            <CardDescription>
              Selecione acima o tipo de parto para ver orientações personalizadas de recuperação.
              Cada tipo tem cuidados específicos que vão ajudar na sua jornada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border bg-purple-50/50 dark:bg-purple-950/20">
                <h4 className="font-medium mb-2 text-purple-700 dark:text-purple-300">
                  🔪 Cesárea
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Cuidados com cicatriz</li>
                  <li>• Repouso mais prolongado</li>
                  <li>• Retorno gradual a atividades</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg border bg-green-50/50 dark:bg-green-950/20">
                <h4 className="font-medium mb-2 text-green-700 dark:text-green-300">
                  💚 Parto Normal
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Cuidados com o períneo</li>
                  <li>• Exercícios de Kegel</li>
                  <li>• Recuperação mais rápida</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : deliveryType === 'cesarean' ? (
        <CesareanRecoveryChecklist />
      ) : (
        <NormalRecoveryChecklist />
      )}
    </div>
  );
};
