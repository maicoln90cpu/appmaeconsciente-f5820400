export type SleepType = 'diurno' | 'noturno';

export type SleepLocation = 'berco' | 'colo' | 'carrinho' | 'cama_compartilhada' | 'outro';

export type WakeupMood = 'calmo' | 'chorando' | 'agitado' | 'neutro';

export type MomMood = 'descansada' | 'cansada' | 'exausta' | 'neutra';

export interface BabySleepLog {
  id: string;
  user_id: string;
  baby_name?: string;
  baby_age_months?: number;
  sleep_start: string;
  sleep_end?: string;
  duration_minutes?: number;
  sleep_type: SleepType;
  location?: SleepLocation;
  wakeup_mood?: WakeupMood;
  mom_mood?: MomMood;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BabySleepSettings {
  id?: string;
  user_id: string;
  baby_name: string;
  baby_birthdate: string;
  reminder_enabled: boolean;
  reminder_interval_minutes: number;
  created_at?: string;
  updated_at?: string;
}

export interface BabySleepMilestone {
  id: string;
  age_range_start: number;
  age_range_end: number;
  recommended_total_hours_min: number;
  recommended_total_hours_max: number;
  recommended_naps?: number;
  avg_night_sleep_hours?: number;
  tips?: string[];
  created_at: string;
}
