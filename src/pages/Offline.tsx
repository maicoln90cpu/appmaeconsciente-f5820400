import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Offline = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-4">
              <WifiOff className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <CardTitle>Sem Conexão</CardTitle>
          <CardDescription>
            Você está offline no momento. Algumas funcionalidades podem não estar disponíveis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Não se preocupe! Seus dados salvos continuam disponíveis. Quando sua conexão retornar,
            tudo será sincronizado automaticamente.
          </p>
          <Button onClick={handleRetry} className="w-full">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Offline;
