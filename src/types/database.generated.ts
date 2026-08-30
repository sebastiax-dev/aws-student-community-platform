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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          attended: boolean
          created_at: string
          event_id: string
          id: string
          recorded_at: string | null
          recorded_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attended?: boolean
          created_at?: string
          event_id: string
          id?: string
          recorded_at?: string | null
          recorded_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attended?: boolean
          created_at?: string
          event_id?: string
          id?: string
          recorded_at?: string | null
          recorded_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          entity_id: string
          entity_type: string
          id: number
          metadata: Json
          occurred_at: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          entity_id: string
          entity_type: string
          id?: never
          metadata?: Json
          occurred_at?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          entity_id?: string
          entity_type?: string
          id?: never
          metadata?: Json
          occurred_at?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          certificate_name: string
          created_at: string
          created_by: string
          event_id: string | null
          id: string
          issued_at: string
          revoked_at: string | null
          revoked_by: string | null
          user_id: string
        }
        Insert: {
          certificate_name: string
          created_at?: string
          created_by: string
          event_id?: string | null
          id?: string
          issued_at?: string
          revoked_at?: string | null
          revoked_by?: string | null
          user_id: string
        }
        Update: {
          certificate_name?: string
          created_at?: string
          created_by?: string
          event_id?: string | null
          id?: string
          issued_at?: string
          revoked_at?: string | null
          revoked_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_agenda_items: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          event_id: string
          id: string
          sort_order: number
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_id: string
          id?: string
          sort_order: number
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_id?: string
          id?: string
          sort_order?: number
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_agenda_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_private_details: {
        Row: {
          created_at: string
          event_id: string
          internal_notes: string | null
          meeting_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          internal_notes?: string | null
          meeting_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          internal_notes?: string | null
          meeting_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_private_details_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          registered_at: string
          source: Database["public"]["Enums"]["registration_source"]
          status: Database["public"]["Enums"]["registration_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          registered_at?: string
          source?: Database["public"]["Enums"]["registration_source"]
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          registered_at?: string
          source?: Database["public"]["Enums"]["registration_source"]
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_resources: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_published: boolean
          label: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_published?: boolean
          label: string
          sort_order: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_published?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_resources_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_speakers: {
        Row: {
          bio: string | null
          created_at: string
          event_id: string
          id: string
          image_path: string | null
          name: string
          role_title: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          event_id: string
          id?: string
          image_path?: string | null
          name: string
          role_title?: string | null
          sort_order: number
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          event_id?: string
          id?: string
          image_path?: string | null
          name?: string
          role_title?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_speakers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          description: string
          ends_at: string | null
          id: string
          image_path: string | null
          is_published: boolean
          location: string
          modality: Database["public"]["Enums"]["event_modality"]
          published_at: string | null
          registration_closes_at: string | null
          registration_opens_at: string | null
          registration_url: string | null
          requirements: string | null
          slug: string
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          summary: string
          title: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description: string
          ends_at?: string | null
          id?: string
          image_path?: string | null
          is_published?: boolean
          location: string
          modality: Database["public"]["Enums"]["event_modality"]
          published_at?: string | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          registration_url?: string | null
          requirements?: string | null
          slug: string
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          summary: string
          title: string
          updated_at?: string
          updated_by?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string
          ends_at?: string | null
          id?: string
          image_path?: string | null
          is_published?: boolean
          location?: string
          modality?: Database["public"]["Enums"]["event_modality"]
          published_at?: string | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          registration_url?: string | null
          requirements?: string | null
          slug?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          summary?: string
          title?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          approval_reference: string | null
          content: string
          created_at: string
          created_by: string | null
          document_type: Database["public"]["Enums"]["legal_document_type"]
          effective_at: string | null
          id: string
          is_current: boolean
          published_at: string | null
          published_by: string | null
          review_status: Database["public"]["Enums"]["legal_review_status"]
          status: Database["public"]["Enums"]["legal_document_status"]
          summary: string
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          approval_reference?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          document_type: Database["public"]["Enums"]["legal_document_type"]
          effective_at?: string | null
          id?: string
          is_current?: boolean
          published_at?: string | null
          published_by?: string | null
          review_status?: Database["public"]["Enums"]["legal_review_status"]
          status?: Database["public"]["Enums"]["legal_document_status"]
          summary: string
          title: string
          updated_at?: string
          version: string
        }
        Update: {
          approval_reference?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          document_type?: Database["public"]["Enums"]["legal_document_type"]
          effective_at?: string | null
          id?: string
          is_current?: boolean
          published_at?: string | null
          published_by?: string | null
          review_status?: Database["public"]["Enums"]["legal_review_status"]
          status?: Database["public"]["Enums"]["legal_document_status"]
          summary?: string
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      points_history: {
        Row: {
          action: Database["public"]["Enums"]["point_action"]
          created_at: string
          created_by: string | null
          event_id: string | null
          id: string
          metadata: Json
          points: number
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["point_action"]
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          metadata?: Json
          points: number
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["point_action"]
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          metadata?: Json
          points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          display_name: string
          id: string
          total_certifications: number
          total_points: number
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name: string
          id: string
          total_certifications?: number
          total_points?: number
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string
          id?: string
          total_certifications?: number
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      social_links: {
        Row: {
          active: boolean
          created_at: string
          icon: string
          icon_image_path: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
          updated_by: string | null
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon: string
          icon_image_path?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string
          icon_image_path?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          url?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          image_path: string | null
          image_url: string | null
          name: string
          role_title: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          name: string
          role_title: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          name?: string
          role_title?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_legal_acceptances: {
        Row: {
          accepted_at: string
          id: number
          legal_document_id: string
          source: Database["public"]["Enums"]["legal_acceptance_source"]
          user_id: string
        }
        Insert: {
          accepted_at?: string
          id?: never
          legal_document_id: string
          source: Database["public"]["Enums"]["legal_acceptance_source"]
          user_id: string
        }
        Update: {
          accepted_at?: string
          id?: never
          legal_document_id?: string
          source?: Database["public"]["Enums"]["legal_acceptance_source"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_legal_acceptances_legal_document_id_fkey"
            columns: ["legal_document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_current_legal_documents: { Args: never; Returns: number }
      admin_adjust_user_points: {
        Args: { p_points: number; p_reason: string; p_user_id: string }
        Returns: undefined
      }
      admin_list_attendance: {
        Args: { p_event_id?: string; p_search?: string }
        Returns: {
          attended: boolean
          display_name: string
          email: string
          event_id: string
          event_starts_at: string
          event_title: string
          registration_id: string
          registration_status: Database["public"]["Enums"]["registration_status"]
          user_id: string
        }[]
      }
      admin_list_users: {
        Args: { p_search: string }
        Returns: {
          attendance_count: number
          created_at: string
          display_name: string
          email: string
          registration_count: number
          role: Database["public"]["Enums"]["app_role"]
          total_certifications: number
          total_points: number
          user_id: string
        }[]
      }
      admin_set_certification_total: {
        Args: { p_total: number; p_user_id: string }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      approve_and_publish_legal_document: {
        Args: { p_approval_reference: string; p_document_id: string }
        Returns: undefined
      }
      create_legal_document: {
        Args: {
          p_content: string
          p_document_type: Database["public"]["Enums"]["legal_document_type"]
          p_effective_at: string
          p_summary: string
          p_title: string
          p_version: string
        }
        Returns: string
      }
      initiate_event_registration: {
        Args: { p_event_id: string }
        Returns: string
      }
      issue_certificate: {
        Args: {
          p_certificate_name: string
          p_event_id: string
          p_issued_at: string
          p_user_id: string
        }
        Returns: string
      }
      revoke_certificate: {
        Args: { p_certificate_id: string }
        Returns: undefined
      }
      set_event_attendance: {
        Args: { p_attended: boolean; p_event_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "USER" | "ADMIN"
      event_modality: "IN_PERSON" | "VIRTUAL" | "HYBRID"
      event_status: "PLANNED" | "ACTIVE" | "FINISHED"
      legal_acceptance_source: "SIGN_UP" | "ACCOUNT_RECONSENT"
      legal_document_status: "DRAFT" | "PUBLISHED" | "RETIRED"
      legal_document_type: "PRIVACY_NOTICE" | "TERMS_OF_USE" | "COOKIE_NOTICE"
      legal_review_status: "PENDING_REVIEW" | "APPROVED"
      point_action:
        | "REGISTRATION"
        | "ATTENDANCE"
        | "ATTENDANCE_REVERSAL"
        | "MANUAL_ADJUSTMENT"
      registration_source: "GOOGLE_FORMS" | "WEB_PLATFORM"
      registration_status:
        | "INITIATED"
        | "CONFIRMED"
        | "ATTENDED"
        | "CANCELLED"
        | "NO_SHOW"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["USER", "ADMIN"],
      event_modality: ["IN_PERSON", "VIRTUAL", "HYBRID"],
      event_status: ["PLANNED", "ACTIVE", "FINISHED"],
      legal_acceptance_source: ["SIGN_UP", "ACCOUNT_RECONSENT"],
      legal_document_status: ["DRAFT", "PUBLISHED", "RETIRED"],
      legal_document_type: ["PRIVACY_NOTICE", "TERMS_OF_USE", "COOKIE_NOTICE"],
      legal_review_status: ["PENDING_REVIEW", "APPROVED"],
      point_action: [
        "REGISTRATION",
        "ATTENDANCE",
        "ATTENDANCE_REVERSAL",
        "MANUAL_ADJUSTMENT",
      ],
      registration_source: ["GOOGLE_FORMS", "WEB_PLATFORM"],
      registration_status: [
        "INITIATED",
        "CONFIRMED",
        "ATTENDED",
        "CANCELLED",
        "NO_SHOW",
      ],
    },
  },
} as const
