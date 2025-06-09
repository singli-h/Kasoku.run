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
          created_at: string
          id: number
          macrocycle_id: number | null
          mesocycle_id: number | null
        }
        Insert: {
          athlete_id?: number | null
          created_at?: string
          id?: number
          macrocycle_id?: number | null
          mesocycle_id?: number | null
        }
        Update: {
          athlete_id?: number | null
          created_at?: string
          id?: number
          macrocycle_id?: number | null
          mesocycle_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_cycles_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_cycles_macrocycle_id_fkey"
            columns: ["macrocycle_id"]
            isOneToOne: false
            referencedRelation: "macrocycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_cycles_mesocycle_id_fkey"
            columns: ["mesocycle_id"]
            isOneToOne: false
            referencedRelation: "mesocycles"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_group_histories: {
        Row: {
          athlete_id: number
          created_at: string | null
          created_by: number
          group_id: number
          id: number
          notes: string | null
        }
        Insert: {
          athlete_id: number
          created_at?: string | null
          created_by: number
          group_id: number
          id?: number
          notes?: string | null
        }
        Update: {
          athlete_id?: number
          created_at?: string | null
          created_by?: number
          group_id?: number
          id?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_group_histories_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_group_histories_group_id_fkey"
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
          created_at: string
          group_name: string
          id: number
        }
        Insert: {
          coach_id?: number | null
          created_at?: string
          group_name: string
          id?: number
        }
        Update: {
          coach_id?: number | null
          created_at?: string
          group_name?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "athlete_groups_coach_id_fkey"
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
            foreignKeyName: "athletes_athlete_group_id_fkey"
            columns: ["athlete_group_id"]
            isOneToOne: false
            referencedRelation: "athlete_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athletes_user_id_fkey"
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
            foreignKeyName: "coaches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          created_at: string
          id: number
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: number
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: number
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      exercise_preset_details: {
        Row: {
          created_at: string
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
          set_index: number
          tempo: string | null
          velocity: number | null
          weight: number | null
        }
        Insert: {
          created_at?: string
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
          set_index: number
          tempo?: string | null
          velocity?: number | null
          weight?: number | null
        }
        Update: {
          created_at?: string
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
          set_index?: number
          tempo?: string | null
          velocity?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_preset_details_exercise_preset_id_fkey"
            columns: ["exercise_preset_id"]
            isOneToOne: false
            referencedRelation: "exercise_presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_preset_details_resistance_unit_id_fkey"
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
          date: string
          day: number | null
          deleted: boolean | null
          description: string | null
          id: number
          microcycle_id: number | null
          name: string
          session_mode: string
          updated_at: string | null
          user_id: number | null
          week: number | null
        }
        Insert: {
          athlete_group_id?: number | null
          created_at?: string | null
          date: string
          day?: number | null
          deleted?: boolean | null
          description?: string | null
          id?: number
          microcycle_id?: number | null
          name: string
          session_mode?: string
          updated_at?: string | null
          user_id?: number | null
          week?: number | null
        }
        Update: {
          athlete_group_id?: number | null
          created_at?: string | null
          date?: string
          day?: number | null
          deleted?: boolean | null
          description?: string | null
          id?: number
          microcycle_id?: number | null
          name?: string
          session_mode?: string
          updated_at?: string | null
          user_id?: number | null
          week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_preset_groups_athlete_group_id_fkey"
            columns: ["athlete_group_id"]
            isOneToOne: false
            referencedRelation: "athlete_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_preset_groups_microcycle_id_fkey"
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
          exercise_id: number
          exercise_preset_group_id: number
          id: number
          notes: string | null
          preset_order: number
          superset_id: number | null
        }
        Insert: {
          exercise_id: number
          exercise_preset_group_id: number
          id?: number
          notes?: string | null
          preset_order: number
          superset_id?: number | null
        }
        Update: {
          exercise_id?: number
          exercise_preset_group_id?: number
          id?: number
          notes?: string | null
          preset_order?: number
          superset_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_presets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_presets_exercise_preset_group_id_fkey"
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
            foreignKeyName: "ExerciseTag_ExerciseId_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ExerciseTag_TagId_fkey"
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
          created_at: string
          distance: number | null
          duration: unknown | null
          exercise_preset_id: number
          exercise_training_session_id: number | null
          id: number
          metadata: Json | null
          power: number | null
          reps: number | null
          resistance: number | null
          resistance_unit_id: number | null
          set_index: number
          tempo: string | null
          velocity: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          distance?: number | null
          duration?: unknown | null
          exercise_preset_id: number
          exercise_training_session_id?: number | null
          id?: number
          metadata?: Json | null
          power?: number | null
          reps?: number | null
          resistance?: number | null
          resistance_unit_id?: number | null
          set_index: number
          tempo?: string | null
          velocity?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          distance?: number | null
          duration?: unknown | null
          exercise_preset_id?: number
          exercise_training_session_id?: number | null
          id?: number
          metadata?: Json | null
          power?: number | null
          reps?: number | null
          resistance?: number | null
          resistance_unit_id?: number | null
          set_index?: number
          tempo?: string | null
          velocity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_training_details_exercise_preset_id_fkey"
            columns: ["exercise_preset_id"]
            isOneToOne: false
            referencedRelation: "exercise_presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_training_details_exercise_training_session_id_fkey"
            columns: ["exercise_training_session_id"]
            isOneToOne: false
            referencedRelation: "exercise_training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_training_details_resistance_unit_id_fkey"
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
          created_at: string
          date_time: string
          description: string | null
          exercise_preset_group_id: number | null
          id: number
          notes: string | null
          session_mode: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          athlete_group_id?: number | null
          athlete_id?: number | null
          created_at?: string
          date_time: string
          description?: string | null
          exercise_preset_group_id?: number | null
          id?: number
          notes?: string | null
          session_mode?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          athlete_group_id?: number | null
          athlete_id?: number | null
          created_at?: string
          date_time?: string
          description?: string | null
          exercise_preset_group_id?: number | null
          id?: number
          notes?: string | null
          session_mode?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_training_sessions_athlete_group_id_fkey"
            columns: ["athlete_group_id"]
            isOneToOne: false
            referencedRelation: "athlete_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_training_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_training_sessions_exercise_preset_group_id_fkey"
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
          type: string
        }
        Insert: {
          description?: string | null
          id?: number
          type: string
        }
        Update: {
          description?: string | null
          id?: number
          type?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          description: string | null
          exercise_type_id: number
          id: number
          name: string
          unit_id: number | null
          video_url: string | null
        }
        Insert: {
          description?: string | null
          exercise_type_id: number
          id?: number
          name: string
          unit_id?: number | null
          video_url?: string | null
        }
        Update: {
          description?: string | null
          exercise_type_id?: number
          id?: number
          name?: string
          unit_id?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_exercise_type_id_fkey"
            columns: ["exercise_type_id"]
            isOneToOne: false
            referencedRelation: "exercise_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_unit_id_fkey"
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
          created_at: string
          description: string | null
          end_date: string
          id: number
          name: string
          start_date: string
          user_id: number
        }
        Insert: {
          athlete_group_id?: number | null
          created_at?: string
          description?: string | null
          end_date: string
          id?: number
          name: string
          start_date: string
          user_id: number
        }
        Update: {
          athlete_group_id?: number | null
          created_at?: string
          description?: string | null
          end_date?: string
          id?: number
          name?: string
          start_date?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "macrocycles_athlete_group_id_fkey"
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
          created_at: string
          description: string | null
          end_date: string
          id: number
          macrocycle_id: number | null
          metadata: Json | null
          name: string
          start_date: string
          user_id: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: number
          macrocycle_id?: number | null
          metadata?: Json | null
          name: string
          start_date: string
          user_id: number
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: number
          macrocycle_id?: number | null
          metadata?: Json | null
          name?: string
          start_date?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "mesocycles_macrocycle_id_fkey"
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
          created_at: string
          description: string | null
          end_date: string
          id: number
          mesocycle_id: number | null
          name: string
          start_date: string
          user_id: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: number
          mesocycle_id?: number | null
          name: string
          start_date: string
          user_id: number
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: number
          mesocycle_id?: number | null
          name?: string
          start_date?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "microcycles_mesocycle_id_fkey"
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
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          description: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
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
        Args: { _clerk_id: string }
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

export const Constants = {
  public: {
    Enums: {},
  },
} as const
