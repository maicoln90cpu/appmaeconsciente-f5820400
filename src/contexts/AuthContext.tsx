/**
 * @fileoverview Contexto de autenticação do aplicativo
 * @module contexts/AuthContext
 * 
 * Provê estado de autenticação global e funções de controle de sessão.
 * Deve envolver toda a aplicação para disponibilizar o hook useAuth.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { User, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logger';

/**
 * Interface do contexto de autenticação
 */
interface AuthContextType {
  /** Usuário autenticado ou null */
  user: User | null;
  /** Sessão ativa ou null */
  session: Session | null;
  /** Estado de carregamento inicial */
  loading: boolean;
  /** Função para realizar logout */
  signOut: () => Promise<void>;
  /** Função para atualizar a sessão manualmente */
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider de autenticação que gerencia o estado global de auth
 * 
 * Configura listener para mudanças de estado de autenticação
 * e mantém user/session sincronizados com o Supabase Auth.
 * 
 * @param children - Componentes filhos que terão acesso ao contexto
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  /**
   * Atualiza manualmente a sessão atual
   */
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      logger.debug('Session refreshed', { context: 'AuthContext' });
    } catch (error) {
      logger.error('Failed to refresh session', error, { context: 'AuthContext' });
    }
  }, []);

  /**
   * Realiza logout do usuário
   * Limpa sessão local, cache do React Query e remove tokens
   */
  const signOut = useCallback(async () => {
    try {
      // 1. Limpar cache do React Query ANTES do signOut
      // para evitar que dados do usuário anterior persistam
      queryClient.clear();
      
      // 2. Realizar signOut no Supabase
      await supabase.auth.signOut();
      
      // 3. Limpar estados locais
      setSession(null);
      setUser(null);
      
      logger.info('User signed out — QueryClient cleared', { context: 'AuthContext' });
    } catch (error) {
      logger.error('Failed to sign out', error, { context: 'AuthContext' });
    }
  }, [queryClient]);

  useEffect(() => {
    // Configura listener de mudanças de auth PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        
        // Limpar cache quando o usuário faz logout via outro mecanismo
        // (ex: token expirado, logout em outra aba)
        if (event === 'SIGNED_OUT') {
          queryClient.clear();
          logger.debug('Auth SIGNED_OUT — QueryClient cleared', { context: 'AuthContext' });
        }
        
        logger.debug(`Auth state changed: ${event}`, { context: 'AuthContext' });
      }
    );

    // DEPOIS verifica sessão existente
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
      logger.debug('Initial session loaded', { context: 'AuthContext' });
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const contextValue = useMemo<AuthContextType>(() => ({
    user,
    session,
    loading,
    signOut,
    refreshSession,
  }), [user, session, loading, signOut, refreshSession]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para acessar o contexto de autenticação
 * @throws Error se usado fora do AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Hook simplificado para obter apenas o user_id
 * 
 * Útil para hooks e componentes que só precisam do ID
 * para fazer queries no banco de dados.
 * 
 * @returns ID do usuário ou null se não autenticado
 * 
 * @example
 * ```tsx
 * const userId = useUserId();
 * 
 * useEffect(() => {
 *   if (userId) {
 *     fetchUserData(userId);
 *   }
 * }, [userId]);
 * ```
 */
export const useUserId = (): string | null => {
  const { user } = useAuth();
  return user?.id ?? null;
};
