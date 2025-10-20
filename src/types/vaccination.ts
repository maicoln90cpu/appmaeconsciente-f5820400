export interface BabyVaccinationProfile {
  id: string;
  user_id: string;
  baby_name: string;
  nickname?: string;
  birth_date: string;
  avatar_url?: string;
  birth_type?: string;
  birth_city?: string;
  calendar_type: 'brasil' | 'particular';
  created_at: string;
  updated_at: string;
}

export interface VaccinationCalendar {
  id: string;
  vaccine_name: string;
  age_months: number;
  dose_number: number;
  dose_label?: string;
  application_type?: string;
  description?: string;
  purpose?: string;
  side_effects?: string;
  post_vaccine_tips?: string;
  interval_days?: number;
  calendar_type: 'brasil' | 'particular';
  created_at: string;
}

export interface BabyVaccination {
  id: string;
  user_id: string;
  baby_profile_id: string;
  calendar_vaccine_id?: string;
  vaccine_name: string;
  dose_label?: string;
  application_date: string;
  batch_number?: string;
  manufacturer?: string;
  application_site?: string;
  health_professional?: string;
  reactions?: string;
  proof_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VaccinationReminderSettings {
  id?: string;
  user_id: string;
  baby_profile_id: string;
  reminder_enabled: boolean;
  reminder_days_before: number;
  push_enabled: boolean;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export type VaccinationStatus = 'completed' | 'upcoming' | 'overdue' | 'pending';
