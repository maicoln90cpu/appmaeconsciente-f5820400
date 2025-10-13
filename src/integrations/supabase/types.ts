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
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_urls: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_urls?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_urls?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string
          display_order: number
          hotmart_product_id: string | null
          id: string
          is_active: boolean
          is_free: boolean
          price: number | null
          short_description: string | null
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          hotmart_product_id?: string | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          price?: number | null
          short_description?: string | null
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          hotmart_product_id?: string | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          price?: number | null
          short_description?: string | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cidade: string | null
          created_at: string
          data_inicio_planejamento: string | null
          data_prevista_parto: string | null
          email: string
          estado: string | null
          foto_perfil_url: string | null
          id: string
          idade: number | null
          idades_filhos: number[] | null
          meses_gestacao: number | null
          perfil_completo: boolean | null
          possui_filhos: boolean | null
          sexo: string | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          data_inicio_planejamento?: string | null
          data_prevista_parto?: string | null
          email: string
          estado?: string | null
          foto_perfil_url?: string | null
          id: string
          idade?: number | null
          idades_filhos?: number[] | null
          meses_gestacao?: number | null
          perfil_completo?: boolean | null
          possui_filhos?: boolean | null
          sexo?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          created_at?: string
          data_inicio_planejamento?: string | null
          data_prevista_parto?: string | null
          email?: string
          estado?: string | null
          foto_perfil_url?: string | null
          id?: string
          idade?: number | null
          idades_filhos?: number[] | null
          meses_gestacao?: number | null
          perfil_completo?: boolean | null
          possui_filhos?: boolean | null
          sexo?: string | null
          updated_at?: string
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
