import { useState } from 'react';

import { Loader2, ChefHat } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import { useAbortController, isAbortError } from '@/hooks/useAbortController';

import { supabase } from '@/integrations/supabase/client';

interface GenerateRecipesButtonProps {
  onSuccess: () => void;
  onNeedsProfile?: () => void;
  needsProfile?: boolean;
}

export function GenerateRecipesButton({
  onSuccess,
  onNeedsProfile,
  needsProfile,
}: GenerateRecipesButtonProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const getSignal = useAbortController();

  const handleGenerate = async () => {
    if (needsProfile && onNeedsProfile) {
      onNeedsProfile();
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const signal = getSignal();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-recipes`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          signal,
        }
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      toast.success('Receitas geradas com sucesso!');
      onSuccess();
    } catch (error: any) {
      if (isAbortError(error)) return;
      console.error('Erro ao gerar receitas:', error);

      if (
        error.message?.includes('Limite de gerações atingido') ||
        error.message?.includes('429')
      ) {
        toast.error('Limite semanal atingido', {
          description: 'Você já gerou receitas esta semana. Tente novamente na próxima semana.',
        });
      } else if (
        error.message?.includes('Unauthorized') ||
        error.message?.includes('Não autenticado')
      ) {
        toast.error('Sessão expirada', {
          description: 'Faça login novamente para continuar.',
        });
      } else {
        toast.error('Erro ao gerar receitas', {
          description: error.message || 'Tente novamente em alguns instantes.',
        });
      }
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleGenerate} disabled={loading} variant="outline" className="w-full">
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
