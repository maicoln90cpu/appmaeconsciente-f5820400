/**
 * @fileoverview Barrel export para hooks de gamificação
 * @module hooks/gamification
 */

export { useUserLevel, XP_REWARDS } from './useUserLevel';
export type { UserLevel } from './useUserLevel';

export { useBadges } from './useBadges';
export type { Badge, UserBadge } from './useBadges';

export { useLeaderboard } from './useLeaderboard';
export type { LeaderboardEntry } from './useLeaderboard';

export { useDailyActivity } from './useDailyActivity';
export type { DailyActivity, ActivityCalendarDay } from './useDailyActivity';

// Re-exportação do hook composto para compatibilidade
export { useGamification } from '../useGamification';
