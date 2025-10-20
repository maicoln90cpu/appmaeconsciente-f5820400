export type FeedingType = 'breastfeeding' | 'bottle' | 'pumping';
export type BreastSide = 'left' | 'right' | 'both';
export type MilkType = 'breast_milk' | 'formula' | 'mixed';
export type Temperature = 'warm' | 'room' | 'cold';
export type PumpMethod = 'manual' | 'electric';
export type StorageLocation = 'fridge' | 'freezer';

export interface BabyFeedingLog {
  id: string;
  user_id: string;
  baby_name?: string;
  feeding_type: FeedingType;
  breast_side?: BreastSide;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  volume_ml?: number;
  milk_type?: MilkType;
  temperature?: Temperature;
  leftover_ml?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BreastMilkStorage {
  id: string;
  user_id: string;
  pumped_at: string;
  volume_ml: number;
  pump_method?: PumpMethod;
  storage_location: StorageLocation;
  expires_at: string;
  is_used: boolean;
  used_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FeedingSettings {
  id?: string;
  user_id: string;
  baby_name: string;
  baby_birthdate: string;
  feeding_interval_minutes: number;
  reminder_enabled: boolean;
  last_breast_side?: BreastSide;
  created_at?: string;
  updated_at?: string;
}
