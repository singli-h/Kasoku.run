// Kasoku Running Website - Database Type Definitions
// Generated from actual Supabase schema (Project: pcteaouusthwbgzczoae)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      athlete_cycles: {
        Row: {
          athlete_id: number | null
          created_at: string | null
          id: number
          macrocycle_id: number | null
          mesocycle_id: number | null
        }
        Insert: {
          athlete_id?: number | null
          created_at?: string | null
          id?: number
          macrocycle_id?: number | null
          mesocycle_id?: number | null
        }
        Update: {
          athlete_id?: number | null
          created_at?: string | null
          id?: number
          macrocycle_id?: number | null
          mesocycle_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_athlete_cycles_athlete_id"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_athlete_cycles_macrocycle_id"
            columns: ["macrocycle_id"]
            isOneToOne: false
            referencedRelation: "macrocycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_athlete_cycles_mesocycle_id"
            columns: ["mesocycle_id"]
            isOneToOne: false
            referencedRelation: "mesocycles"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_group_histories: {
        Row: {
          athlete_id: number | null
          created_at: string | null
          created_by: number | null
          group_id: number | null
          id: number
          notes: string | null
        }
        Insert: {
          athlete_id?: number | null
          created_at?: string | null
          created_by?: number | null
          group_id?: number | null
          id?: number
          notes?: string | null
        }
        Update: {
          athlete_id?: number | null
          created_at?: string | null
          created_by?: number | null
          group_id?: number | null
          id?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_agh_athlete_id"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agh_group_id"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "athlete_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_groups: {
        Row: {
          coach_id: number | null
          created_at: string | null
          group_name: string | null
          id: number
        }
        Insert: {
          coach_id?: number | null
          created_at?: string | null
          group_name?: string | null
          id?: number
        }
        Update: {
          coach_id?: number | null
          created_at?: string | null
          group_name?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_ag_coach_id"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      athletes: {
        Row: {
          athlete_group_id: number | null
          events: Json | null
          experience: string | null
          height: number | null
          id: number
          training_goals: string | null
          user_id: number | null
          weight: number | null
        }
        Insert: {
          athlete_group_id?: number | null
          events?: Json | null
          experience?: string | null
          height?: number | null
          id?: number
          training_goals?: string | null
          user_id?: number | null
          weight?: number | null
        }
        Update: {
          athlete_group_id?: number | null
          events?: Json | null
          experience?: string | null
          height?: number | null
          id?: number
          training_goals?: string | null
          user_id?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_athletes_group"
            columns: ["athlete_group_id"]
            isOneToOne: false
            referencedRelation: "athlete_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_athletes_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          experience: string | null
          id: number
          philosophy: string | null
          speciality: string | null
          sport_focus: string | null
          user_id: number | null
        }
        Insert: {
          experience?: string | null
          id?: number
          philosophy?: string | null
          speciality?: string | null
          sport_focus?: string | null
          user_id?: number | null
        }
        Update: {
          experience?: string | null
          id?: number
          philosophy?: string | null
          speciality?: string | null
          sport_focus?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_coaches_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string | null
          created_at: string | null
          id: number
          name: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: number
          name: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: number
          name?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      exercise_preset_details: {
        Row: {
          created_at: string | null
          distance: number | null
          effort: number | null
          exercise_preset_id: number | null
          height: number | null
          id: number
          metadata: Json | null
          performing_time: number | null
          power: number | null
          reps: number | null
          resistance: number | null
          resistance_unit_id: number | null
          rest_time: number | null
          rpe: number | null
          set_index: number | null
          tempo: string | null
          velocity: number | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          distance?: number | null
          effort?: number | null
          exercise_preset_id?: number | null
          height?: number | null
          id?: number
          metadata?: Json | null
          performing_time?: number | null
          power?: number | null
          reps?: number | null
          resistance?: number | null
          resistance_unit_id?: number | null
          rest_time?: number | null
          rpe?: number | null
          set_index?: number | null
          tempo?: string | null
          velocity?: number | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          distance?: number | null
          effort?: number | null
          exercise_preset_id?: number | null
          height?: number | null
          id?: number
          metadata?: Json | null
          performing_time?: number | null
          power?: number | null
          reps?: number | null
          resistance?: number | null
          resistance_unit_id?: number | null
          rest_time?: number | null
          rpe?: number | null
          set_index?: number | null
          tempo?: string | null
          velocity?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_epd_preset"
            columns: ["exercise_preset_id"]
            isOneToOne: false
            referencedRelation: "exercise_presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_epd_unit"
            columns: ["resistance_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_preset_groups: {
        Row: {
          athlete_group_id: number | null
          created_at: string | null
          date: string | null
          day: number | null
          deleted: boolean | null
          description: string | null
          id: number
          is_template: boolean | null
          microcycle_id: number | null
          name: string | null
          session_mode: string | null
          updated_at: string | null
          user_id: number | null
          week: number | null
        }
        Insert: {
          athlete_group_id?: number | null
          created_at?: string | null
          date: string | null
          day?: number | null
          deleted?: boolean | null
          description?: string | null
          id?: number
          is_template?: boolean | null
          microcycle_id?: number | null
          name: string | null
          session_mode?: string | null
          updated_at?: string | null
          user_id?: number | null
          week?: number | null
        }
        Update: {
          athlete_group_id?: number | null
          created_at?: string | null
          date?: string | null
          day?: number | null
          deleted?: boolean | null
          description?: string | null
          id?: number
          is_template?: boolean | null
          microcycle_id?: number | null
          name?: string | null
          session_mode?: string | null
          updated_at?: string | null
          user_id?: number | null
          week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_epg_athlete_group"
            columns: ["athlete_group_id"]
            isOneToOne: false
            referencedRelation: "athlete_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_epg_microcycle"
            columns: ["microcycle_id"]
            isOneToOne: false
            referencedRelation: "microcycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_preset_groups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_presets: {
        Row: {
          exercise_id: number | null
          exercise_preset_group_id: number | null
          id: number
          notes: string | null
          preset_order: number | null
          superset_id: number | null
        }
        Insert: {
          exercise_id?: number | null
          exercise_preset_group_id?: number | null
          id?: number
          notes?: string | null
          preset_order?: number | null
          superset_id?: number | null
        }
        Update: {
          exercise_id?: number | null
          exercise_preset_group_id?: number | null
          id?: number
          notes?: string | null
          preset_order?: number | null
          superset_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ep_exercise"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ep_group"
            columns: ["exercise_preset_group_id"]
            isOneToOne: false
            referencedRelation: "exercise_preset_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_tags: {
        Row: {
          exercise_id: number | null
          id: number
          tag_id: number | null
        }
        Insert: {
          exercise_id?: number | null
          id?: number
          tag_id?: number | null
        }
        Update: {
          exercise_id?: number | null
          id?: number
          tag_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_et_exercise"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_et_tag"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_training_details: {
        Row: {
          completed: boolean | null
          created_at: string | null
          distance: number | null
          duration: string | null
          exercise_preset_id: number | null
          exercise_training_session_id: number | null
          id: number
          metadata: Json | null
          power: number | null
          reps: number | null
          resistance: number | null
          resistance_unit_id: number | null
          set_index: number | null
          tempo: string | null
          velocity: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          distance?: number | null
          duration?: string | null
          exercise_preset_id?: number | null
          exercise_training_session_id?: number | null
          id?: number
          metadata?: Json | null
          power?: number | null
          reps?: number | null
          resistance?: number | null
          resistance_unit_id?: number | null
          set_index?: number | null
          tempo?: string | null
          velocity?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          distance?: number | null
          duration?: string | null
          exercise_preset_id?: number | null
          exercise_training_session_id?: number | null
          id?: number
          metadata?: Json | null
          power?: number | null
          reps?: number | null
          resistance?: number | null
          resistance_unit_id?: number | null
          set_index?: number | null
          tempo?: string | null
          velocity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_etd_preset"
            columns: ["exercise_preset_id"]
            isOneToOne: false
            referencedRelation: "exercise_presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_etd_session"
            columns: ["exercise_training_session_id"]
            isOneToOne: false
            referencedRelation: "exercise_training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_etd_unit"
            columns: ["resistance_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_training_sessions: {
        Row: {
          athlete_group_id: number | null
          athlete_id: number | null
          created_at: string | null
          date_time: string | null
          description: string | null
          exercise_preset_group_id: number | null
          id: number
          notes: string | null
          session_mode: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          athlete_group_id?: number | null
          athlete_id?: number | null
          created_at?: string | null
          date_time: string | null
          description?: string | null
          exercise_preset_group_id?: number | null
          id?: number
          notes?: string | null
          session_mode?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          athlete_group_id?: number | null
          athlete_id?: number | null
          created_at?: string | null
          date_time?: string | null
          description?: string | null
          exercise_preset_group_id?: number | null
          id?: number
          notes?: string | null
          session_mode?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ets_athlete"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ets_group"
            columns: ["athlete_group_id"]
            isOneToOne: false
            referencedRelation: "athlete_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ets_preset_group"
            columns: ["exercise_preset_group_id"]
            isOneToOne: false
            referencedRelation: "exercise_preset_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_types: {
        Row: {
          description: string | null
          id: number
          type: string | null
        }
        Insert: {
          description?: string | null
          id?: number
          type: string | null
        }
        Update: {
          description?: string | null
          id?: number
          type?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          description: string | null
          exercise_type_id: number | null
          id: number
          name: string | null
          unit_id: number | null
          video_url: string | null
        }
        Insert: {
          description?: string | null
          exercise_type_id?: number | null
          id?: number
          name: string | null
          unit_id?: number | null
          video_url?: string | null
        }
        Update: {
          description?: string | null
          exercise_type_id?: number | null
          id?: number
          name?: string | null
          unit_id?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_exercise_type"
            columns: ["exercise_type_id"]
            isOneToOne: false
            referencedRelation: "exercise_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_exercise_unit"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      macrocycles: {
        Row: {
          athlete_group_id: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: number
          name: string | null
          start_date: string | null
          user_id: number | null
        }
        Insert: {
          athlete_group_id?: number | null
          created_at?: string | null
          description?: string | null
          end_date: string | null
          id?: number
          name: string | null
          start_date: string | null
          user_id?: number | null
        }
        Update: {
          athlete_group_id?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          name?: string | null
          start_date?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_macrocycles_group"
            columns: ["athlete_group_id"]
            isOneToOne: false
            referencedRelation: "athlete_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "macrocycles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mesocycles: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: number
          macrocycle_id: number | null
          metadata: Json | null
          name: string | null
          start_date: string | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string | null
          id?: number
          macrocycle_id?: number | null
          metadata?: Json | null
          name: string | null
          start_date: string | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          macrocycle_id?: number | null
          metadata?: Json | null
          name?: string | null
          start_date?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_mesocycles_macrocycle"
            columns: ["macrocycle_id"]
            isOneToOne: false
            referencedRelation: "macrocycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mesocycles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      microcycles: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: number
          mesocycle_id: number | null
          name: string | null
          start_date: string | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string | null
          id?: number
          mesocycle_id?: number | null
          name: string | null
          start_date: string | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          mesocycle_id?: number | null
          name?: string | null
          start_date?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_microcycles_mesocycle"
            columns: ["mesocycle_id"]
            isOneToOne: false
            referencedRelation: "mesocycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "microcycles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: number
          name: string | null
        }
        Insert: {
          id?: number
          name: string | null
        }
        Update: {
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          description: string | null
          id: number
          name: string | null
        }
        Insert: {
          description?: string | null
          id?: number
          name: string | null
        }
        Update: {
          description?: string | null
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          birthdate: string | null
          clerk_id: string | null
          created_at: string
          deleted_at: string | null
          email: string
          first_name: string | null
          id: number
          last_name: string | null
          metadata: Json | null
          onboarding_completed: boolean | null
          role: string
          sex: string | null
          subscription_status: string
          timezone: string
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          birthdate?: string | null
          clerk_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          first_name?: string | null
          id?: number
          last_name?: string | null
          metadata?: Json | null
          onboarding_completed?: boolean | null
          role: string
          sex?: string | null
          subscription_status?: string
          timezone: string
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          birthdate?: string | null
          clerk_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          first_name?: string | null
          id?: number
          last_name?: string | null
          metadata?: Json | null
          onboarding_completed?: boolean | null
          role?: string
          sex?: string | null
          subscription_status?: string
          timezone?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role_data: {
        Args: {
          _clerk_id: string
        }
        Returns: {
          user_id: number
          role: string
          athlete_id: number
          athlete_group_id: number
          coach_id: number
        }[]
      }
      unuse: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Utility types for easier access
type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// Kasoku-specific type aliases for easier usage
export type User = Tables<"users">
export type Athlete = Tables<"athletes">
export type Coach = Tables<"coaches">
export type AthleteGroup = Tables<"athlete_groups">
export type AthleteGroupHistory = Tables<"athlete_group_histories">
export type AthleteCycle = Tables<"athlete_cycles">
export type Exercise = Tables<"exercises">
export type ExerciseType = Tables<"exercise_types">
export type ExercisePreset = Tables<"exercise_presets">
export type ExercisePresetGroup = Tables<"exercise_preset_groups">
export type ExercisePresetDetail = Tables<"exercise_preset_details">
export type ExerciseTrainingSession = Tables<"exercise_training_sessions">
export type ExerciseTrainingDetail = Tables<"exercise_training_details">
export type ExerciseTag = Tables<"exercise_tags">
export type Macrocycle = Tables<"macrocycles">
export type Mesocycle = Tables<"mesocycles">
export type Microcycle = Tables<"microcycles">
export type Unit = Tables<"units">
export type Tag = Tables<"tags">
export type Event = Tables<"events">

// Insert types
export type UserInsert = TablesInsert<"users">
export type AthleteInsert = TablesInsert<"athletes">
export type CoachInsert = TablesInsert<"coaches">
export type AthleteGroupInsert = TablesInsert<"athlete_groups">
export type AthleteGroupHistoryInsert = TablesInsert<"athlete_group_histories">
export type AthleteCycleInsert = TablesInsert<"athlete_cycles">
export type ExerciseInsert = TablesInsert<"exercises">
export type ExercisePresetInsert = TablesInsert<"exercise_presets">
export type ExercisePresetGroupInsert = TablesInsert<"exercise_preset_groups">
export type ExerciseTrainingSessionInsert = TablesInsert<"exercise_training_sessions">
export type MacrocycleInsert = TablesInsert<"macrocycles">
export type MesocycleInsert = TablesInsert<"mesocycles">
export type MicrocycleInsert = TablesInsert<"microcycles">
export type EventInsert = TablesInsert<"events">

// Update types
export type UserUpdate = TablesUpdate<"users">
export type AthleteUpdate = TablesUpdate<"athletes">
export type CoachUpdate = TablesUpdate<"coaches">
export type AthleteGroupUpdate = TablesUpdate<"athlete_groups">
export type AthleteGroupHistoryUpdate = TablesUpdate<"athlete_group_histories">
export type AthleteCycleUpdate = TablesUpdate<"athlete_cycles">
export type ExerciseUpdate = TablesUpdate<"exercises">
export type ExercisePresetUpdate = TablesUpdate<"exercise_presets">
export type ExercisePresetGroupUpdate = TablesUpdate<"exercise_preset_groups">
export type ExerciseTrainingSessionUpdate = TablesUpdate<"exercise_training_sessions">
export type MacrocycleUpdate = TablesUpdate<"macrocycles">
export type MesocycleUpdate = TablesUpdate<"mesocycles">
export type MicrocycleUpdate = TablesUpdate<"microcycles">
export type EventUpdate = TablesUpdate<"events">

// Extended types with relationships
export interface UserWithProfile extends User {
  athlete?: Athlete | null
  coach?: Coach | null
}

export interface AthleteWithDetails extends Athlete {
  user?: User | null
  athlete_group?: AthleteGroup | null
}

export interface CoachWithDetails extends Coach {
  user?: User | null
  athlete_groups?: AthleteGroup[]
}

export interface AthleteGroupWithDetails extends AthleteGroup {
  coach?: Coach | null
  athletes?: Athlete[]
}

export interface ExerciseWithDetails extends Exercise {
  exercise_type?: ExerciseType | null
  unit?: Unit | null
  tags?: Tag[]
}

export interface ExercisePresetGroupWithDetails extends ExercisePresetGroup {
  exercise_presets?: (ExercisePreset & {
    exercise?: Exercise | null
    exercise_preset_details?: ExercisePresetDetail[]
  })[]
  microcycle?: Microcycle | null
  athlete_group?: AthleteGroup | null
}

export interface ExerciseTrainingSessionWithDetails extends ExerciseTrainingSession {
  exercise_preset_group?: ExercisePresetGroup | null
  athlete?: Athlete | null
  athlete_group?: AthleteGroup | null
  exercise_training_details?: ExerciseTrainingDetail[]
}

export interface MacrocycleWithDetails extends Macrocycle {
  mesocycles?: Mesocycle[]
  athlete_group?: AthleteGroup | null
  user?: User | null
}

export interface MesocycleWithDetails extends Mesocycle {
  macrocycle?: Macrocycle | null
  microcycles?: Microcycle[]
  user?: User | null
}

export interface MicrocycleWithDetails extends Microcycle {
  mesocycle?: Mesocycle | null
  exercise_preset_groups?: ExercisePresetGroup[]
  user?: User | null
}

// Enums and constants
export type UserRole = "athlete" | "coach" | "admin"
export type RoleName = "athlete" | "coach" | "admin" // Alias for compatibility
export type SessionMode = "individual" | "group"
export type SessionStatus = "planned" | "in_progress" | "completed" | "cancelled"
export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "elite"
export type Gender = "male" | "female" | "other"
export type SubscriptionStatus = "free" | "premium" | "pro" | "cancelled"