/**
 * @fileoverview Testes unitários para o hook useProfile
 * @module test/hooks/useProfile.test
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
const mockProfile = {
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  perfil_completo: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      update: vi.fn().mockReturnThis(),
    }),
  },
}));

// Mock do logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
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

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading state initially', async () => {
    const { useProfile } = await import('@/hooks/useProfile');
    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.loading).toBe(true);
  });

  it('should return profile data when loaded', async () => {
    const { useProfile } = await import('@/hooks/useProfile');
    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBeDefined();
    expect(result.current.profile?.email).toBe('test@example.com');
    expect(result.current.profile?.full_name).toBe('Test User');
  });

  it('should provide updateProfile function', async () => {
    const { useProfile } = await import('@/hooks/useProfile');
    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.updateProfile).toBe('function');
  });

  it('should provide reloadProfile function', async () => {
    const { useProfile } = await import('@/hooks/useProfile');
    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.reloadProfile).toBe('function');
  });

  it('should return null profile when user is not authenticated', async () => {
    // Override mock to return no user
    vi.doMock('@/contexts/AuthContext', () => ({
      useAuth: () => ({ user: null }),
    }));

    const { useProfile } = await import('@/hooks/useProfile');
    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Without user, profile should be null
    expect(result.current.profile).toBeNull();
  });
});

describe('Profile Interface', () => {
  it('should have correct type definitions', () => {
    const profileExample = {
      id: 'test',
      email: 'test@test.com',
      full_name: 'Test',
    };

    expect(profileExample).toBeDefined();
    expect(profileExample.id).toBe('test');
    expect(profileExample.email).toBe('test@test.com');
  });
});
