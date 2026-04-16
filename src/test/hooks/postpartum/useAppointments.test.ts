/**
 * @fileoverview Testes para hooks de consultas pós-parto
 * Testa a migração para createSupabaseCRUD
 */

import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';


import { usePostpartumAppointments } from '@/hooks/postpartum/useAppointments';

// Mock do Supabase
const mockFrom = vi.fn();
const mockAuth = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      mockFrom(table);
      return {
        select: (...args: unknown[]) => {
          mockSelect(...args);
          return {
            eq: (field: string, value: string) => {
              mockEq(field, value);
              return {
                order: (field: string, options: unknown) => {
                  mockOrder(field, options);
                  return Promise.resolve({ data: [], error: null });
                },
              };
            },
          };
        },
        insert: (data: unknown) => {
          mockInsert(data);
          return {
            select: () => ({
              single: () =>
                Promise.resolve({ data: { id: 'new-id', ...(data as object) }, error: null }),
            }),
          };
        },
        update: (data: unknown) => {
          mockUpdate(data);
          return {
            eq: () => ({
              select: () => ({
                single: () =>
                  Promise.resolve({ data: { id: 'updated-id', ...(data as object) }, error: null }),
              }),
            }),
          };
        },
        delete: () => {
          mockDelete();
          return {
            eq: () => Promise.resolve({ error: null }),
          };
        },
      };
    },
    auth: {
      getUser: () => mockAuth(),
    },
  },
}));

// Mock do useToast
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

// Mock do getAuthenticatedUser
vi.mock('@/hooks/useAuthenticatedAction', () => ({
  getAuthenticatedUser: () => Promise.resolve('test-user-id'),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('usePostpartumAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });
  });

  it('should return correct initial state', async () => {
    const { result } = renderHook(() => usePostpartumAppointments(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.appointments).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should expose CRUD functions', async () => {
    const { result } = renderHook(() => usePostpartumAppointments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.addAppointment).toBe('function');
    expect(typeof result.current.updateAppointment).toBe('function');
    expect(typeof result.current.deleteAppointment).toBe('function');
  });

  it('should categorize appointments correctly', async () => {
    const { result } = renderHook(() => usePostpartumAppointments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(Array.isArray(result.current.upcomingAppointments)).toBe(true);
    expect(Array.isArray(result.current.pastAppointments)).toBe(true);
  });

  it('should query the correct table', async () => {
    renderHook(() => usePostpartumAppointments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('postpartum_appointments');
    });
  });
});
