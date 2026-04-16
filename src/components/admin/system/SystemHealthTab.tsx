import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

export const SystemHealthTab = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Saúde do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg font-medium">Painel de Saúde</p>
            <p className="text-sm">10 painéis colapsáveis serão implementados na Etapa 2</p>
            <Badge variant="outline" className="mt-2">Em construção</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
