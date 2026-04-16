import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

export const ObservabilityTab = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Observabilidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg font-medium">SLA, Custos IA, Erros, Performance, Web Vitals</p>
            <p className="text-sm">Será implementado na Etapa 3</p>
            <Badge variant="outline" className="mt-2">Em construção</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
