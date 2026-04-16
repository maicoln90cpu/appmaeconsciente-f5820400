import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";

export const DatabaseTab = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Banco de Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg font-medium">Visão Geral, Tabelas, Triggers, Cron Jobs, Edge Functions</p>
            <p className="text-sm">5 sub-abas internas serão implementadas na Etapa 4</p>
            <Badge variant="outline" className="mt-2">Em construção</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
