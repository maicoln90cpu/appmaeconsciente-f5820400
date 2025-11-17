export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      baby_feeding_logs: {
        Row: {
          baby_name: string | null
          breast_side: string | null
          created_at: string
          duration_minutes: number | null
          end_time: string | null
          feeding_type: string
          id: string
          leftover_ml: number | null
          milk_type: string | null
          notes: string | null
          start_time: string
          temperature: string | null
          updated_at: string
          user_id: string
          volume_ml: number | null
        }
        Insert: {
          baby_name?: string | null
          breast_side?: string | null
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          feeding_type: string
          id?: string
          leftover_ml?: number | null
          milk_type?: string | null
          notes?: string | null
          start_time: string
          temperature?: string | null
          updated_at?: string
          user_id: string
          volume_ml?: number | null
        }
        Update: {
          baby_name?: string | null
          breast_side?: string | null
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          feeding_type?: string
          id?: string
          leftover_ml?: number | null
          milk_type?: string | null
          notes?: string | null
          start_time?: string
          temperature?: string | null
          updated_at?: string
          user_id?: string
          volume_ml?: number | null
        }
        Relationships: []
      }
      baby_milestone_records: {
        Row: {
          achieved_date: string | null
          baby_profile_id: string
          created_at: string | null
          id: string
          marked_as_achieved_at: string | null
          milestone_type_id: string
          mother_notes: string | null
          photo_url: string | null
          status: string
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          achieved_date?: string | null
          baby_profile_id: string
          created_at?: string | null
          id?: string
          marked_as_achieved_at?: string | null
          milestone_type_id: string
          mother_notes?: string | null
          photo_url?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          achieved_date?: string | null
          baby_profile_id?: string
          created_at?: string | null
          id?: string
          marked_as_achieved_at?: string | null
          milestone_type_id?: string
          mother_notes?: string | null
          photo_url?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "baby_milestone_records_baby_profile_id_fkey"
            columns: ["baby_profile_id"]
            isOneToOne: false
            referencedRelation: "baby_vaccination_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baby_milestone_records_milestone_type_id_fkey"
            columns: ["milestone_type_id"]
            isOneToOne: false
            referencedRelation: "development_milestone_types"
            referencedColumns: ["id"]
          },
        ]
      }
      baby_sleep_logs: {
        Row: {
          baby_age_months: number | null
          baby_name: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          location: string | null
          mom_mood: string | null
          notes: string | null
          sleep_end: string | null
          sleep_start: string
          sleep_type: string
          updated_at: string
          user_id: string
          wakeup_mood: string | null
        }
        Insert: {
          baby_age_months?: number | null
          baby_name?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          location?: string | null
          mom_mood?: string | null
          notes?: string | null
          sleep_end?: string | null
          sleep_start: string
          sleep_type: string
          updated_at?: string
          user_id: string
          wakeup_mood?: string | null
        }
        Update: {
          baby_age_months?: number | null
          baby_name?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          location?: string | null
          mom_mood?: string | null
          notes?: string | null
          sleep_end?: string | null
          sleep_start?: string
          sleep_type?: string
          updated_at?: string
          user_id?: string
          wakeup_mood?: string | null
        }
        Relationships: []
      }
      baby_sleep_milestones: {
        Row: {
          age_range_end: number
          age_range_start: number
          avg_night_sleep_hours: number | null
          created_at: string
          id: string
          recommended_naps: number | null
          recommended_total_hours_max: number
          recommended_total_hours_min: number
          tips: string[] | null
        }
        Insert: {
          age_range_end: number
          age_range_start: number
          avg_night_sleep_hours?: number | null
          created_at?: string
          id?: string
          recommended_naps?: number | null
          recommended_total_hours_max: number
          recommended_total_hours_min: number
          tips?: string[] | null
        }
        Update: {
          age_range_end?: number
          age_range_start?: number
          avg_night_sleep_hours?: number | null
          created_at?: string
          id?: string
          recommended_naps?: number | null
          recommended_total_hours_max?: number
          recommended_total_hours_min?: number
          tips?: string[] | null
        }
        Relationships: []
      }
      baby_sleep_settings: {
        Row: {
          baby_birthdate: string
          baby_name: string
          created_at: string
          id: string
          reminder_enabled: boolean | null
          reminder_interval_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          baby_birthdate: string
          baby_name: string
          created_at?: string
          id?: string
          reminder_enabled?: boolean | null
          reminder_interval_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          baby_birthdate?: string
          baby_name?: string
          created_at?: string
          id?: string
          reminder_enabled?: boolean | null
          reminder_interval_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      baby_vaccination_profiles: {
        Row: {
          avatar_url: string | null
          baby_name: string
          birth_city: string | null
          birth_date: string
          birth_type: string | null
          calendar_type: string
          created_at: string
          development_monitoring_enabled: boolean | null
          development_notes: string | null
          id: string
          nickname: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          baby_name: string
          birth_city?: string | null
          birth_date: string
          birth_type?: string | null
          calendar_type?: string
          created_at?: string
          development_monitoring_enabled?: boolean | null
          development_notes?: string | null
          id?: string
          nickname?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          baby_name?: string
          birth_city?: string | null
          birth_date?: string
          birth_type?: string | null
          calendar_type?: string
          created_at?: string
          development_monitoring_enabled?: boolean | null
          development_notes?: string | null
          id?: string
          nickname?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      baby_vaccinations: {
        Row: {
          application_date: string
          application_site: string | null
          baby_profile_id: string
          batch_number: string | null
          calendar_vaccine_id: string | null
          created_at: string
          dose_label: string | null
          health_professional: string | null
          id: string
          manufacturer: string | null
          notes: string | null
          proof_url: string | null
          reactions: string | null
          updated_at: string
          user_id: string
          vaccine_name: string
        }
        Insert: {
          application_date: string
          application_site?: string | null
          baby_profile_id: string
          batch_number?: string | null
          calendar_vaccine_id?: string | null
          created_at?: string
          dose_label?: string | null
          health_professional?: string | null
          id?: string
          manufacturer?: string | null
          notes?: string | null
          proof_url?: string | null
          reactions?: string | null
          updated_at?: string
          user_id: string
          vaccine_name: string
        }
        Update: {
          application_date?: string
          application_site?: string | null
          baby_profile_id?: string
          batch_number?: string | null
          calendar_vaccine_id?: string | null
          created_at?: string
          dose_label?: string | null
          health_professional?: string | null
          id?: string
          manufacturer?: string | null
          notes?: string | null
          proof_url?: string | null
          reactions?: string | null
          updated_at?: string
          user_id?: string
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "baby_vaccinations_baby_profile_id_fkey"
            columns: ["baby_profile_id"]
            isOneToOne: false
            referencedRelation: "baby_vaccination_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baby_vaccinations_calendar_vaccine_id_fkey"
            columns: ["calendar_vaccine_id"]
            isOneToOne: false
            referencedRelation: "vaccination_calendar"
            referencedColumns: ["id"]
          },
        ]
      }
      body_image_log: {
        Row: {
          created_at: string | null
          date: string
          id: string
          mood: string | null
          notes: string | null
          photo_url: string | null
          privacy: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          mood?: string | null
          notes?: string | null
          photo_url?: string | null
          privacy?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          mood?: string | null
          notes?: string | null
          photo_url?: string | null
          privacy?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      breast_milk_storage: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_used: boolean | null
          notes: string | null
          pump_method: string | null
          pumped_at: string
          storage_location: string
          updated_at: string
          used_at: string | null
          user_id: string
          volume_ml: number
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_used?: boolean | null
          notes?: string | null
          pump_method?: string | null
          pumped_at: string
          storage_location: string
          updated_at?: string
          used_at?: string | null
          user_id: string
          volume_ml: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          notes?: string | null
          pump_method?: string | null
          pumped_at?: string
          storage_location?: string
          updated_at?: string
          used_at?: string | null
          user_id?: string
          volume_ml?: number
        }
        Relationships: []
      }
      config: {
        Row: {
          created_at: string
          dias_alerta_troca: number | null
          id: string
          mensagem_motivacao: string | null
          orcamento_total: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dias_alerta_troca?: number | null
          id?: string
          mensagem_motivacao?: string | null
          orcamento_total?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dias_alerta_troca?: number | null
          id?: string
          mensagem_motivacao?: string | null
          orcamento_total?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          discount_applied: number
          id: string
          product_id: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          discount_applied: number
          id?: string
          product_id?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          discount_applied?: number
          id?: string
          product_id?: string | null
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string
          current_uses: number | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          product_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          current_uses?: number | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          product_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_wellness_score: {
        Row: {
          created_at: string | null
          date: string
          emotional_score: number | null
          energy_score: number | null
          id: string
          is_good_day: boolean | null
          notes: string | null
          pain_score: number | null
          physical_score: number | null
          total_score: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          emotional_score?: number | null
          energy_score?: number | null
          id?: string
          is_good_day?: boolean | null
          notes?: string | null
          pain_score?: number | null
          physical_score?: number | null
          total_score?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          emotional_score?: number | null
          energy_score?: number | null
          id?: string
          is_good_day?: boolean | null
          notes?: string | null
          pain_score?: number | null
          physical_score?: number | null
          total_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      development_alert_settings: {
        Row: {
          alert_when_passed_max_age: boolean | null
          alerts_enabled: boolean | null
          baby_profile_id: string
          created_at: string | null
          email_enabled: boolean | null
          id: string
          push_enabled: boolean | null
          reminder_frequency_days: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_when_passed_max_age?: boolean | null
          alerts_enabled?: boolean | null
          baby_profile_id: string
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          reminder_frequency_days?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_when_passed_max_age?: boolean | null
          alerts_enabled?: boolean | null
          baby_profile_id?: string
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          reminder_frequency_days?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_alert_settings_baby_profile_id_fkey"
            columns: ["baby_profile_id"]
            isOneToOne: false
            referencedRelation: "baby_vaccination_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      development_milestone_types: {
        Row: {
          age_max_months: number
          age_min_months: number
          area: string
          created_at: string | null
          description: string
          id: string
          is_active: boolean | null
          milestone_code: string
          pediatrician_alert: string | null
          stimulation_tips: string[] | null
          title: string
          video_demo_url: string | null
        }
        Insert: {
          age_max_months: number
          age_min_months: number
          area: string
          created_at?: string | null
          description: string
          id?: string
          is_active?: boolean | null
          milestone_code: string
          pediatrician_alert?: string | null
          stimulation_tips?: string[] | null
          title: string
          video_demo_url?: string | null
        }
        Update: {
          age_max_months?: number
          age_min_months?: number
          area?: string
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          milestone_code?: string
          pediatrician_alert?: string | null
          stimulation_tips?: string[] | null
          title?: string
          video_demo_url?: string | null
        }
        Relationships: []
      }
      emotional_logs: {
        Row: {
          created_at: string | null
          date: string
          edinburgh_score: number | null
          id: string
          mood: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          edinburgh_score?: number | null
          id?: string
          mood: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          edinburgh_score?: number | null
          id?: string
          mood?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          benefits: string[] | null
          category: string
          created_at: string
          created_by: string | null
          description: string
          duration_minutes: number | null
          exercise_type: string | null
          id: string
          image_url: string | null
          instructions: string[] | null
          intensity: string | null
          is_active: boolean | null
          is_ai_generated: boolean | null
          precautions: string[] | null
          title: string
          trimester: number[]
          updated_at: string
          video_url: string | null
        }
        Insert: {
          benefits?: string[] | null
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          duration_minutes?: number | null
          exercise_type?: string | null
          id?: string
          image_url?: string | null
          instructions?: string[] | null
          intensity?: string | null
          is_active?: boolean | null
          is_ai_generated?: boolean | null
          precautions?: string[] | null
          title: string
          trimester: number[]
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          benefits?: string[] | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          duration_minutes?: number | null
          exercise_type?: string | null
          id?: string
          image_url?: string | null
          instructions?: string[] | null
          intensity?: string | null
          is_active?: boolean | null
          is_ai_generated?: boolean | null
          precautions?: string[] | null
          title?: string
          trimester?: number[]
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      feeding_settings: {
        Row: {
          baby_birthdate: string
          baby_name: string
          created_at: string
          feeding_interval_minutes: number | null
          id: string
          last_breast_side: string | null
          reminder_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          baby_birthdate: string
          baby_name: string
          created_at?: string
          feeding_interval_minutes?: number | null
          id?: string
          last_breast_side?: string | null
          reminder_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          baby_birthdate?: string
          baby_name?: string
          created_at?: string
          feeding_interval_minutes?: number | null
          id?: string
          last_breast_side?: string | null
          reminder_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      food_alerts: {
        Row: {
          alert_type: string
          alternatives: string[] | null
          created_at: string
          food_name: string
          id: string
          is_active: boolean | null
          reason: string
          trimester_specific: number[] | null
        }
        Insert: {
          alert_type: string
          alternatives?: string[] | null
          created_at?: string
          food_name: string
          id?: string
          is_active?: boolean | null
          reason: string
          trimester_specific?: number[] | null
        }
        Update: {
          alert_type?: string
          alternatives?: string[] | null
          created_at?: string
          food_name?: string
          id?: string
          is_active?: boolean | null
          reason?: string
          trimester_specific?: number[] | null
        }
        Relationships: []
      }
      hotmart_product_mapping: {
        Row: {
          created_at: string
          hotmart_product_id: string
          id: string
          internal_product_id: string
        }
        Insert: {
          created_at?: string
          hotmart_product_id: string
          id?: string
          internal_product_id: string
        }
        Update: {
          created_at?: string
          hotmart_product_id?: string
          id?: string
          internal_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotmart_product_mapping_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      hotmart_transactions: {
        Row: {
          amount: number | null
          buyer_email: string
          buyer_name: string | null
          event_type: string | null
          hotmart_product_id: string
          id: string
          processed_at: string
          product_id: string | null
          status: string
          transaction_id: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          buyer_email: string
          buyer_name?: string | null
          event_type?: string | null
          hotmart_product_id: string
          id?: string
          processed_at?: string
          product_id?: string | null
          status: string
          transaction_id: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          buyer_email?: string
          buyer_name?: string | null
          event_type?: string | null
          hotmart_product_id?: string
          id?: string
          processed_at?: string
          product_id?: string | null
          status?: string
          transaction_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotmart_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_enxoval: {
        Row: {
          categoria: string
          classificacao: string | null
          created_at: string
          data: string | null
          data_limite_troca: string | null
          desconto: number | null
          emocao: string | null
          etapa_maes: string | null
          frete: number | null
          id: string
          item: string
          link: string | null
          loja: string | null
          necessidade: string
          obs: string | null
          origem: string | null
          preco_planejado: number | null
          preco_referencia: number | null
          preco_unit_pago: number | null
          prioridade: string
          qtd_comprada: number | null
          qtd_planejada: number | null
          status: string
          tags: string[] | null
          tamanho: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria: string
          classificacao?: string | null
          created_at?: string
          data?: string | null
          data_limite_troca?: string | null
          desconto?: number | null
          emocao?: string | null
          etapa_maes?: string | null
          frete?: number | null
          id?: string
          item: string
          link?: string | null
          loja?: string | null
          necessidade: string
          obs?: string | null
          origem?: string | null
          preco_planejado?: number | null
          preco_referencia?: number | null
          preco_unit_pago?: number | null
          prioridade: string
          qtd_comprada?: number | null
          qtd_planejada?: number | null
          status?: string
          tags?: string[] | null
          tamanho?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string
          classificacao?: string | null
          created_at?: string
          data?: string | null
          data_limite_troca?: string | null
          desconto?: number | null
          emocao?: string | null
          etapa_maes?: string | null
          frete?: number | null
          id?: string
          item?: string
          link?: string | null
          loja?: string | null
          necessidade?: string
          obs?: string | null
          origem?: string | null
          preco_planejado?: number | null
          preco_referencia?: number | null
          preco_unit_pago?: number | null
          prioridade?: string
          qtd_comprada?: number | null
          qtd_planejada?: number | null
          status?: string
          tags?: string[] | null
          tamanho?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      limites_rn: {
        Row: {
          config_id: string
          created_at: string
          id: string
          item: string
          limite: number
          observacoes: string | null
          quando_aumentar: string | null
        }
        Insert: {
          config_id: string
          created_at?: string
          id?: string
          item: string
          limite: number
          observacoes?: string | null
          quando_aumentar?: string | null
        }
        Update: {
          config_id?: string
          created_at?: string
          id?: string
          item?: string
          limite?: number
          observacoes?: string | null
          quando_aumentar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "limites_rn_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "config"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          calcium: number | null
          calories: number | null
          carbs: number | null
          created_at: string
          created_by: string | null
          day_of_week: number
          description: string | null
          fats: number | null
          fiber: number | null
          folic_acid: number | null
          id: string
          ingredients: string[] | null
          iron: number | null
          is_ai_generated: boolean | null
          meal_type: string
          preparation: string | null
          proteins: number | null
          tips: string | null
          title: string
          trimester: number
          updated_at: string
        }
        Insert: {
          calcium?: number | null
          calories?: number | null
          carbs?: number | null
          created_at?: string
          created_by?: string | null
          day_of_week: number
          description?: string | null
          fats?: number | null
          fiber?: number | null
          folic_acid?: number | null
          id?: string
          ingredients?: string[] | null
          iron?: number | null
          is_ai_generated?: boolean | null
          meal_type: string
          preparation?: string | null
          proteins?: number | null
          tips?: string | null
          title: string
          trimester: number
          updated_at?: string
        }
        Update: {
          calcium?: number | null
          calories?: number | null
          carbs?: number | null
          created_at?: string
          created_by?: string | null
          day_of_week?: number
          description?: string | null
          fats?: number | null
          fiber?: number | null
          folic_acid?: number | null
          id?: string
          ingredients?: string[] | null
          iron?: number | null
          is_ai_generated?: boolean | null
          meal_type?: string
          preparation?: string | null
          proteins?: number | null
          tips?: string | null
          title?: string
          trimester?: number
          updated_at?: string
        }
        Relationships: []
      }
      medication_logs: {
        Row: {
          created_at: string | null
          id: string
          medication_id: string
          notes: string | null
          scheduled_time: string | null
          taken_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          medication_id: string
          notes?: string | null
          scheduled_time?: string | null
          taken_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          medication_id?: string
          notes?: string | null
          scheduled_time?: string | null
          taken_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "postpartum_medications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_global: boolean | null
          message: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_global?: boolean | null
          message: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_global?: boolean | null
          message?: string
          title?: string
        }
        Relationships: []
      }
      nutrition_chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "nutrition_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      postpartum_achievements: {
        Row: {
          achievement_code: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_code: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_code?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      postpartum_appointments: {
        Row: {
          appointment_type: string
          completed: boolean | null
          created_at: string | null
          doctor_name: string | null
          id: string
          location: string | null
          notes: string | null
          reminder_sent: boolean | null
          scheduled_date: string
          scheduled_time: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appointment_type: string
          completed?: boolean | null
          created_at?: string | null
          doctor_name?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          reminder_sent?: boolean | null
          scheduled_date: string
          scheduled_time?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          appointment_type?: string
          completed?: boolean | null
          created_at?: string | null
          doctor_name?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          reminder_sent?: boolean | null
          scheduled_date?: string
          scheduled_time?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      postpartum_medications: {
        Row: {
          created_at: string | null
          dosage: string
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean | null
          medication_name: string
          notes: string | null
          start_date: string
          time_of_day: string[] | null
          times_per_day: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dosage: string
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          medication_name: string
          notes?: string | null
          start_date: string
          time_of_day?: string[] | null
          times_per_day?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dosage?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          medication_name?: string
          notes?: string | null
          start_date?: string
          time_of_day?: string[] | null
          times_per_day?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      postpartum_symptoms: {
        Row: {
          appetite: string | null
          bleeding_intensity: string | null
          bowel_movement: string | null
          breast_pain: boolean | null
          cramps_level: number | null
          created_at: string | null
          date: string
          energy_level: number | null
          fever: boolean | null
          healing_status: string | null
          id: string
          notes: string | null
          pain_level: number | null
          sleep_quality: number | null
          swelling: string[] | null
          temperature: number | null
          updated_at: string | null
          urination: string | null
          user_id: string
        }
        Insert: {
          appetite?: string | null
          bleeding_intensity?: string | null
          bowel_movement?: string | null
          breast_pain?: boolean | null
          cramps_level?: number | null
          created_at?: string | null
          date?: string
          energy_level?: number | null
          fever?: boolean | null
          healing_status?: string | null
          id?: string
          notes?: string | null
          pain_level?: number | null
          sleep_quality?: number | null
          swelling?: string[] | null
          temperature?: number | null
          updated_at?: string | null
          urination?: string | null
          user_id: string
        }
        Update: {
          appetite?: string | null
          bleeding_intensity?: string | null
          bowel_movement?: string | null
          breast_pain?: boolean | null
          cramps_level?: number | null
          created_at?: string | null
          date?: string
          energy_level?: number | null
          fever?: boolean | null
          healing_status?: string | null
          id?: string
          notes?: string | null
          pain_level?: number | null
          sleep_quality?: number | null
          swelling?: string[] | null
          temperature?: number | null
          updated_at?: string | null
          urination?: string | null
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          categoria: string | null
          content: string
          created_at: string
          display_name: string | null
          id: string
          image_urls: string[] | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria?: string | null
          content: string
          created_at?: string
          display_name?: string | null
          id?: string
          image_urls?: string[] | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string | null
          content?: string
          created_at?: string
          display_name?: string | null
          id?: string
          image_urls?: string[] | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_bundles: {
        Row: {
          bonus_duration_days: number | null
          bonus_product_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          main_product_id: string
        }
        Insert: {
          bonus_duration_days?: number | null
          bonus_product_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          main_product_id: string
        }
        Update: {
          bonus_duration_days?: number | null
          bonus_product_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          main_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_bundles_bonus_product_id_fkey"
            columns: ["bonus_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_bundles_main_product_id_fkey"
            columns: ["main_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          access_duration_days: number | null
          category: string | null
          created_at: string
          description: string
          destination_url: string | null
          display_order: number
          hotmart_product_id: string | null
          id: string
          is_active: boolean
          is_free: boolean
          payment_url: string | null
          price: number | null
          short_description: string | null
          slug: string
          thumbnail_url: string | null
          title: string
          trial_days: number | null
          trial_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          access_duration_days?: number | null
          category?: string | null
          created_at?: string
          description: string
          destination_url?: string | null
          display_order?: number
          hotmart_product_id?: string | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          payment_url?: string | null
          price?: number | null
          short_description?: string | null
          slug: string
          thumbnail_url?: string | null
          title: string
          trial_days?: number | null
          trial_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          access_duration_days?: number | null
          category?: string | null
          created_at?: string
          description?: string
          destination_url?: string | null
          display_order?: number
          hotmart_product_id?: string | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          payment_url?: string | null
          price?: number | null
          short_description?: string | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          trial_days?: number | null
          trial_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          altura_cm: number | null
          cidade: string | null
          created_at: string
          data_inicio_planejamento: string | null
          data_prevista_parto: string | null
          delivery_date: string | null
          delivery_type: string | null
          email: string
          estado: string | null
          foto_perfil_url: string | null
          id: string
          idade: number | null
          idades_filhos: number[] | null
          meses_gestacao: number | null
          perfil_completo: boolean | null
          peso_atual: number | null
          possui_filhos: boolean | null
          postpartum_notes: string | null
          sexo: string | null
          updated_at: string
        }
        Insert: {
          altura_cm?: number | null
          cidade?: string | null
          created_at?: string
          data_inicio_planejamento?: string | null
          data_prevista_parto?: string | null
          delivery_date?: string | null
          delivery_type?: string | null
          email: string
          estado?: string | null
          foto_perfil_url?: string | null
          id: string
          idade?: number | null
          idades_filhos?: number[] | null
          meses_gestacao?: number | null
          perfil_completo?: boolean | null
          peso_atual?: number | null
          possui_filhos?: boolean | null
          postpartum_notes?: string | null
          sexo?: string | null
          updated_at?: string
        }
        Update: {
          altura_cm?: number | null
          cidade?: string | null
          created_at?: string
          data_inicio_planejamento?: string | null
          data_prevista_parto?: string | null
          delivery_date?: string | null
          delivery_type?: string | null
          email?: string
          estado?: string | null
          foto_perfil_url?: string | null
          id?: string
          idade?: number | null
          idades_filhos?: number[] | null
          meses_gestacao?: number | null
          perfil_completo?: boolean | null
          peso_atual?: number | null
          possui_filhos?: boolean | null
          postpartum_notes?: string | null
          sexo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          duration_days: number
          id: string
          is_active: boolean
          name: string
          product_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          duration_days: number
          id?: string
          is_active?: boolean
          name: string
          product_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean
          name?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          calories: number | null
          carbs: number | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          fats: number | null
          id: string
          image_url: string | null
          ingredients: string[]
          is_ai_generated: boolean | null
          is_public: boolean | null
          nutrients: Json | null
          prep_time: number | null
          preparation: string[]
          proteins: number | null
          servings: number | null
          tags: string[] | null
          tips: string | null
          title: string
          trimester_focus: number[] | null
          updated_at: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          fats?: number | null
          id?: string
          image_url?: string | null
          ingredients: string[]
          is_ai_generated?: boolean | null
          is_public?: boolean | null
          nutrients?: Json | null
          prep_time?: number | null
          preparation: string[]
          proteins?: number | null
          servings?: number | null
          tags?: string[] | null
          tips?: string | null
          title: string
          trimester_focus?: number[] | null
          updated_at?: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          fats?: number | null
          id?: string
          image_url?: string | null
          ingredients?: string[]
          is_ai_generated?: boolean | null
          is_public?: boolean | null
          nutrients?: Json | null
          prep_time?: number | null
          preparation?: string[]
          proteins?: number | null
          servings?: number | null
          tags?: string[] | null
          tips?: string | null
          title?: string
          trimester_focus?: number[] | null
          updated_at?: string
        }
        Relationships: []
      }
      recovery_checklist: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          item: string
          notes: string | null
          updated_at: string | null
          user_id: string
          week_number: number
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          item: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
          week_number: number
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          item?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
          week_number?: number
        }
        Relationships: []
      }
      shared_enxoval_links: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          token: string
          user_id: string
          views_count: number
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          token: string
          user_id: string
          views_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          token?: string
          user_id?: string
          views_count?: number
        }
        Relationships: []
      }
      supplement_logs: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          scheduled_time: string | null
          supplement_id: string
          taken_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_time?: string | null
          supplement_id: string
          taken_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_time?: string | null
          supplement_id?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_logs_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "user_supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          priority: string
          related_suggestion_id: string | null
          status: string
          subject: string
          ticket_type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          priority?: string
          related_suggestion_id?: string | null
          status?: string
          subject: string
          ticket_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          priority?: string
          related_suggestion_id?: string | null
          status?: string
          subject?: string
          ticket_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_related_suggestion_id_fkey"
            columns: ["related_suggestion_id"]
            isOneToOne: false
            referencedRelation: "tool_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_admin_reply: boolean
          message: string
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          message: string
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          message?: string
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_suggestions: {
        Row: {
          admin_feedback: string | null
          available_for_beta: boolean | null
          contact_email: string
          created_at: string
          id: string
          integrations: string[] | null
          main_functions: string
          main_idea: string
          phases: string[] | null
          priority_rating: number | null
          problem_solved: string | null
          reference_examples: string | null
          reward_granted: boolean | null
          share_count: number | null
          status: string
          target_audience: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_feedback?: string | null
          available_for_beta?: boolean | null
          contact_email: string
          created_at?: string
          id?: string
          integrations?: string[] | null
          main_functions: string
          main_idea: string
          phases?: string[] | null
          priority_rating?: number | null
          problem_solved?: string | null
          reference_examples?: string | null
          reward_granted?: boolean | null
          share_count?: number | null
          status?: string
          target_audience?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_feedback?: string | null
          available_for_beta?: boolean | null
          contact_email?: string
          created_at?: string
          id?: string
          integrations?: string[] | null
          main_functions?: string
          main_idea?: string
          phases?: string[] | null
          priority_rating?: number | null
          problem_solved?: string | null
          reference_examples?: string | null
          reward_granted?: boolean | null
          share_count?: number | null
          status?: string
          target_audience?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_access_logs: {
        Row: {
          accessed_at: string | null
          id: string
          ip_address: string | null
          product_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accessed_at?: string | null
          id?: string
          ip_address?: string | null
          product_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accessed_at?: string | null
          id?: string
          ip_address?: string | null
          product_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_access_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_code: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_code: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_code?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_exercise_logs: {
        Row: {
          created_at: string
          date: string
          duration_minutes: number
          exercise_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          duration_minutes: number
          exercise_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          duration_minutes?: number
          exercise_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_food_restrictions: {
        Row: {
          created_at: string
          food_name: string
          id: string
          notes: string | null
          restriction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          food_name: string
          id?: string
          notes?: string | null
          restriction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          food_name?: string
          id?: string
          notes?: string | null
          restriction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_product_access: {
        Row: {
          expires_at: string | null
          granted_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_product_access_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_progress"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_supplements: {
        Row: {
          created_at: string
          dosage: string
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean | null
          notes: string | null
          start_date: string
          supplement_name: string
          time_of_day: string[] | null
          times_per_day: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dosage: string
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          start_date: string
          supplement_name: string
          time_of_day?: string[] | null
          times_per_day?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dosage?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          start_date?: string
          supplement_name?: string
          time_of_day?: string[] | null
          times_per_day?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vaccination_calendar: {
        Row: {
          age_months: number
          application_type: string | null
          calendar_type: string
          created_at: string
          description: string | null
          dose_label: string | null
          dose_number: number
          id: string
          interval_days: number | null
          post_vaccine_tips: string | null
          purpose: string | null
          side_effects: string | null
          vaccine_name: string
        }
        Insert: {
          age_months: number
          application_type?: string | null
          calendar_type?: string
          created_at?: string
          description?: string | null
          dose_label?: string | null
          dose_number: number
          id?: string
          interval_days?: number | null
          post_vaccine_tips?: string | null
          purpose?: string | null
          side_effects?: string | null
          vaccine_name: string
        }
        Update: {
          age_months?: number
          application_type?: string | null
          calendar_type?: string
          created_at?: string
          description?: string | null
          dose_label?: string | null
          dose_number?: number
          id?: string
          interval_days?: number | null
          post_vaccine_tips?: string | null
          purpose?: string | null
          side_effects?: string | null
          vaccine_name?: string
        }
        Relationships: []
      }
      vaccination_reminder_settings: {
        Row: {
          baby_profile_id: string
          created_at: string
          email_enabled: boolean | null
          id: string
          push_enabled: boolean | null
          reminder_days_before: number | null
          reminder_enabled: boolean | null
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean | null
        }
        Insert: {
          baby_profile_id: string
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          reminder_days_before?: number | null
          reminder_enabled?: boolean | null
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean | null
        }
        Update: {
          baby_profile_id?: string
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          reminder_days_before?: number | null
          reminder_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_reminder_settings_baby_profile_id_fkey"
            columns: ["baby_profile_id"]
            isOneToOne: true
            referencedRelation: "baby_vaccination_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      water_goals: {
        Row: {
          created_at: string
          daily_goal_ml: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_goal_ml?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_goal_ml?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      water_intake: {
        Row: {
          amount_ml: number
          created_at: string
          date: string
          id: string
          time: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          date?: string
          id?: string
          time?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          date?: string
          id?: string
          time?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_tracking: {
        Row: {
          belly_measurement: number | null
          created_at: string
          date: string
          id: string
          notes: string | null
          photo_url: string | null
          updated_at: string
          user_id: string
          week_of_pregnancy: number | null
          weight: number
        }
        Insert: {
          belly_measurement?: number | null
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          updated_at?: string
          user_id: string
          week_of_pregnancy?: number | null
          weight: number
        }
        Update: {
          belly_measurement?: number | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          updated_at?: string
          user_id?: string
          week_of_pregnancy?: number | null
          weight?: number
        }
        Relationships: []
      }
    }
    Views: {
      user_achievement_progress: {
        Row: {
          days_using_app: number | null
          enxoval_items_count: number | null
          feeding_logs_count: number | null
          has_complete_bag: boolean | null
          has_feeding_queen: boolean | null
          has_first_week: boolean | null
          has_organizer_expert: boolean | null
          has_peaceful_nights: boolean | null
          has_savings_master: boolean | null
          has_sleep_master: boolean | null
          long_sleep_count: number | null
          mala_categories: number | null
          sleep_logs_count: number | null
          total_savings: number | null
          user_id: string | null
        }
        Insert: {
          days_using_app?: never
          enxoval_items_count?: never
          feeding_logs_count?: never
          has_complete_bag?: never
          has_feeding_queen?: never
          has_first_week?: never
          has_organizer_expert?: never
          has_peaceful_nights?: never
          has_savings_master?: never
          has_sleep_master?: never
          long_sleep_count?: never
          mala_categories?: never
          sleep_logs_count?: never
          total_savings?: never
          user_id?: string | null
        }
        Update: {
          days_using_app?: never
          enxoval_items_count?: never
          feeding_logs_count?: never
          has_complete_bag?: never
          has_feeding_queen?: never
          has_first_week?: never
          has_organizer_expert?: never
          has_peaceful_nights?: never
          has_savings_master?: never
          has_sleep_master?: never
          long_sleep_count?: never
          mala_categories?: never
          sleep_logs_count?: never
          total_savings?: never
          user_id?: string | null
        }
        Relationships: []
      }
      user_club_access: {
        Row: {
          expires_at: string | null
          has_active_access: boolean | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
