import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Gift } from "lucide-react";
import { useState } from "react";
import { ToolSuggestionDialog } from "./ToolSuggestionDialog";

export const ToolSuggestionCard = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-all">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Sugira uma Nova Ferramenta!</CardTitle>
              <CardDescription className="mt-1">
                Compartilhe suas ideias e ajude a melhorar a plataforma
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-accent/50 border border-accent">
            <div className="flex items-start gap-2">
              <Gift className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">🎁 Ganhe 3 meses gratuitos!</p>
                <p className="text-muted-foreground mt-1">
                  Se sua ideia for aprovada e você compartilhar o site com uma gestante que se cadastrar,
                  você ganha <strong>3 meses de acesso premium grátis</strong> a todas as ferramentas!
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Tem uma ideia de ferramenta que seria útil para você ou outras mães? 
              Queremos ouvir! Conte-nos sobre:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Qual problema a ferramenta resolveria</li>
              <li>• Quais funcionalidades você imagina</li>
              <li>• Em que fase da gestação/pós-parto seria útil</li>
              <li>• Que integrações seriam importantes</li>
            </ul>
          </div>

          <Button 
            onClick={() => setDialogOpen(true)}
            className="w-full"
            size="lg"
          >
            <Lightbulb className="mr-2 h-5 w-5" />
            Enviar Minha Sugestão
          </Button>
        </CardContent>
      </Card>

      <ToolSuggestionDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};
