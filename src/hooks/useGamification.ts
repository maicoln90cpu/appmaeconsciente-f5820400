/**
 * @fileoverview Hook para gerenciamento de gamificação expandida (composto)
 * @module hooks/useGamification
 *
 * Este hook agora é um wrapper que compõe os hooks individuais de gamificação.
 * Para uso específico, prefira usar os hooks individuais:
 * - useUserLevel: nível e XP
 * - useBadges: badges e conquistas
 * - useLeaderboard: ranking
 * - useDailyActivity: atividade diária e calendário
 */

import { useBadges } from './gamification/useBadges';
import { useDailyActivity } from './gamification/useDailyActivity';
import { useLeaderboard } from './gamification/useLeaderboard';
import { useUserLevel, XP_REWARDS } from './gamification/useUserLevel';

// Re-exportar tipos para compatibilidade
export type { UserLevel } from './gamification/useUserLevel';
export type { Badge, UserBadge } from './gamification/useBadges';
export type { LeaderboardEntry } from './gamification/useLeaderboard';
export type { DailyActivity, ActivityCalendarDay } from './gamification/useDailyActivity';
export { XP_REWARDS };

/**
 * Hook composto que reúne todas as funcionalidades de gamificação.
 * Mantido para compatibilidade com código existente.
 */
export const useGamification = () => {
  const { levelData, isLoading: loadingLevel, addXP, XP_REWARDS: xpRewards } = useUserLevel();

  const {
    allBadges,
    userBadges,
    badgesByCategory,
    isBadgeUnlocked,
    unlockBadge,
    isLoading: loadingBadges,
  } = useBadges();

  const {
    leaderboard,
    leaderboardOptIn,
    userRank,
    toggleLeaderboardOptIn,
    isLoading: loadingLeaderboard,
  } = useLeaderboard();

  const {
    dailyActivity,
    activityCalendar,
    recordDailyActivity,
    isLoading: loadingActivity,
  } = useDailyActivity();

  return {
    // Nível e XP
    levelData,
    addXP,

    // Badges
    allBadges,
    userBadges,
    badgesByCategory,
    isBadgeUnlocked,
    unlockBadge,

    // Atividade
    dailyActivity,
    activityCalendar,
    recordDailyActivity,

    // Leaderboard
    leaderboard,
    leaderboardOptIn,
    toggleLeaderboardOptIn,
    userRank,

    // Loading states
    isLoading: loadingLevel || loadingBadges || loadingActivity || loadingLeaderboard,

    // Constantes
    XP_REWARDS: xpRewards,
  };
};
