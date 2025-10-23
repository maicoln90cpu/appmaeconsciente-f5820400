import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ChefHat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface GenerateRecipesButtonProps {
  onSuccess: () => void;
  onNeedsProfile?: () => void;
  needsProfile?: boolean;
}

export function GenerateRecipesButton({ onSuccess, onNeedsProfile, needsProfile }: GenerateRecipesButtonProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    if (needsProfile && onNeedsProfile) {
      onNeedsProfile();
      return;
    }
    
    setLoading(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const { error } = await supabase.functions.invoke('generate-recipes', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      toast.success("Receitas geradas com sucesso!");
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao gerar receitas:', error);
      
      // Tratamento específico para rate limiting
      if (error.message?.includes('Limite de gerações atingido') || error.message?.includes('429')) {
        toast.error("Limite diário atingido", {
          description: "Você já gerou 3 receitas hoje. Tente novamente amanhã.",
        });
      } else if (error.message?.includes('Unauthorized')) {
        toast.error("Sessão expirada", {
          description: "Faça login novamente para continuar.",
        });
      } else {
        toast.error("Erro ao gerar receitas", {
          description: error.message || "Tente novamente em alguns instantes.",
        });
      }
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-2">
      <Button 
        onClick={handleGenerate} 
        disabled={loading}
        variant="outline"
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <ChefHat className="mr-2 h-4 w-4" />
            Gerar Receitas
          </>
        )}
      </Button>
      {loading && (
        <div className="space-y-1">
          <Progress value={progress} />
          <p className="text-xs text-center text-muted-foreground">
            Criando receitas personalizadas...
          </p>
        </div>
      )}
    </div>
  );
}