/**
 * @fileoverview Contexto de autenticação do aplicativo
 * @module contexts/AuthContext
 * 
 * Provê estado de autenticação global e funções de controle de sessão.
 * Deve envolver toda a aplicação para disponibilizar o hook useAuth.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { User, Session } from '@supabase/supabase-js';

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
 * 
 * @example
 * ```tsx
 * // No App.tsx ou main.tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Atualiza manualmente a sessão atual
   * Útil após operações que podem ter alterado a sessão
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
   * Limpa sessão local e remove tokens do Supabase
   */
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      logger.info('User signed out', { context: 'AuthContext' });
    } catch (error) {
      logger.error('Failed to sign out', error, { context: 'AuthContext' });
    }
  }, []);

  useEffect(() => {
    // Configura listener de mudanças de auth PRIMEIRO
    // para não perder eventos durante a verificação inicial
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        // Apenas atualizações síncronas aqui para evitar deadlocks
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        logger.debug(`Auth state changed: ${event}`, { context: 'AuthContext' });
      }
    );

    // DEPOIS verifica sessão existente (pode haver token no localStorage)
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
      logger.debug('Initial session loaded', { context: 'AuthContext' });
    });

    return () => subscription.unsubscribe();
  }, []);

  // Memoiza o valor do contexto para evitar re-renders desnecessários
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
 * 
 * @throws Error se usado fora do AuthProvider
 * @returns Contexto de autenticação com user, session e funções
 * 
 * @example
 * ```tsx
 * const { user, signOut, loading } = useAuth();
 * 
 * if (loading) return <Spinner />;
 * if (!user) return <LoginPage />;
 * 
 * return <button onClick={signOut}>Sair</button>;
 * ```
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
