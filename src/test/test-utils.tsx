/**
 * @fileoverview Utilitários para testes de componentes React
 * @module test/test-utils
 *
 * Provê wrappers customizados do render que incluem providers necessários
 * e funções auxiliares para testes.
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

/**
 * Cria um QueryClient configurado para testes
 * Desabilita retries e refetch para testes mais previsíveis
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

/**
 * Mock do contexto de autenticação
 */
export const mockAuthContext = {
  user: null,
  session: null,
  loading: false,
  signOut: vi.fn(),
  refreshSession: vi.fn(),
};

/**
 * Mock de usuário autenticado
 */
export const mockAuthenticatedUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

/**
 * Mock de sessão autenticada
 */
export const mockSession = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockAuthenticatedUser,
};

interface WrapperProps {
  children: ReactNode;
}

/**
 * Wrapper com todos os providers necessários para testes
 */
const AllTheProviders = ({ children }: WrapperProps) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

/**
 * Render customizado que inclui todos os providers
 *
 * @param ui - Componente a ser renderizado
 * @param options - Opções adicionais do render
 * @returns Objeto com funções de query e utilitários
 *
 * @example
 * ```tsx
 * import { renderWithProviders, screen } from '@/test/test-utils';
 *
 * test('renders component', () => {
 *   renderWithProviders(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-exporta tudo do testing-library
export * from '@testing-library/react';
export { customRender as render };

/**
 * Helper para criar mock do Supabase client
 */
export const createSupabaseMock = () => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
    }),
  },
});

/**
 * Helper para esperar estado de loading terminar
 */
export const waitForLoadingToFinish = () => new Promise(resolve => setTimeout(resolve, 0));
