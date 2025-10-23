import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface GenerateMealPlanButtonProps {
  onSuccess: () => void;
}

export function GenerateMealPlanButton({ onSuccess }: GenerateMealPlanButtonProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    setLoading(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const { error } = await supabase.functions.invoke('generate-meal-plan', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      toast.success("Plano alimentar gerado com sucesso!");
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao gerar plano:', error);
      toast.error(error.message || "Erro ao gerar plano alimentar");
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
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <Utensils className="mr-2 h-4 w-4" />
            Gerar Plano Semanal
          </>
        )}
      </Button>
      {loading && (
        <div className="space-y-1">
          <Progress value={progress} />
          <p className="text-xs text-center text-muted-foreground">
            {progress < 30 && "Analisando perfil..."}
            {progress >= 30 && progress < 60 && "Calculando necessidades..."}
            {progress >= 60 && progress < 90 && "Gerando recomendações..."}
            {progress >= 90 && "Finalizando..."}
          </p>
        </div>
      )}
    </div>
  );
}