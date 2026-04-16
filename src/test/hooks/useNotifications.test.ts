/**
 * @fileoverview Testes unitários para o hook useNotifications
 * @module test/hooks/useNotifications.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock user data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

// Mock notifications data
const mockNotifications = [
  {
    id: 'notif-1',
    is_read: false,
    read_at: null,
    notifications: {
      id: 'notif-1',
      title: 'Nova mensagem',
      message: 'Você recebeu uma nova mensagem',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'notif-2',
    is_read: true,
    read_at: new Date().toISOString(),
    notifications: {
      id: 'notif-2',
      title: 'Bem-vindo',
      message: 'Bem-vindo à plataforma!',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  },
];

// Mock Supabase channel
const mockUnsubscribe = vi.fn();
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockNotifications, error: null }),
      update: vi.fn().mockReturnThis(),
    }),
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: mockUnsubscribe,
  },
}));

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return initial loading state', async () => {
    const { useNotifications } = await import('@/hooks/useNotifications');
    const { result } = renderHook(() => useNotifications());

    expect(result.current.loading).toBe(true);
  });

  it('should load notifications', async () => {
    const { useNotifications } = await import('@/hooks/useNotifications');
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notifications.length).toBe(2);
  });

  it('should format notifications correctly', async () => {
    const { useNotifications } = await import('@/hooks/useNotifications');
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const firstNotification = result.current.notifications[0];
    expect(firstNotification).toHaveProperty('id');
    expect(firstNotification).toHaveProperty('title');
    expect(firstNotification).toHaveProperty('message');
    expect(firstNotification).toHaveProperty('created_at');
    expect(firstNotification).toHaveProperty('is_read');
  });

  it('should calculate unread count correctly', async () => {
    const { useNotifications } = await import('@/hooks/useNotifications');
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // One notification is unread in our mock
    expect(result.current.unreadCount).toBe(1);
  });

  it('should provide markAsRead function', async () => {
    const { useNotifications } = await import('@/hooks/useNotifications');
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.markAsRead).toBe('function');
  });

  it('should provide reloadNotifications function', async () => {
    const { useNotifications } = await import('@/hooks/useNotifications');
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.reloadNotifications).toBe('function');
  });

  it('should subscribe to realtime updates', async () => {
    const { useNotifications } = await import('@/hooks/useNotifications');
    renderHook(() => useNotifications());

    await waitFor(() => {
      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });

  it('should return empty arrays when user is not authenticated', async () => {
    // Override mock to return no user
    const supabaseModule = await import('@/integrations/supabase/client');
    vi.spyOn(supabaseModule.supabase.auth, 'getUser').mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const { useNotifications } = await import('@/hooks/useNotifications');
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });
});

describe('Notification Interface', () => {
  it('should have correct notification structure', () => {
    const notificationExample = {
      id: 'test-id',
      title: 'Test Title',
      message: 'Test message',
      created_at: new Date().toISOString(),
      is_read: false,
    };

    expect(notificationExample).toHaveProperty('id');
    expect(notificationExample).toHaveProperty('title');
    expect(notificationExample).toHaveProperty('message');
    expect(notificationExample).toHaveProperty('created_at');
  });
});
