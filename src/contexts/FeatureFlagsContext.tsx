import React, { createContext, useContext, useMemo } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface FeatureFlags {
  /** Se insights de IA estão habilitados globalmente */
  aiInsightsEnabled: boolean;
  /** Se badges/gamificação estão habilitados globalmente */
  badgesEnabled: boolean;
  /** Ainda carregando configurações do banco */
  loading: boolean;
}

const FeatureFlagsContext = createContext<FeatureFlags>({
  aiInsightsEnabled: true,
  badgesEnabled: true,
  loading: true,
});

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, isLoading } = useSiteSettings();

  const value = useMemo<FeatureFlags>(
    () => ({
      aiInsightsEnabled: settings?.ai_insights_enabled ?? true,
      badgesEnabled: settings?.badges_enabled ?? true,
      loading: isLoading,
    }),
    [settings?.ai_insights_enabled, settings?.badges_enabled, isLoading]
  );

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
};

/**
 * Hook para verificar se uma feature está habilitada
 * @example
 * const { badgesEnabled } = useFeatureFlags();
 * if (!badgesEnabled) return null;
 */
export const useFeatureFlags = (): FeatureFlags => {
  return useContext(FeatureFlagsContext);
};
