import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface OnboardingStep {
  key: string;
  title: string;
  description: string;
  icon: string;
  path?: string;
  checkCondition?: () => Promise<boolean>;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    key: 'complete_profile',
    title: 'Completar perfil',
    description: 'Adicione suas informações pessoais',
    icon: '👤',
    path: '/configuracoes',
  },
  {
    key: 'add_enxoval_item',
    title: 'Adicionar item ao enxoval',
    description: 'Comece a organizar seu enxoval',
    icon: '🛍️',
    path: '/materiais/controle-enxoval',
  },
  {
    key: 'register_feeding',
    title: 'Registrar primeira mamada',
    description: 'Acompanhe a alimentação do bebê',
    icon: '🍼',
    path: '/materiais/rastreador-amamentacao',
  },
  {
    key: 'register_sleep',
    title: 'Registrar primeiro sono',
    description: 'Monitore o sono do bebê',
    icon: '😴',
    path: '/materiais/diario-sono',
  },
  {
    key: 'join_community',
    title: 'Entrar na comunidade',
    description: 'Conecte-se com outras mães',
    icon: '👥',
    path: '/comunidade',
  },
];

interface OnboardingProgress {
  id: string;
  user_id: string;
  step_key: string;
  completed_at: string;
  created_at: string;
}

export const useOnboarding = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar completed steps from database
  const { data: completedSteps = [], isLoading } = useQuery({
    queryKey: ['onboarding-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('id, user_id, step_key, completed_at, created_at')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data as OnboardingProgress[]).map(item => item.step_key);
    },
    enabled: !!user?.id,
  });

  // Mark step as complete
  const completeStepMutation = useMutation({
    mutationFn: async (stepKey: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase.from('onboarding_progress').upsert(
        {
          user_id: user.id,
          step_key: stepKey,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,step_key' }
      );

      if (error) throw error;
      return stepKey;
    },
    onSuccess: stepKey => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });

      const step = ONBOARDING_STEPS.find(s => s.key === stepKey);
      if (step) {
        toast('Passo completado! 🎉', { description: step.title });
      }

      // Verificar if all steps are complete
      const newCompletedSteps = [...completedSteps, stepKey];
      if (newCompletedSteps.length === ONBOARDING_STEPS.length) {
        completeOnboarding();
      }
    },
  });

  // Complete entire onboarding with XP and Badge
  const completeOnboarding = async () => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (!error) {
      // Award XP for completing onboarding
      try {
        await supabase.rpc('add_user_xp', {
          p_user_id: user.id,
          p_xp_amount: 50,
          p_action_type: 'onboarding_completed',
        });
      } catch (xpError) {
        console.error('Failed to add onboarding XP:', xpError);
      }

      // Unlock "Bem-vinda!" badge
      try {
        const { data: badge } = await supabase
          .from('badges')
          .select('id')
          .eq('code', 'bem_vinda')
          .single();

        if (badge) {
          await supabase.from('user_badges').upsert(
            {
              user_id: user.id,
              badge_id: badge.id,
            },
            { onConflict: 'user_id,badge_id' }
          );
        }
      } catch (badgeError) {
        console.error('Failed to unlock badge:', badgeError);
      }

      toast('Parabéns! 🏆', {
        description: "Você completou o onboarding! +50 XP e Badge 'Bem-vinda!' desbloqueado!",
      });

      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-level'] });
      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
    }
  };

  // Pular onboarding
  const skipOnboarding = async () => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  };

  // Calcular progress
  const progress = (completedSteps.length / ONBOARDING_STEPS.length) * 100;
  const isComplete = completedSteps.length === ONBOARDING_STEPS.length;

  // Obter steps with completion status
  const stepsWithStatus = ONBOARDING_STEPS.map(step => ({
    ...step,
    completed: completedSteps.includes(step.key),
  }));

  return {
    steps: stepsWithStatus,
    completedSteps,
    progress,
    isComplete,
    isLoading,
    completeStep: completeStepMutation.mutate,
    isCompleting: completeStepMutation.isPending,
    skipOnboarding,
  };
};
