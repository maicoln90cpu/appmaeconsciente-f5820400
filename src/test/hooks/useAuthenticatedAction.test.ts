import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAuthenticatedAction, getAuthenticatedUser } from '@/hooks/useAuthenticatedAction';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('sonner', () => ({
  toast: Object.assign(mockToast, { error: mockToast, success: mockToast }),
}));

import { supabase } from '@/integrations/supabase/client';

describe('useAuthenticatedAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserId', () => {
    it('should return user id when authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      } as any);

      const { result } = renderHook(() => useAuthenticatedAction());

      let userId: string | null = null;
      await act(async () => {
        userId = await result.current.getUserId();
      });

      expect(userId).toBe('test-user-id');
    });

    it('should return null when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const { result } = renderHook(() => useAuthenticatedAction());

      let userId: string | null = 'initial';
      await act(async () => {
        userId = await result.current.getUserId();
      });

      expect(userId).toBeNull();
    });
  });

  describe('executeAuthenticated', () => {
    it('should execute action with userId when authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      } as any);

      const mockAction = vi.fn().mockResolvedValue('action-result');
      const { result } = renderHook(() => useAuthenticatedAction());

      let actionResult: string | null = null;
      await act(async () => {
        actionResult = await result.current.executeAuthenticated(mockAction);
      });

      expect(mockAction).toHaveBeenCalledWith('test-user-id');
      expect(actionResult).toBe('action-result');
    });

    it('should show toast and return null when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const mockAction = vi.fn();
      const { result } = renderHook(() => useAuthenticatedAction());

      let actionResult: unknown = 'initial';
      await act(async () => {
        actionResult = await result.current.executeAuthenticated(mockAction);
      });

      expect(mockAction).not.toHaveBeenCalled();
      expect(actionResult).toBeNull();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Não autenticado',
          variant: 'destructive',
        })
      );
    });

    it('should not show toast when silentError is true', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const { result } = renderHook(() => useAuthenticatedAction());

      await act(async () => {
        await result.current.executeAuthenticated(vi.fn(), { silentError: true });
      });

      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should use custom error message when provided', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const { result } = renderHook(() => useAuthenticatedAction());

      await act(async () => {
        await result.current.executeAuthenticated(vi.fn(), {
          errorMessage: 'Custom error message',
        });
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Custom error message',
        })
      );
    });
  });

  describe('requireAuth', () => {
    it('should return userId when authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      } as any);

      const { result } = renderHook(() => useAuthenticatedAction());

      let userId: string = '';
      await act(async () => {
        userId = await result.current.requireAuth();
      });

      expect(userId).toBe('test-user-id');
    });

    it('should throw error when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const { result } = renderHook(() => useAuthenticatedAction());

      await expect(
        act(async () => {
          await result.current.requireAuth();
        })
      ).rejects.toThrow('Not authenticated');
    });
  });
});

describe('getAuthenticatedUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user id when authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    } as any);

    const userId = await getAuthenticatedUser();
    expect(userId).toBe('test-user-id');
  });

  it('should throw error when not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    await expect(getAuthenticatedUser()).rejects.toThrow('Not authenticated');
  });
});
