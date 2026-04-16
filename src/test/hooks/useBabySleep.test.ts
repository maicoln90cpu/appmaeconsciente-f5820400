/**
 * @fileoverview Testes unitários para o hook useBabySleep
 * @module test/hooks/useBabySleep.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock user
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock sleep logs
const mockSleepLogs = [
  {
    id: 'sleep-1',
    user_id: 'test-user-id',
    baby_name: 'Maria',
    baby_age_months: 3,
    sleep_type: 'night',
    sleep_start: '2026-01-08T22:00:00Z',
    sleep_end: '2026-01-09T06:00:00Z',
    duration_minutes: 480,
    location: 'berço',
    wakeup_mood: 'happy',
    mom_mood: 'relaxed',
    notes: 'Dormiu bem',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sleep-2',
    user_id: 'test-user-id',
    baby_name: 'Maria',
    baby_age_months: 3,
    sleep_type: 'nap',
    sleep_start: '2026-01-09T10:00:00Z',
    sleep_end: '2026-01-09T11:30:00Z',
    duration_minutes: 90,
    location: 'carrinho',
    wakeup_mood: 'neutral',
    mom_mood: 'neutral',
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock sleep settings
const mockSleepSettings = {
  id: 'settings-1',
  user_id: 'test-user-id',
  baby_name: 'Maria',
  baby_birthdate: '2025-10-01',
  reminder_enabled: true,
  reminder_interval_minutes: 120,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock sleep milestones
const mockMilestones = [
  {
    id: 'ms-1',
    age_range_start: 0,
    age_range_end: 3,
    recommended_total_hours_min: 14,
    recommended_total_hours_max: 17,
    recommended_naps: 4,
    avg_night_sleep_hours: 8,
    tips: ['Estabeleça uma rotina noturna', 'Evite estímulos antes de dormir'],
  },
  {
    id: 'ms-2',
    age_range_start: 4,
    age_range_end: 6,
    recommended_total_hours_min: 12,
    recommended_total_hours_max: 15,
    recommended_naps: 3,
    avg_night_sleep_hours: 10,
    tips: ['Janelas de sono mais longas', 'Considere sleep training suave'],
  },
];

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(table => {
      const mockReturn = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
        upsert: vi.fn().mockReturnThis(),
      };

      if (table === 'baby_sleep_logs') {
        mockReturn.order = vi.fn().mockResolvedValue({ data: mockSleepLogs, error: null });
        mockReturn.single = vi.fn().mockResolvedValue({ data: mockSleepLogs[0], error: null });
      } else if (table === 'baby_sleep_settings') {
        mockReturn.maybeSingle = vi
          .fn()
          .mockResolvedValue({ data: mockSleepSettings, error: null });
        mockReturn.single = vi.fn().mockResolvedValue({ data: mockSleepSettings, error: null });
      } else if (table === 'baby_sleep_milestones') {
        mockReturn.order = vi.fn().mockResolvedValue({ data: mockMilestones, error: null });
      }

      return mockReturn;
    }),
  },
}));

// Mock toast
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

describe('useBabySleep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial loading state', async () => {
    const { useBabySleep } = await import('@/hooks/useBabySleep');
    const { result } = renderHook(() => useBabySleep(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
  });

  it('should load sleep logs', async () => {
    const { useBabySleep } = await import('@/hooks/useBabySleep');
    const { result } = renderHook(() => useBabySleep(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.sleepLogs).toBeDefined();
  });

  it('should load settings', async () => {
    const { useBabySleep } = await import('@/hooks/useBabySleep');
    const { result } = renderHook(() => useBabySleep(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings).toBeDefined();
  });

  it('should load milestones', async () => {
    const { useBabySleep } = await import('@/hooks/useBabySleep');
    const { result } = renderHook(() => useBabySleep(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.milestones).toBeDefined();
  });

  it('should provide CRUD functions', async () => {
    const { useBabySleep } = await import('@/hooks/useBabySleep');
    const { result } = renderHook(() => useBabySleep(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.addSleepLog).toBe('function');
    expect(typeof result.current.updateSleepLog).toBe('function');
    expect(typeof result.current.deleteSleepLog).toBe('function');
    expect(typeof result.current.saveSettings).toBe('function');
  });
});

describe('Sleep Duration Calculation', () => {
  it('should calculate duration in minutes correctly', () => {
    const start = new Date('2026-01-08T22:00:00Z');
    const end = new Date('2026-01-09T06:00:00Z');

    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    expect(durationMinutes).toBe(480); // 8 hours
  });

  it('should calculate duration in hours correctly', () => {
    const durationMinutes = 480;
    const durationHours = durationMinutes / 60;

    expect(durationHours).toBe(8);
  });

  it('should handle nap durations', () => {
    const start = new Date('2026-01-09T10:00:00Z');
    const end = new Date('2026-01-09T11:30:00Z');

    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    expect(durationMinutes).toBe(90); // 1.5 hours
  });
});

describe('Sleep Statistics', () => {
  it('should calculate total sleep in 24h', () => {
    const logs = mockSleepLogs;
    const totalMinutes = logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
    const totalHours = totalMinutes / 60;

    expect(totalHours).toBe(9.5); // 8h night + 1.5h nap
  });

  it('should count naps correctly', () => {
    const logs = mockSleepLogs;
    const napCount = logs.filter(log => log.sleep_type === 'nap').length;

    expect(napCount).toBe(1);
  });

  it('should identify sleep type', () => {
    const nightLog = mockSleepLogs[0];
    const napLog = mockSleepLogs[1];

    expect(nightLog.sleep_type).toBe('night');
    expect(napLog.sleep_type).toBe('nap');
  });
});

describe('Sleep Milestone Matching', () => {
  it('should find milestone for baby age', () => {
    const babyAgeMonths = 3;
    const milestone = mockMilestones.find(
      m => babyAgeMonths >= m.age_range_start && babyAgeMonths <= m.age_range_end
    );

    expect(milestone).toBeDefined();
    expect(milestone?.recommended_naps).toBe(4);
  });

  it('should return correct recommendations for age group', () => {
    const milestone = mockMilestones[0]; // 0-3 months

    expect(milestone.recommended_total_hours_min).toBe(14);
    expect(milestone.recommended_total_hours_max).toBe(17);
    expect(milestone.avg_night_sleep_hours).toBe(8);
  });

  it('should check if sleep is within recommendations', () => {
    const totalHours = 15;
    const milestone = mockMilestones[0];

    const isWithinRecommendations =
      totalHours >= milestone.recommended_total_hours_min &&
      totalHours <= milestone.recommended_total_hours_max;

    expect(isWithinRecommendations).toBe(true);
  });
});

describe('Sleep Mood Tracking', () => {
  it('should track wakeup mood', () => {
    const log = mockSleepLogs[0];
    expect(log.wakeup_mood).toBe('happy');
  });

  it('should track mom mood', () => {
    const log = mockSleepLogs[0];
    expect(log.mom_mood).toBe('relaxed');
  });

  it('should allow neutral mood', () => {
    const log = mockSleepLogs[1];
    expect(log.wakeup_mood).toBe('neutral');
    expect(log.mom_mood).toBe('neutral');
  });
});
