export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string;
          actor_id: string | null;
          entity_id: string;
          entity_type: string;
          id: number;
          metadata: Json;
          occurred_at: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          entity_id: string;
          entity_type: string;
          id?: never;
          metadata?: Json;
          occurred_at?: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          entity_id?: string;
          entity_type?: string;
          id?: never;
          metadata?: Json;
          occurred_at?: string;
        };
        Relationships: [];
      };
      event_agenda_items: {
        Row: {
          created_at: string;
          description: string | null;
          ends_at: string | null;
          event_id: string;
          id: string;
          sort_order: number;
          starts_at: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          event_id: string;
          id?: string;
          sort_order: number;
          starts_at: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          event_id?: string;
          id?: string;
          sort_order?: number;
          starts_at?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_private_details: {
        Row: {
          created_at: string;
          event_id: string;
          internal_notes: string | null;
          meeting_url: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          internal_notes?: string | null;
          meeting_url?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          internal_notes?: string | null;
          meeting_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_registrations: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          registered_at: string;
          source: Database["public"]["Enums"]["registration_source"];
          status: Database["public"]["Enums"]["registration_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          registered_at?: string;
          source?: Database["public"]["Enums"]["registration_source"];
          status?: Database["public"]["Enums"]["registration_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          registered_at?: string;
          source?: Database["public"]["Enums"]["registration_source"];
          status?: Database["public"]["Enums"]["registration_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      event_resources: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          is_published: boolean;
          label: string;
          sort_order: number;
          updated_at: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          is_published?: boolean;
          label: string;
          sort_order: number;
          updated_at?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          is_published?: boolean;
          label?: string;
          sort_order?: number;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      event_speakers: {
        Row: {
          bio: string | null;
          created_at: string;
          event_id: string;
          id: string;
          name: string;
          role_title: string | null;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          event_id: string;
          id?: string;
          name: string;
          role_title?: string | null;
          sort_order: number;
          updated_at?: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          event_id?: string;
          id?: string;
          name?: string;
          role_title?: string | null;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          capacity: number | null;
          created_at: string;
          created_by: string;
          description: string;
          ends_at: string | null;
          id: string;
          image_path: string | null;
          is_published: boolean;
          location: string;
          modality: Database["public"]["Enums"]["event_modality"];
          published_at: string | null;
          registration_closes_at: string | null;
          registration_opens_at: string | null;
          registration_url: string | null;
          requirements: string | null;
          slug: string;
          starts_at: string;
          status: Database["public"]["Enums"]["event_status"];
          summary: string;
          title: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          capacity?: number | null;
          created_at?: string;
          created_by?: string;
          description: string;
          ends_at?: string | null;
          id?: string;
          image_path?: string | null;
          is_published?: boolean;
          location: string;
          modality: Database["public"]["Enums"]["event_modality"];
          published_at?: string | null;
          registration_closes_at?: string | null;
          registration_opens_at?: string | null;
          registration_url?: string | null;
          requirements?: string | null;
          slug: string;
          starts_at: string;
          status?: Database["public"]["Enums"]["event_status"];
          summary: string;
          title: string;
          updated_at?: string;
          updated_by?: string;
        };
        Update: {
          capacity?: number | null;
          created_at?: string;
          created_by?: string;
          description?: string;
          ends_at?: string | null;
          id?: string;
          image_path?: string | null;
          is_published?: boolean;
          location?: string;
          modality?: Database["public"]["Enums"]["event_modality"];
          published_at?: string | null;
          registration_closes_at?: string | null;
          registration_opens_at?: string | null;
          registration_url?: string | null;
          requirements?: string | null;
          slug?: string;
          starts_at?: string;
          status?: Database["public"]["Enums"]["event_status"];
          summary?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          created_at: string;
          display_name: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_path?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_path?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          assigned_by: string | null;
          created_at: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          assigned_by?: string | null;
          created_at?: string;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assigned_by?: string | null;
          created_at?: string;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      initiate_event_registration: {
        Args: { p_event_id: string };
        Returns: string;
      };
    };
    Enums: {
      app_role: "USER" | "ADMIN";
      event_modality: "IN_PERSON" | "VIRTUAL" | "HYBRID";
      event_status: "PLANNED" | "ACTIVE" | "FINISHED";
      registration_source: "GOOGLE_FORMS" | "WEB_PLATFORM";
      registration_status: "INITIATED" | "CONFIRMED" | "ATTENDED" | "CANCELLED" | "NO_SHOW";
    };
    CompositeTypes: Record<never, never>;
  };
};
