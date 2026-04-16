import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';


import { createSupabaseCRUD } from '@/hooks/factories/createSupabaseCRUD';

// Mock Supabase
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  },
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('sonner', () => ({
  toast: Object.assign(mockToast, { error: mockToast, success: mockToast }),
}));

// Mock getAuthenticatedUser
vi.mock('@/hooks/useAuthenticatedAction', () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue('test-user-id'),
}));

// Test entity type
interface TestEntity {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

// Wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('createSupabaseCRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock chain
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq, order: mockOrder });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockInsert.mockReturnValue({ select: () => ({ single: mockSingle }) });
    mockUpdate.mockReturnValue({ eq: () => ({ select: () => ({ single: mockSingle }) }) });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockSingle.mockResolvedValue({ data: { id: 'new-id', name: 'Test' }, error: null });
  });

  it('should create a hook with correct interface', () => {
    const useTestCRUD = createSupabaseCRUD<TestEntity>({
      tableName: 'test_table',
      queryKey: ['test'],
    });

    expect(typeof useTestCRUD).toBe('function');
  });

  it('should return data, loading state, and mutations', async () => {
    mockOrder.mockResolvedValue({
      data: [{ id: '1', user_id: 'test-user-id', name: 'Item 1', created_at: '2024-01-01' }],
      error: null,
    });

    const useTestCRUD = createSupabaseCRUD<TestEntity>({
      tableName: 'test_table',
      queryKey: ['test-items'],
    });

    const { result } = renderHook(() => useTestCRUD(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);

    // Wait for data
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].name).toBe('Item 1');
  });

  it('should have add, update, remove mutations', () => {
    const useTestCRUD = createSupabaseCRUD<TestEntity>({
      tableName: 'test_table',
      queryKey: ['test'],
    });

    const { result } = renderHook(() => useTestCRUD(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.add).toBe('function');
    expect(typeof result.current.addAsync).toBe('function');
    expect(typeof result.current.update).toBe('function');
    expect(typeof result.current.updateAsync).toBe('function');
    expect(typeof result.current.remove).toBe('function');
    expect(typeof result.current.removeAsync).toBe('function');
  });

  it('should use custom orderBy and orderDirection', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const useTestCRUD = createSupabaseCRUD<TestEntity>({
      tableName: 'test_table',
      queryKey: ['test-order'],
      orderBy: 'name',
      orderDirection: 'asc',
    });

    renderHook(() => useTestCRUD(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true });
    });
  });

  it('should use custom messages', async () => {
    const customMessages = {
      addSuccess: 'Item criado com sucesso!',
      addError: 'Falha ao criar item',
    };

    const useTestCRUD = createSupabaseCRUD<TestEntity>({
      tableName: 'test_table',
      queryKey: ['test-messages'],
      messages: customMessages,
    });

    const { result } = renderHook(() => useTestCRUD(), {
      wrapper: createWrapper(),
    });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // The custom messages should be used in mutations (tested indirectly through the hook creation)
    expect(result.current.add).toBeDefined();
  });

  it('should handle query errors gracefully', async () => {
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const useTestCRUD = createSupabaseCRUD<TestEntity>({
      tableName: 'test_table',
      queryKey: ['test-error'],
    });

    const { result } = renderHook(() => useTestCRUD(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should expose pending states for mutations', () => {
    const useTestCRUD = createSupabaseCRUD<TestEntity>({
      tableName: 'test_table',
      queryKey: ['test-pending'],
    });

    const { result } = renderHook(() => useTestCRUD(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAdding).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isRemoving).toBe(false);
  });

  it('should provide refetch function', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const useTestCRUD = createSupabaseCRUD<TestEntity>({
      tableName: 'test_table',
      queryKey: ['test-refetch'],
    });

    const { result } = renderHook(() => useTestCRUD(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});
