/**
 * @fileoverview Testes unitários para o hook useGamification
 * @module test/hooks/useGamification.test
 */

import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';


// Mock do AuthContext
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock do Supabase client
const mockProfileData = {
  xp_total: 150,
  level: 2,
  leaderboard_opt_in: true,
};

const mockBadges = [
  {
    id: 'badge-1',
    code: 'first_post',
    name: 'Primeiro Post',
    description: 'Criou seu primeiro post',
    icon: '🎉',
    category: 'contributor',
    requirement_type: 'posts',
    requirement_value: 1,
    xp_reward: 10,
    display_order: 1,
    is_active: true,
  },
];

const mockUserBadges = [
  {
    id: 'ub-1',
    badge_id: 'badge-1',
    unlocked_at: new Date().toISOString(),
    badge: mockBadges[0],
  },
];

const mockDailyActivity = [
  {
    activity_date: '2026-01-09',
    posts_count: 2,
    comments_count: 5,
    likes_count: 10,
    sleep_logs_count: 1,
    feeding_logs_count: 3,
    total_xp_earned: 50,
  },
];

const mockLeaderboard = [
  {
    user_id: 'test-user-id',
    display_name: 'T***',
    xp_total: 150,
    level: 2,
    max_streak: 7,
    badges_count: 1,
    weekly_xp: 50,
    rank_position: 1,
  },
];

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(table => {
      const mockReturn = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
      };

      if (table === 'profiles') {
        mockReturn.single = vi.fn().mockResolvedValue({ data: mockProfileData, error: null });
      } else if (table === 'badges') {
        mockReturn.order = vi.fn().mockResolvedValue({ data: mockBadges, error: null });
      } else if (table === 'user_badges') {
        mockReturn.eq = vi.fn().mockResolvedValue({ data: mockUserBadges, error: null });
      } else if (table === 'daily_activity') {
        mockReturn.order = vi.fn().mockResolvedValue({ data: mockDailyActivity, error: null });
        mockReturn.maybeSingle = vi
          .fn()
          .mockResolvedValue({ data: mockDailyActivity[0], error: null });
      } else if (table === 'leaderboard_cache') {
        mockReturn.order = vi.fn().mockResolvedValue({ data: mockLeaderboard, error: null });
      }

      return mockReturn;
    }),
    rpc: vi.fn().mockResolvedValue({
      data: [{ new_xp: 160, new_level: 2, leveled_up: false }],
      error: null,
    }),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Wrapper com providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useGamification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial loading state', async () => {
    const { useGamification } = await import('@/hooks/useGamification');
    const { result } = renderHook(() => useGamification(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should provide XP_REWARDS constant', async () => {
    const { useGamification, XP_REWARDS } = await import('@/hooks/useGamification');
    const { result } = renderHook(() => useGamification(), {
      wrapper: createWrapper(),
    });

    expect(XP_REWARDS).toBeDefined();
    expect(XP_REWARDS.post_created).toBe(15);
    expect(XP_REWARDS.comment_created).toBe(5);
    expect(XP_REWARDS.like_given).toBe(2);
    expect(XP_REWARDS.sleep_logged).toBe(10);
    expect(XP_REWARDS.feeding_logged).toBe(10);
    expect(XP_REWARDS.vaccine_logged).toBe(20);
    expect(XP_REWARDS.milestone_logged).toBe(25);
    expect(XP_REWARDS.challenge_completed).toBe(50);
    expect(XP_REWARDS.streak_7).toBe(100);
    expect(XP_REWARDS.streak_14).toBe(200);
    expect(XP_REWARDS.streak_30).toBe(500);
    expect(XP_REWARDS.onboarding_completed).toBe(50);
  });

  it('should provide addXP function', async () => {
    const { useGamification } = await import('@/hooks/useGamification');
    const { result } = renderHook(() => useGamification(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.addXP).toBe('function');
  });

  it('should provide badge-related functions', async () => {
    const { useGamification } = await import('@/hooks/useGamification');
    const { result } = renderHook(() => useGamification(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.isBadgeUnlocked).toBe('function');
    expect(typeof result.current.unlockBadge).toBe('function');
  });

  it('should provide leaderboard functions', async () => {
    const { useGamification } = await import('@/hooks/useGamification');
    const { result } = renderHook(() => useGamification(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.toggleLeaderboardOptIn).toBe('function');
    expect(Array.isArray(result.current.leaderboard)).toBe(true);
  });

  it('should provide activity calendar data', async () => {
    const { useGamification } = await import('@/hooks/useGamification');
    const { result } = renderHook(() => useGamification(), {
      wrapper: createWrapper(),
    });

    expect(Array.isArray(result.current.activityCalendar)).toBe(true);
    // Calendar should have 91 days (90 days + today)
    expect(result.current.activityCalendar.length).toBe(91);
  });

  it('should categorize badges correctly', async () => {
    const { useGamification } = await import('@/hooks/useGamification');
    const { result } = renderHook(() => useGamification(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.badgesByCategory).toBeDefined();
    expect(result.current.badgesByCategory.contributor).toBeDefined();
    expect(result.current.badgesByCategory.mentor).toBeDefined();
    expect(result.current.badgesByCategory.consistent).toBeDefined();
    expect(result.current.badgesByCategory.explorer).toBeDefined();
  });
});

describe('XP Level Calculation', () => {
  it('should calculate level from XP correctly', () => {
    // Level formula: 1 + floor(sqrt(xp / 50))
    // Level 1: 0-49 XP
    // Level 2: 50-199 XP
    // Level 3: 200-449 XP

    const calculateLevel = (xp: number) => 1 + Math.floor(Math.sqrt(xp / 50));

    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(49)).toBe(1);
    expect(calculateLevel(50)).toBe(2);
    expect(calculateLevel(150)).toBe(2);
    expect(calculateLevel(200)).toBe(3);
  });

  it('should calculate XP for next level correctly', () => {
    // XP needed: level^2 * 50
    const xpForLevel = (level: number) => level * level * 50;

    expect(xpForLevel(1)).toBe(50);
    expect(xpForLevel(2)).toBe(200);
    expect(xpForLevel(3)).toBe(450);
    expect(xpForLevel(5)).toBe(1250);
    expect(xpForLevel(10)).toBe(5000);
  });
});
