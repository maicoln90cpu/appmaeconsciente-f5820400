import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const DashboardBebeQuickActions = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
        <CardDescription>Registre novos eventos rapidamente</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button 
          onClick={() => navigate('/materiais/rastreador-amamentacao')}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          Registrar Mamada
        </Button>
        <Button 
          onClick={() => navigate('/materiais/diario-sono')}
          variant="outline"
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          Registrar Sono
        </Button>
      </CardContent>
    </Card>
  );
};
