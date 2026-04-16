import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

export const GtmDiagnosticTab = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            GTM / Diagnóstico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg font-medium">Verificação automática do Google Tag Manager</p>
            <p className="text-sm">Será implementado na Etapa 5</p>
            <Badge variant="outline" className="mt-2">Em construção</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
