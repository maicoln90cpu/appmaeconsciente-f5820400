import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GenerateNutritionButtonProps {
  onSuccess?: () => void;
  hasExistingContent?: boolean;
}

export function GenerateNutritionButton({ onSuccess, hasExistingContent }: GenerateNutritionButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-nutrition-plan');

      if (error) throw error;

      toast({
        title: "✨ Plano gerado com sucesso!",
        description: `${data.data.meal_plans_count} refeições, ${data.data.recipes_count} receitas e ${data.data.exercises_count} exercícios criados.`,
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Error generating nutrition plan:', error);
      toast({
        title: "Erro ao gerar plano",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setShowConfirmDialog(false);
    }
  };

  const handleClick = () => {
    if (hasExistingContent) {
      setShowConfirmDialog(true);
    } else {
      handleGenerate();
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isGenerating}
        size="lg"
        className="gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Gerando plano personalizado...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            {hasExistingContent ? 'Regenerar Plano com IA' : 'Gerar Plano Personalizado'}
          </>
        )}
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerar plano nutricional?</AlertDialogTitle>
            <AlertDialogDescription>
              Você já possui um plano nutricional. Ao regenerar:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Novos planos alimentares, receitas e exercícios serão criados</li>
                <li>Seus itens personalizados não serão removidos</li>
                <li>Você pode editar ou excluir itens depois</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerate}>
              Regenerar com IA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}