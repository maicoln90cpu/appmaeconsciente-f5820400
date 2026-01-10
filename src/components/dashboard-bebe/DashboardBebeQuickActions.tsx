import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const DashboardBebeQuickActions = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-base sm:text-lg">Ações Rápidas</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Registre novos eventos rapidamente</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col xs:flex-row gap-2 sm:gap-3">
        <Button 
          onClick={() => navigate('/materiais/rastreador-amamentacao')}
          className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 shrink-0" />
          <span className="truncate">Registrar Mamada</span>
        </Button>
        <Button 
          onClick={() => navigate('/materiais/diario-sono')}
          variant="outline"
          className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 shrink-0" />
          <span className="truncate">Registrar Sono</span>
        </Button>
      </CardContent>
    </Card>
  );
};
