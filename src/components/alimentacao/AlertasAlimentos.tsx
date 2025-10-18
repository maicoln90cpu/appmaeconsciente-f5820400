import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Info, ChefHat } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

interface FoodAlert {
  id: string;
  food_name: string;
  alert_type: string;
  reason: string;
  trimester_specific: number[] | null;
  alternatives: string[] | null;
}

const ALERT_TYPES = {
  evitar_totalmente: {
    label: "Evitar Totalmente",
    icon: AlertTriangle,
    variant: "destructive" as const,
    color: "text-red-500"
  },
  consumir_moderacao: {
    label: "Consumir com Moderação",
    icon: Info,
    variant: "default" as const,
    color: "text-yellow-500"
  },
  cuidado_preparo: {
    label: "Cuidado no Preparo",
    icon: ChefHat,
    variant: "secondary" as const,
    color: "text-blue-500"
  }
};

export function AlertasAlimentos() {
  const [alerts, setAlerts] = useState<FoodAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useProfile();

  const trimester = profile?.meses_gestacao 
    ? Math.ceil(profile.meses_gestacao / 3) 
    : 1;

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('food_alerts')
        .select('*')
        .eq('is_active', true)
        .order('alert_type')
        .order('food_name');

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const isRelevantForTrimester = (alert: FoodAlert) => {
    if (!alert.trimester_specific || alert.trimester_specific.length === 0) {
      return true; // Aplica a todos os trimestres
    }
    return alert.trimester_specific.includes(trimester);
  };

  const groupedAlerts = alerts.reduce((acc, alert) => {
    if (!isRelevantForTrimester(alert)) return acc;
    
    if (!acc[alert.alert_type]) {
      acc[alert.alert_type] = [];
    }
    acc[alert.alert_type].push(alert);
    return acc;
  }, {} as Record<string, FoodAlert[]>);

  if (loading) {
    return <div className="flex justify-center py-8">Carregando alertas...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Alertas Alimentares</h2>
        <p className="text-muted-foreground">
          Alimentos que requerem atenção durante a gestação ({trimester}º trimestre)
        </p>
      </div>

      {Object.keys(groupedAlerts).length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Em breve teremos alertas alimentares personalizados para sua gestação.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAlerts).map(([alertType, alertsList]) => {
            const config = ALERT_TYPES[alertType as keyof typeof ALERT_TYPES];
            const Icon = config.icon;

            return (
              <div key={alertType}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  <h3 className="text-xl font-semibold">{config.label}</h3>
                  <Badge variant={config.variant}>{alertsList.length}</Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {alertsList.map((alert) => (
                    <Card key={alert.id} className="border-l-4" style={{
                      borderLeftColor: alertType === 'evitar_totalmente' 
                        ? 'hsl(var(--destructive))' 
                        : alertType === 'consumir_moderacao'
                        ? 'hsl(var(--warning))'
                        : 'hsl(var(--primary))'
                    }}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          {alert.food_name}
                          {alert.trimester_specific && alert.trimester_specific.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {alert.trimester_specific.map(t => `${t}º T`).join(', ')}
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-1">
                            Por quê?
                          </p>
                          <p className="text-sm">{alert.reason}</p>
                        </div>

                        {alert.alternatives && alert.alternatives.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-1">
                              Alternativas:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {alert.alternatives.map((alt, index) => (
                                <li key={index}>{alt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Estas são orientações gerais. Sempre consulte seu médico ou nutricionista para recomendações personalizadas baseadas em suas necessidades específicas.
        </AlertDescription>
      </Alert>
    </div>
  );
}
