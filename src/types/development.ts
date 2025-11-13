export type DevelopmentArea = 'motor_grosso' | 'motor_fino' | 'linguagem' | 'cognitivo' | 'social_emocional';

export type MilestoneStatus = 'pending' | 'achieved' | 'attention' | 'doubt';

export interface DevelopmentMilestoneType {
  id: string;
  milestone_code: string;
  area: DevelopmentArea;
  title: string;
  description: string;
  age_min_months: number;
  age_max_months: number;
  stimulation_tips: string[];
  pediatrician_alert: string | null;
  video_demo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BabyMilestoneRecord {
  id: string;
  user_id: string;
  baby_profile_id: string;
  milestone_type_id: string;
  status: MilestoneStatus;
  achieved_date: string | null;
  mother_notes: string | null;
  photo_url: string | null;
  video_url: string | null;
  marked_as_achieved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  milestone?: DevelopmentMilestoneType;
}

export interface DevelopmentAlertSettings {
  id: string;
  user_id: string;
  baby_profile_id: string;
  alerts_enabled: boolean;
  alert_when_passed_max_age: boolean;
  reminder_frequency_days: number;
  push_enabled: boolean;
  email_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DevelopmentSummary {
  baby_profile_id: string;
  baby_name: string;
  age_months: number;
  motor_grosso_total: number;
  motor_grosso_achieved: number;
  motor_fino_total: number;
  motor_fino_achieved: number;
  linguagem_total: number;
  linguagem_achieved: number;
  cognitivo_total: number;
  cognitivo_achieved: number;
  social_emocional_total: number;
  social_emocional_achieved: number;
  attention_count: number;
  last_milestone_date: string | null;
}

export interface MilestonesByArea {
  motor_grosso: DevelopmentMilestoneType[];
  motor_fino: DevelopmentMilestoneType[];
  linguagem: DevelopmentMilestoneType[];
  cognitivo: DevelopmentMilestoneType[];
  social_emocional: DevelopmentMilestoneType[];
}

export const AREA_LABELS: Record<DevelopmentArea, string> = {
  motor_grosso: 'Motor Grosso',
  motor_fino: 'Motor Fino',
  linguagem: 'Linguagem',
  cognitivo: 'Cognitivo',
  social_emocional: 'Social/Emocional'
};

export const AREA_ICONS: Record<DevelopmentArea, string> = {
  motor_grosso: '🦵',
  motor_fino: '✋',
  linguagem: '🗣️',
  cognitivo: '🧠',
  social_emocional: '💞'
};

export const AREA_COLORS: Record<DevelopmentArea, string> = {
  motor_grosso: 'hsl(var(--chart-1))',
  motor_fino: 'hsl(var(--chart-2))',
  linguagem: 'hsl(var(--chart-3))',
  cognitivo: 'hsl(var(--chart-4))',
  social_emocional: 'hsl(var(--chart-5))'
};
