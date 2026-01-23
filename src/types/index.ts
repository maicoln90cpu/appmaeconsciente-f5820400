/**
 * Barrel exports para todos os tipos da aplicação
 * Centraliza imports e facilita manutenção
 * 
 * Uso: import { BabyFeedingLog, EnxovalItem, MilestoneStatus } from '@/types';
 */

// ============= Baby Feeding Types =============
export type {
  FeedingType,
  BreastSide,
  MilkType,
  Temperature,
  PumpMethod,
  StorageLocation,
  BabyFeedingLog,
  BreastMilkStorage,
  FeedingSettings,
} from './babyFeeding';

// ============= Baby Sleep Types =============
export type {
  SleepType,
  SleepLocation,
  WakeupMood,
  MomMood,
  BabySleepLog,
  BabySleepSettings,
  BabySleepMilestone,
} from './babySleep';

// ============= Development Types =============
export type {
  DevelopmentArea,
  MilestoneStatus,
  DevelopmentMilestoneType,
  BabyMilestoneRecord,
  DevelopmentAlertSettings,
  DevelopmentSummary,
  MilestonesByArea,
} from './development';

export { AREA_LABELS, AREA_ICONS, AREA_COLORS } from './development';

// ============= Enxoval Types =============
export type {
  Category,
  Necessity,
  Priority,
  Status,
  Size,
  Origin,
  EtapaMaes,
  Classificacao,
  Emocao,
  EnxovalItem,
  Budget,
  RNLimit,
  Config,
} from './enxoval';

// ============= Vaccination Types =============
export type {
  BabyVaccinationProfile,
  VaccinationCalendar,
  BabyVaccination,
  VaccinationReminderSettings,
  VaccinationStatus,
} from './vaccination';

// ============= jsPDF Types =============
export type { jsPDFWithAutoTable } from './jspdf';
export { getLastAutoTableY } from './jspdf';

// ============= Common UI Types =============
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// ============= API Response Types =============
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============= Form Types =============
export interface FormFieldError {
  field: string;
  message: string;
}

export interface FormState<T> {
  values: T;
  errors: FormFieldError[];
  isSubmitting: boolean;
  isDirty: boolean;
}

// ============= Toast/Notification Types =============
export type ToastVariant = 'default' | 'destructive' | 'success';

export interface ToastConfig {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// ============= User/Auth Types =============
export type UserRole = 'user' | 'admin' | 'moderator';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  perfil_completo: boolean;
  created_at: string;
}

// ============= Baby Profile Types =============
export interface BabyProfile {
  id: string;
  user_id: string;
  baby_name: string;
  nickname?: string;
  birth_date: string;
  gender?: 'masculino' | 'feminino';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// ============= Statistics Types =============
export interface StatCard {
  title: string;
  value: string | number;
  description?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}
