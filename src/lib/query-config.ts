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
  userRoles: (userId: string) => ['user-roles', userId] as const,
  userAccess: (userId: string) => ['user-access', userId] as const,

  // Baby
  babyProfiles: (userId: string) => ['baby-profiles', userId] as const,
  babyProfile: (profileId: string) => ['baby-profile', profileId] as const,

  // Feeding
  feedingLogs: (userId: string, filters?: Record<string, unknown>) =>
    ['feeding-logs', userId, filters] as const,
  feedingSettings: (userId: string) => ['feeding-settings', userId] as const,

  // Sleep
  sleepLogs: (userId: string, filters?: Record<string, unknown>) =>
    ['sleep-logs', userId, filters] as const,
  sleepSettings: (userId: string) => ['sleep-settings', userId] as const,
  sleepMilestones: () => ['sleep-milestones'] as const,

  // Development
  milestoneTypes: () => ['milestone-types'] as const,
  milestoneRecords: (babyProfileId: string) => ['milestone-records', babyProfileId] as const,

  // Vaccination
  vaccinationCalendar: (calendarType: string) => ['vaccination-calendar', calendarType] as const,
  vaccinations: (babyProfileId: string) => ['vaccinations', babyProfileId] as const,

  // Enxoval
  enxovalItems: (userId: string, configId?: string) => ['enxoval-items', userId, configId] as const,
  enxovalConfig: (userId: string) => ['enxoval-config', userId] as const,

  // Community
  posts: (filters?: Record<string, unknown>) => ['posts', filters] as const,
  post: (postId: string) => ['post', postId] as const,
  comments: (postId: string) => ['comments', postId] as const,

  // Products & Access
  products: () => ['products'] as const,
  product: (productId: string) => ['product', productId] as const,

  // Gamification
  badges: () => ['badges'] as const,
  userBadges: (userId: string) => ['user-badges', userId] as const,
  userLevel: (userId: string) => ['user-level', userId] as const,
  leaderboard: () => ['leaderboard'] as const,
  leaderboardOptIn: (userId: string) => ['leaderboard-opt-in', userId] as const,
  dailyActivity: (userId: string) => ['daily-activity', userId] as const,
  userStreaks: (userId: string) => ['user-streaks', userId] as const,

  // Notifications
  notifications: (userId: string) => ['user-notifications', userId] as const,

  // Site settings
  siteSettings: () => ['site-settings'] as const,

  // Admin
  adminUsers: (filters?: Record<string, unknown>) => ['admin-users', filters] as const,
  adminStats: () => ['admin-stats'] as const,

  // Tickets
  tickets: (userId: string) => ['tickets', userId] as const,
  ticket: (ticketId: string) => ['ticket', ticketId] as const,

  // Baby specific
  babyAppointments: (babyProfileId?: string) => ['baby-appointments', babyProfileId] as const,
  babyMedications: (babyProfileId?: string) => ['baby-medications', babyProfileId] as const,
  babyColic: (babyProfileId?: string) => ['baby-colic', babyProfileId] as const,
  babyRoutines: (babyProfileId?: string) => ['baby-routines', babyProfileId] as const,
  babyRoutineLogs: (date: string) => ['baby-routine-logs', date] as const,
  growthMeasurements: (babyProfileId?: string) => ['growth-measurements', babyProfileId] as const,
  foodIntroduction: (babyProfileId?: string) => ['food-introduction', babyProfileId] as const,

  // Postpartum
  postpartumSymptoms: (userId: string) => ['postpartum-symptoms', userId] as const,
  postpartumMedications: (userId: string) => ['postpartum-medications', userId] as const,
  postpartumAppointments: (userId: string) => ['postpartum-appointments', userId] as const,
  postpartumRecoveryChecklist: (userId: string) =>
    ['postpartum-recovery-checklist', userId] as const,
  postpartumEmotionalLogs: (userId: string) => ['postpartum-emotional-logs', userId] as const,
  postpartumBodyImageLogs: (userId: string) => ['postpartum-body-image-logs', userId] as const,

  // Contractions
  contractions: (userId: string) => ['contractions', userId] as const,

  // Ultrasounds
  ultrasounds: (userId: string) => ['ultrasounds', userId] as const,

  // Maternity Bag
  maternityBagCategories: (userId: string) => ['maternity-bag-categories', userId] as const,
  maternityBagItems: (userId: string) => ['maternity-bag-items', userId] as const,

  // Favorites
  favorites: (userId: string, itemType: string) => ['favorites', userId, itemType] as const,

  // Follows
  follows: (userId: string) => ['follows', userId] as const,
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
export function getRelatedQueryKeys(baseKey: string, userId?: string): string[][] {
  switch (baseKey) {
    case 'feeding':
      return userId
        ? [
            ['feedingLogs', userId],
            ['feedingSettings', userId],
          ]
        : [];
    case 'sleep':
      return userId
        ? [
            ['sleepLogs', userId],
            ['sleepSettings', userId],
          ]
        : [];
    case 'community':
      return [['posts']];
    case 'gamification':
      return userId
        ? [
            ['userBadges', userId],
            ['leaderboard'],
            ['dailyActivity', userId, new Date().toISOString().split('T')[0]],
          ]
        : [];
    default:
      return [];
  }
}
