import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

export const UserLoading = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
    </div>
    <div className="flex items-center justify-center p-12">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Carregando usuários...</p>
      </div>
    </div>
  </div>
);

interface UserErrorProps {
  error: Error;
  onRetry: () => void;
}

export const UserError = ({ error, onRetry }: UserErrorProps) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
    </div>
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-12">
        <div className="text-destructive mb-4 text-4xl">⚠️</div>
        <h3 className="text-lg font-semibold mb-2">Erro ao carregar usuários</h3>
        <p className="text-muted-foreground text-center mb-4">
          {error?.message || "Ocorreu um erro desconhecido"}
        </p>
        <Button onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      </CardContent>
    </Card>
  </div>
);
