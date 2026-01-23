/**
 * Configuração centralizada de cache para React Query
 * Define tempos de cache otimizados por tipo de dado
 * 
 * staleTime: Tempo que os dados são considerados "frescos" (não refetch)
 * gcTime: Tempo que dados não utilizados ficam em cache (garbage collection)
 */

// Tempos base em milissegundos
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

/**
 * Configurações de cache por categoria de dados
 */
export const QueryCacheConfig = {
  /**
   * Dados estáticos que raramente mudam
   * Ex: tipos de marcos de desenvolvimento, calendário de vacinas
   */
  static: {
    staleTime: 24 * HOUR,
    gcTime: 7 * 24 * HOUR, // 7 dias
  },

  /**
   * Dados de referência que mudam ocasionalmente
   * Ex: produtos, badges, configurações do site
   */
  reference: {
    staleTime: 1 * HOUR,
    gcTime: 24 * HOUR,
  },

  /**
   * Dados do usuário que podem ser atualizados
   * Ex: perfil, configurações pessoais
   */
  user: {
    staleTime: 5 * MINUTE,
    gcTime: 30 * MINUTE,
  },

  /**
   * Dados que mudam frequentemente
   * Ex: posts da comunidade, notificações
   */
  dynamic: {
    staleTime: 1 * MINUTE,
    gcTime: 10 * MINUTE,
  },

  /**
   * Dados em tempo real que precisam estar sempre atualizados
   * Ex: tickets de suporte, status de sync
   */
  realtime: {
    staleTime: 30 * SECOND,
    gcTime: 5 * MINUTE,
  },

  /**
   * Dados de listagem paginada
   * Ex: histórico de mamadas, registros de sono
   */
  list: {
    staleTime: 2 * MINUTE,
    gcTime: 15 * MINUTE,
  },

  /**
   * Dados de dashboard/estatísticas
   * Ex: KPIs, gráficos
   */
  stats: {
    staleTime: 3 * MINUTE,
    gcTime: 20 * MINUTE,
  },
} as const;

/**
 * Chaves de query padronizadas para evitar duplicação
 */
export const QueryKeys = {
  // User
  profile: (userId: string) => ['profile', userId] as const,
  userRoles: (userId: string) => ['userRoles', userId] as const,
  userAccess: (userId: string) => ['userAccess', userId] as const,
  
  // Baby
  babyProfiles: (userId: string) => ['babyProfiles', userId] as const,
  babyProfile: (profileId: string) => ['babyProfile', profileId] as const,
  
  // Feeding
  feedingLogs: (userId: string, filters?: Record<string, unknown>) => 
    ['feedingLogs', userId, filters] as const,
  feedingSettings: (userId: string) => ['feedingSettings', userId] as const,
  
  // Sleep
  sleepLogs: (userId: string, filters?: Record<string, unknown>) => 
    ['sleepLogs', userId, filters] as const,
  sleepSettings: (userId: string) => ['sleepSettings', userId] as const,
  sleepMilestones: () => ['sleepMilestones'] as const,
  
  // Development
  milestoneTypes: () => ['milestoneTypes'] as const,
  milestoneRecords: (babyProfileId: string) => ['milestoneRecords', babyProfileId] as const,
  
  // Vaccination
  vaccinationCalendar: (calendarType: string) => ['vaccinationCalendar', calendarType] as const,
  vaccinations: (babyProfileId: string) => ['vaccinations', babyProfileId] as const,
  
  // Enxoval
  enxovalItems: (userId: string) => ['enxovalItems', userId] as const,
  enxovalConfig: (userId: string) => ['enxovalConfig', userId] as const,
  
  // Community
  posts: (filters?: Record<string, unknown>) => ['posts', filters] as const,
  post: (postId: string) => ['post', postId] as const,
  comments: (postId: string) => ['comments', postId] as const,
  
  // Products & Access
  products: () => ['products'] as const,
  product: (productId: string) => ['product', productId] as const,
  
  // Gamification
  badges: () => ['badges'] as const,
  userBadges: (userId: string) => ['userBadges', userId] as const,
  leaderboard: () => ['leaderboard'] as const,
  dailyActivity: (userId: string, date: string) => ['dailyActivity', userId, date] as const,
  
  // Notifications
  notifications: (userId: string) => ['notifications', userId] as const,
  
  // Site settings
  siteSettings: () => ['siteSettings'] as const,
  
  // Admin
  adminUsers: (filters?: Record<string, unknown>) => ['adminUsers', filters] as const,
  adminStats: () => ['adminStats'] as const,
} as const;

/**
 * Configuração padrão do QueryClient
 */
export const defaultQueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: QueryCacheConfig.user.staleTime,
      gcTime: QueryCacheConfig.user.gcTime,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount: number, error: unknown) => {
        // Não retry em erros de autenticação
        if (error instanceof Error && error.message.includes('401')) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: 1,
    },
  },
};

/**
 * Helper para criar opções de query com cache específico
 */
export function createQueryOptions<T>(
  cacheType: keyof typeof QueryCacheConfig,
  additionalOptions?: Partial<{
    enabled: boolean;
    refetchInterval: number;
    refetchOnWindowFocus: boolean;
    select: (data: T) => T;
  }>
) {
  return {
    ...QueryCacheConfig[cacheType],
    ...additionalOptions,
  };
}

/**
 * Helper para invalidar queries relacionadas
 * Retorna array de query keys como arrays de strings para uso com queryClient.invalidateQueries
 */
export function getRelatedQueryKeys(
  baseKey: string,
  userId?: string
): string[][] {
  switch (baseKey) {
    case 'feeding':
      return userId 
        ? [['feedingLogs', userId], ['feedingSettings', userId]]
        : [];
    case 'sleep':
      return userId
        ? [['sleepLogs', userId], ['sleepSettings', userId]]
        : [];
    case 'community':
      return [['posts']];
    case 'gamification':
      return userId
        ? [
            ['userBadges', userId], 
            ['leaderboard'], 
            ['dailyActivity', userId, new Date().toISOString().split('T')[0]]
          ]
        : [];
    default:
      return [];
  }
}
