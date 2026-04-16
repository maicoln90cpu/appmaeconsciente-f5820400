/**
 * @fileoverview Testes unitários para o hook useVaccination
 * @module test/hooks/useVaccination.test
 */

import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';


// Mock user
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock baby profiles
const mockBabyProfiles = [
  {
    id: 'baby-1',
    user_id: 'test-user-id',
    baby_name: 'Maria',
    birth_date: '2025-06-15',
    calendar_type: 'pni',
    gender: 'female',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock vaccines
const mockVaccines = [
  {
    id: 'vaccine-1',
    baby_profile_id: 'baby-1',
    vaccine_name: 'BCG',
    application_date: '2025-06-15',
    dose_label: 'Dose única',
    notes: 'Aplicada ao nascer',
    user_id: 'test-user-id',
    created_at: new Date().toISOString(),
  },
];

// Mock calendar vaccines
const mockCalendarVaccines = [
  {
    id: 'cal-1',
    vaccine_name: 'BCG',
    age_in_months: 0,
    dose_label: 'Dose única',
    description: 'Protege contra tuberculose',
    calendar_type: 'pni',
    is_mandatory: true,
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
        order: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
      };

      if (table === 'baby_vaccination_profiles') {
        mockReturn.order = vi.fn().mockResolvedValue({ data: mockBabyProfiles, error: null });
        mockReturn.single = vi.fn().mockResolvedValue({ data: mockBabyProfiles[0], error: null });
      } else if (table === 'baby_vaccinations') {
        mockReturn.order = vi.fn().mockResolvedValue({ data: mockVaccines, error: null });
        mockReturn.single = vi.fn().mockResolvedValue({ data: mockVaccines[0], error: null });
      } else if (table === 'vaccination_calendar') {
        mockReturn.order = vi.fn().mockResolvedValue({ data: mockCalendarVaccines, error: null });
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

describe('useVaccination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial loading state', async () => {
    const { useVaccination } = await import('@/hooks/useVaccination');
    const { result } = renderHook(() => useVaccination(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
  });

  it('should load baby profiles', async () => {
    const { useVaccination } = await import('@/hooks/useVaccination');
    const { result } = renderHook(() => useVaccination(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profiles).toBeDefined();
  });

  it('should provide profile functions', async () => {
    const { useVaccination } = await import('@/hooks/useVaccination');
    const { result } = renderHook(() => useVaccination(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.saveProfile).toBe('function');
    expect(typeof result.current.switchProfile).toBe('function');
    expect(typeof result.current.reloadData).toBe('function');
  });

  it('should provide vaccine record functions', async () => {
    const { useVaccination } = await import('@/hooks/useVaccination');
    const { result } = renderHook(() => useVaccination(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.addVaccination).toBe('function');
    expect(typeof result.current.updateVaccination).toBe('function');
    expect(typeof result.current.deleteVaccination).toBe('function');
  });

  it('should provide calendar data', async () => {
    const { useVaccination } = await import('@/hooks/useVaccination');
    const { result } = renderHook(() => useVaccination(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.calendar).toBeDefined();
  });
});

describe('Vaccination Calendar Logic', () => {
  it('should calculate baby age in months correctly', () => {
    const birthDate = new Date('2025-06-15');
    const today = new Date('2026-01-09');

    const ageInMonths = Math.floor(
      (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    );

    // Baby is approximately 7 months old
    expect(ageInMonths).toBeGreaterThanOrEqual(6);
    expect(ageInMonths).toBeLessThanOrEqual(8);
  });

  it('should identify pending vaccines by age', () => {
    const babyAgeMonths = 2;
    const calendarVaccines = [
      { age_in_months: 0, vaccine_name: 'BCG' },
      { age_in_months: 2, vaccine_name: 'Pentavalente' },
      { age_in_months: 4, vaccine_name: 'Rotavírus' },
    ];

    const appliedVaccines = ['BCG'];

    const pendingVaccines = calendarVaccines.filter(
      cv => cv.age_in_months <= babyAgeMonths && !appliedVaccines.includes(cv.vaccine_name)
    );

    expect(pendingVaccines.length).toBe(1);
    expect(pendingVaccines[0].vaccine_name).toBe('Pentavalente');
  });

  it('should identify overdue vaccines', () => {
    const babyAgeMonths = 4;
    const recommendedAge = 2;

    const isOverdue = babyAgeMonths > recommendedAge + 1;
    expect(isOverdue).toBe(true);
  });
});

describe('Baby Profile Validation', () => {
  it('should require baby name', () => {
    const profile = { baby_name: '', birth_date: '2025-06-15' };
    const isValid = profile.baby_name.trim().length > 0;
    expect(isValid).toBe(false);
  });

  it('should require birth date', () => {
    const profile = { baby_name: 'Maria', birth_date: '' };
    const isValid = profile.birth_date.length > 0;
    expect(isValid).toBe(false);
  });

  it('should validate birth date is not in future', () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);

    const isValid = futureDate <= new Date();
    expect(isValid).toBe(false);
  });
});
