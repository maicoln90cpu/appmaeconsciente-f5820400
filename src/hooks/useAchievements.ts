import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAchievements = () => {
  const [checking, setChecking] = useState(false);
  const { toast } = useToast();

  const checkAndUnlockAchievements = async () => {
    if (checking) return;
    
    try {
      setChecking(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar progresso
      const { data: progress } = await supabase
        .from("user_achievement_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!progress) return;

      // Buscar conquistas já desbloqueadas
      const { data: unlocked } = await supabase
        .from("user_achievements")
        .select("achievement_code")
        .eq("user_id", user.id);

      const unlockedCodes = unlocked?.map(a => a.achievement_code) || [];

      // Verificar e desbloquear novas conquistas
      const achievementsToUnlock: { code: string; name: string }[] = [];

      if (progress.has_sleep_master && !unlockedCodes.includes('sleep_master')) {
        achievementsToUnlock.push({ code: 'sleep_master', name: 'Mestre do Sono' });
      }

      if (progress.has_feeding_queen && !unlockedCodes.includes('feeding_queen')) {
        achievementsToUnlock.push({ code: 'feeding_queen', name: 'Rainha da Amamentação' });
      }

      if (progress.has_savings_master && !unlockedCodes.includes('savings_master')) {
        achievementsToUnlock.push({ code: 'savings_master', name: 'Economista Consciente' });
      }

      if (progress.has_organizer_expert && !unlockedCodes.includes('organizer_expert')) {
        achievementsToUnlock.push({ code: 'organizer_expert', name: 'Organizadora Expert' });
      }

      if (progress.has_peaceful_nights && !unlockedCodes.includes('peaceful_nights')) {
        achievementsToUnlock.push({ code: 'peaceful_nights', name: 'Noites Tranquilas' });
      }

      if (progress.has_first_week && !unlockedCodes.includes('first_week')) {
        achievementsToUnlock.push({ code: 'first_week', name: 'Primeira Semana' });
      }

      if (progress.has_complete_bag && !unlockedCodes.includes('complete_bag')) {
        achievementsToUnlock.push({ code: 'complete_bag', name: 'Mala Completa' });
      }

      // Inserir novas conquistas
      for (const achievement of achievementsToUnlock) {
        await supabase.from("user_achievements").insert({
          user_id: user.id,
          achievement_code: achievement.code,
        });

        // Mostrar toast de conquista desbloqueada
        toast({
          title: "🏆 Nova Conquista Desbloqueada!",
          description: achievement.name,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error checking achievements:", error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Verificar conquistas ao montar o componente
    checkAndUnlockAchievements();

    // Verificar periodicamente (a cada 30 segundos)
    const interval = setInterval(checkAndUnlockAchievements, 30000);

    return () => clearInterval(interval);
  }, []);

  return { checkAchievements: checkAndUnlockAchievements };
};
