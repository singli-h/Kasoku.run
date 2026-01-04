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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_memories: {
        Row: {
          athlete_id: number | null
          coach_id: number | null
          content: string
          created_at: string
          created_by: number
          embedding: string | null
          group_id: number | null
          id: number
          memory_type: Database["public"]["Enums"]["memory_type"]
          metadata: Json | null
          title: string | null
          updated_at: string
        }
        Insert: {
          athlete_id?: number | null
          coach_id?: number | null
          content: string
          created_at?: string
          created_by: number
          embedding?: string | null
          group_id?: number | null
          id?: number
          memory_type: Database["public"]["Enums"]["memory_type"]
          metadata?: Json | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: number | null
          coach_id?: number | null
          content?: string
          created_at?: string
          created_by?: number
          embedding?: string | null
          group_id?: number | null
          id?: number
          memory_type?: Database["public"]["Enums"]["memory_type"]
          metadata?: Json | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_memories_athlete"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_memories_coach"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_memories_group"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "athlete_groups"
            referencedColumns: ["id"]
          },
        ]
      }
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
          updated_at: string | null
        }
        Insert: {
          coach_id?: number | null
          created_at?: string | null
          group_name?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          coach_id?: number | null
          created_at?: string | null
          group_name?: string | null
          id?: number
          updated_at?: string | null
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
      athlete_personal_bests: {
        Row: {
          achieved_date: string
          athlete_id: number
          created_at: string | null
          event_id: number | null
          exercise_id: number | null
          id: number
          metadata: Json | null
          notes: string | null
          old_session_id: number | null
          session_id: string | null
          unit_id: number
          updated_at: string | null
          value: number
          verified: boolean | null
        }
        Insert: {
          achieved_date?: string
          athlete_id: number
          created_at?: string | null
          event_id?: number | null
          exercise_id?: number | null
          id?: number
          metadata?: Json | null
          notes?: string | null
          old_session_id?: number | null
          session_id?: string | null
          unit_id: number
          updated_at?: string | null
          value: number
          verified?: boolean | null
        }
        Update: {
          achieved_date?: string
          athlete_id?: number
          created_at?: string | null
          event_id?: number | null
          exercise_id?: number | null
          id?: number
          metadata?: Json | null
          notes?: string | null
          old_session_id?: number | null
          session_id?: string | null
          unit_id?: number
          updated_at?: string | null
          value?: number
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_personal_bests_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_personal_bests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_personal_bests_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_personal_bests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_personal_bests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      athletes: {
        Row: {
          athlete_group_id: number | null
          created_at: string | null
          events: Json | null
          experience: string | null
          height: number | null
          id: number
          training_goals: string | null
          updated_at: string | null
          user_id: number
          weight: number | null
        }
        Insert: {
          athlete_group_id?: number | null
          created_at?: string | null
          events?: Json | null
          experience?: string | null
          height?: number | null
          id?: number
          training_goals?: string | null
          updated_at?: string | null
          user_id: number
          weight?: number | null
        }
        Update: {
          athlete_group_id?: number | null
          created_at?: string | null
          events?: Json | null
          experience?: string | null
          height?: number | null
          id?: number
          training_goals?: string | null
          updated_at?: string | null
          user_id?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athletes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_athletes_group"
            columns: ["athlete_group_id"]
            isOneToOne: false
            referencedRelation: "athlete_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          created_at: string | null
          experience: string | null
          id: number
          philosophy: string | null
          speciality: string | null
          sport_focus: string | null
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          experience?: string | null
          id?: number
          philosophy?: string | null
          speciality?: string | null
          sport_focus?: string | null
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          experience?: string | null
          id?: number
          philosophy?: string | null
          speciality?: string | null
          sport_focus?: string | null
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coaches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
          name?: string | null
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
      exercise_types: {
        Row: {
          description: string | null
          id: number
          type: string | null
        }
        Insert: {
          description?: string | null
          id?: number
          type?: string | null
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
          created_at: string | null
          description: string | null
          embedding: string | null
          exercise_type_id: number | null
          id: number
          is_archived: boolean | null
          name: string | null
          owner_user_id: number | null
          search_tsv: unknown
          unit_id: number | null
          updated_at: string | null
          video_url: string | null
          visibility:
            | Database["public"]["Enums"]["exercise_visibility_type"]
            | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          exercise_type_id?: number | null
          id?: number
          is_archived?: boolean | null
          name?: string | null
          owner_user_id?: number | null
          search_tsv?: unknown
          unit_id?: number | null
          updated_at?: string | null
          video_url?: string | null
          visibility?:
            | Database["public"]["Enums"]["exercise_visibility_type"]
            | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          exercise_type_id?: number | null
          id?: number
          is_archived?: boolean | null
          name?: string | null
          owner_user_id?: number | null
          search_tsv?: unknown
          unit_id?: number | null
          updated_at?: string | null
          video_url?: string | null
          visibility?:
            | Database["public"]["Enums"]["exercise_visibility_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
      knowledge_base_articles: {
        Row: {
          category_id: number | null
          coach_id: number
          content: Json
          created_at: string
          id: number
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: number | null
          coach_id: number
          content: Json
          created_at?: string
          id?: number
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: number | null
          coach_id?: number
          content?: Json
          created_at?: string
          id?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_kb_articles_category_id"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_kb_articles_coach_id"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_categories: {
        Row: {
          article_count: number | null
          coach_id: number
          color: string
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          article_count?: number | null
          coach_id: number
          color: string
          created_at?: string
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          article_count?: number | null
          coach_id?: number
          color?: string
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_kb_categories_coach_id"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
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
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          athlete_group_id?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          name?: string | null
          start_date?: string | null
          updated_at?: string | null
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
          updated_at?: string | null
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
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          macrocycle_id?: number | null
          metadata?: Json | null
          name?: string | null
          start_date?: string | null
          updated_at?: string | null
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
          updated_at?: string | null
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
          intensity: number | null
          mesocycle_id: number | null
          name: string | null
          start_date: string | null
          updated_at: string | null
          user_id: number | null
          volume: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          intensity?: number | null
          mesocycle_id?: number | null
          name?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: number | null
          volume?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          intensity?: number | null
          mesocycle_id?: number | null
          name?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: number | null
          volume?: number | null
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
      races: {
        Row: {
          created_at: string | null
          date: string
          id: number
          location: string | null
          macrocycle_id: number | null
          name: string
          notes: string | null
          type: string
          updated_at: string | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: number
          location?: string | null
          macrocycle_id?: number | null
          name: string
          notes?: string | null
          type?: string
          updated_at?: string | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: number
          location?: string | null
          macrocycle_id?: number | null
          name?: string
          notes?: string | null
          type?: string
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "races_macrocycle_id_fkey"
            columns: ["macrocycle_id"]
            isOneToOne: false
            referencedRelation: "macrocycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "races_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      session_plan_exercises: {
        Row: {
          created_at: string | null
          exercise_id: number | null
          exercise_order: number | null
          id: string
          notes: string | null
          session_plan_id: string | null
          superset_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_id?: number | null
          exercise_order?: number | null
          id?: string
          notes?: string | null
          session_plan_id?: string | null
          superset_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: number | null
          exercise_order?: number | null
          id?: string
          notes?: string | null
          session_plan_id?: string | null
          superset_id?: number | null
          updated_at?: string | null
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
            foreignKeyName: "fk_session_plan_exercises_session_plan"
            columns: ["session_plan_id"]
            isOneToOne: false
            referencedRelation: "session_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      session_plan_sets: {
        Row: {
          created_at: string | null
          distance: number | null
          effort: number | null
          height: number | null
          id: string
          metadata: Json | null
          performing_time: number | null
          power: number | null
          reps: number | null
          resistance: number | null
          resistance_unit_id: number | null
          rest_time: number | null
          rpe: number | null
          session_plan_exercise_id: string | null
          set_index: number | null
          tempo: string | null
          updated_at: string | null
          velocity: number | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          distance?: number | null
          effort?: number | null
          height?: number | null
          id?: string
          metadata?: Json | null
          performing_time?: number | null
          power?: number | null
          reps?: number | null
          resistance?: number | null
          resistance_unit_id?: number | null
          rest_time?: number | null
          rpe?: number | null
          session_plan_exercise_id?: string | null
          set_index?: number | null
          tempo?: string | null
          updated_at?: string | null
          velocity?: number | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          distance?: number | null
          effort?: number | null
          height?: number | null
          id?: string
          metadata?: Json | null
          performing_time?: number | null
          power?: number | null
          reps?: number | null
          resistance?: number | null
          resistance_unit_id?: number | null
          rest_time?: number | null
          rpe?: number | null
          session_plan_exercise_id?: string | null
          set_index?: number | null
          tempo?: string | null
          updated_at?: string | null
          velocity?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_epd_unit"
            columns: ["resistance_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_session_plan_sets_session_plan_exercise"
            columns: ["session_plan_exercise_id"]
            isOneToOne: false
            referencedRelation: "session_plan_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      session_plans: {
        Row: {
          athlete_group_id: number | null
          created_at: string | null
          date: string | null
          day: number | null
          deleted: boolean | null
          description: string | null
          id: string
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
          date?: string | null
          day?: number | null
          deleted?: boolean | null
          description?: string | null
          id?: string
          is_template?: boolean | null
          microcycle_id?: number | null
          name?: string | null
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
          id?: string
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
            foreignKeyName: "fk_session_plans_athlete_group"
            columns: ["athlete_group_id"]
            isOneToOne: false
            referencedRelation: "athlete_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_session_plans_microcycle"
            columns: ["microcycle_id"]
            isOneToOne: false
            referencedRelation: "microcycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          category: string | null
          id: number
          name: string | null
        }
        Insert: {
          category?: string | null
          id?: number
          name?: string | null
        }
        Update: {
          category?: string | null
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
          name?: string | null
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
          clerk_id: string
          created_at: string
          deleted_at: string | null
          email: string
          first_name: string | null
          id: number
          last_name: string | null
          metadata: Json | null
          onboarding_completed: boolean | null
          role: Database["public"]["Enums"]["role"]
          sex: string | null
          subscription_status: string
          timezone: string
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          birthdate?: string | null
          clerk_id: string
          created_at?: string
          deleted_at?: string | null
          email: string
          first_name?: string | null
          id?: number
          last_name?: string | null
          metadata?: Json | null
          onboarding_completed?: boolean | null
          role?: Database["public"]["Enums"]["role"]
          sex?: string | null
          subscription_status?: string
          timezone: string
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          birthdate?: string | null
          clerk_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string
          first_name?: string | null
          id?: number
          last_name?: string | null
          metadata?: Json | null
          onboarding_completed?: boolean | null
          role?: Database["public"]["Enums"]["role"]
          sex?: string | null
          subscription_status?: string
          timezone?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      workout_log_exercises: {
        Row: {
          created_at: string
          exercise_id: number
          exercise_order: number
          id: string
          notes: string | null
          session_plan_exercise_id: string | null
          superset_id: number | null
          updated_at: string
          workout_log_id: string | null
        }
        Insert: {
          created_at?: string
          exercise_id: number
          exercise_order: number
          id?: string
          notes?: string | null
          session_plan_exercise_id?: string | null
          superset_id?: number | null
          updated_at?: string
          workout_log_id?: string | null
        }
        Update: {
          created_at?: string
          exercise_id?: number
          exercise_order?: number
          id?: string
          notes?: string | null
          session_plan_exercise_id?: string | null
          superset_id?: number | null
          updated_at?: string
          workout_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_log_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_log_exercises_session_plan_exercise_id_fkey"
            columns: ["session_plan_exercise_id"]
            isOneToOne: false
            referencedRelation: "session_plan_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_log_exercises_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_log_sets: {
        Row: {
          completed: boolean | null
          created_at: string | null
          distance: number | null
          effort: number | null
          height: number | null
          id: string
          metadata: Json | null
          performing_time: number | null
          power: number | null
          reps: number | null
          resistance: number | null
          resistance_unit_id: number | null
          rest_time: number | null
          rpe: number | null
          session_plan_exercise_id: string | null
          set_index: number | null
          tempo: string | null
          updated_at: string | null
          velocity: number | null
          weight: number | null
          workout_log_exercise_id: string | null
          workout_log_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          distance?: number | null
          effort?: number | null
          height?: number | null
          id?: string
          metadata?: Json | null
          performing_time?: number | null
          power?: number | null
          reps?: number | null
          resistance?: number | null
          resistance_unit_id?: number | null
          rest_time?: number | null
          rpe?: number | null
          session_plan_exercise_id?: string | null
          set_index?: number | null
          tempo?: string | null
          updated_at?: string | null
          velocity?: number | null
          weight?: number | null
          workout_log_exercise_id?: string | null
          workout_log_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          distance?: number | null
          effort?: number | null
          height?: number | null
          id?: string
          metadata?: Json | null
          performing_time?: number | null
          power?: number | null
          reps?: number | null
          resistance?: number | null
          resistance_unit_id?: number | null
          rest_time?: number | null
          rpe?: number | null
          session_plan_exercise_id?: string | null
          set_index?: number | null
          tempo?: string | null
          updated_at?: string | null
          velocity?: number | null
          weight?: number | null
          workout_log_exercise_id?: string | null
          workout_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_etd_unit"
            columns: ["resistance_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_workout_log_sets_session_plan_exercise"
            columns: ["session_plan_exercise_id"]
            isOneToOne: false
            referencedRelation: "session_plan_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_log_sets_workout_log_exercise_id_fkey"
            columns: ["workout_log_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_log_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_log_sets_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          athlete_group_id: number | null
          athlete_id: number | null
          created_at: string | null
          date_time: string | null
          description: string | null
          id: string
          notes: string | null
          session_mode: string | null
          session_plan_id: string | null
          session_status: Database["public"]["Enums"]["session_status"]
          updated_at: string | null
        }
        Insert: {
          athlete_group_id?: number | null
          athlete_id?: number | null
          created_at?: string | null
          date_time?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          session_mode?: string | null
          session_plan_id?: string | null
          session_status: Database["public"]["Enums"]["session_status"]
          updated_at?: string | null
        }
        Update: {
          athlete_group_id?: number | null
          athlete_id?: number | null
          created_at?: string | null
          date_time?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          session_mode?: string | null
          session_plan_id?: string | null
          session_status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ets_group"
            columns: ["athlete_group_id"]
            isOneToOne: false
            referencedRelation: "athlete_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_workout_logs_session_plan"
            columns: ["session_plan_id"]
            isOneToOne: false
            referencedRelation: "session_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      athlete_in_group: { Args: { group_id: number }; Returns: boolean }
      auth_athlete_group_id: { Args: Record<PropertyKey, never>; Returns: number }
      auth_athlete_id: { Args: Record<PropertyKey, never>; Returns: number }
      auth_coach_id: { Args: Record<PropertyKey, never>; Returns: number }
      auth_coached_group_ids: { Args: Record<PropertyKey, never>; Returns: number[] }
      auth_user_id: { Args: Record<PropertyKey, never>; Returns: number }
      can_access_group: { Args: { group_id: number }; Returns: boolean }
      can_access_session_exercise: {
        Args: { spe_id: string }
        Returns: boolean
      }
      can_access_session_plan: { Args: { sp_id: string }; Returns: boolean }
      can_view_workout_log: { Args: { wl_id: string }; Returns: boolean }
      coaches_athlete: { Args: { athlete_id: number }; Returns: boolean }
      coaches_group: { Args: { group_id: number }; Returns: boolean }
      get_user_role_data: {
        Args: { p_clerk_id: string }
        Returns: {
          athlete_id: number
          coach_id: number
          role: string
          user_id: number
        }[]
      }
      lookup_user_for_invite: {
        Args: { email_input: string }
        Returns: {
          athlete_id: number
          current_group_id: number
          user_id: number
        }[]
      }
      owns_resource: { Args: { resource_user_id: number }; Returns: boolean }
      owns_session_exercise: { Args: { spe_id: string }; Returns: boolean }
      owns_session_plan: { Args: { sp_id: string }; Returns: boolean }
      owns_workout_log: { Args: { wl_id: string }; Returns: boolean }
      unuse: { Args: Record<PropertyKey, never>; Returns: undefined }
      update_user_from_webhook: {
        Args: {
          p_avatar_url: string
          p_clerk_id: string
          p_email: string
          p_first_name: string
          p_last_name: string
        }
        Returns: undefined
      }
    }
    Enums: {
      exercise_visibility_type: "global" | "private"
      memory_subject_type: "coach" | "athlete" | "group"
      memory_type:
        | "preference"
        | "philosophy"
        | "injury"
        | "profile"
        | "note"
        | "session_summary"
      role: "coach" | "athlete" | "individual"
      session_status: "assigned" | "ongoing" | "completed" | "cancelled"
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
      exercise_visibility_type: ["global", "private"],
      memory_subject_type: ["coach", "athlete", "group"],
      memory_type: [
        "preference",
        "philosophy",
        "injury",
        "profile",
        "note",
        "session_summary",
      ],
      role: ["coach", "athlete", "individual"],
      session_status: ["assigned", "ongoing", "completed", "cancelled"],
    },
  },
} as const

// Convenience type exports for common table types
export type WorkoutLogExercise = Database["public"]["Tables"]["workout_log_exercises"]["Row"]
export type WorkoutLogExerciseInsert = Database["public"]["Tables"]["workout_log_exercises"]["Insert"]
export type WorkoutLogExerciseUpdate = Database["public"]["Tables"]["workout_log_exercises"]["Update"]

export type WorkoutLog = Database["public"]["Tables"]["workout_logs"]["Row"]
export type WorkoutLogInsert = Database["public"]["Tables"]["workout_logs"]["Insert"]
export type WorkoutLogUpdate = Database["public"]["Tables"]["workout_logs"]["Update"]

export type WorkoutLogSet = Database["public"]["Tables"]["workout_log_sets"]["Row"]
export type WorkoutLogSetInsert = Database["public"]["Tables"]["workout_log_sets"]["Insert"]
export type WorkoutLogSetUpdate = Database["public"]["Tables"]["workout_log_sets"]["Update"]

export type SessionPlan = Database["public"]["Tables"]["session_plans"]["Row"]
export type SessionPlanInsert = Database["public"]["Tables"]["session_plans"]["Insert"]
export type SessionPlanUpdate = Database["public"]["Tables"]["session_plans"]["Update"]

export type SessionPlanExercise = Database["public"]["Tables"]["session_plan_exercises"]["Row"]
export type SessionPlanExerciseInsert = Database["public"]["Tables"]["session_plan_exercises"]["Insert"]
export type SessionPlanExerciseUpdate = Database["public"]["Tables"]["session_plan_exercises"]["Update"]

export type SessionPlanSet = Database["public"]["Tables"]["session_plan_sets"]["Row"]
export type SessionPlanSetInsert = Database["public"]["Tables"]["session_plan_sets"]["Insert"]
export type SessionPlanSetUpdate = Database["public"]["Tables"]["session_plan_sets"]["Update"]

// Exercise types
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"]
export type ExerciseInsert = Database["public"]["Tables"]["exercises"]["Insert"]
export type ExerciseUpdate = Database["public"]["Tables"]["exercises"]["Update"]
export type ExerciseType = Database["public"]["Tables"]["exercise_types"]["Row"]
export type Unit = Database["public"]["Tables"]["units"]["Row"]

// Periodization types
export type Macrocycle = Database["public"]["Tables"]["macrocycles"]["Row"]
export type MacrocycleInsert = Database["public"]["Tables"]["macrocycles"]["Insert"]
export type MacrocycleUpdate = Database["public"]["Tables"]["macrocycles"]["Update"]
export type Mesocycle = Database["public"]["Tables"]["mesocycles"]["Row"]
export type MesocycleInsert = Database["public"]["Tables"]["mesocycles"]["Insert"]
export type MesocycleUpdate = Database["public"]["Tables"]["mesocycles"]["Update"]
export type Microcycle = Database["public"]["Tables"]["microcycles"]["Row"]
export type MicrocycleInsert = Database["public"]["Tables"]["microcycles"]["Insert"]
export type MicrocycleUpdate = Database["public"]["Tables"]["microcycles"]["Update"]

// User types
export type User = Database["public"]["Tables"]["users"]["Row"]
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"]
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"]
export type UserRole = Database["public"]["Enums"]["role"]
export type Athlete = Database["public"]["Tables"]["athletes"]["Row"]
export type AthleteInsert = Database["public"]["Tables"]["athletes"]["Insert"]
export type AthleteUpdate = Database["public"]["Tables"]["athletes"]["Update"]
export type AthleteGroup = Database["public"]["Tables"]["athlete_groups"]["Row"]
export type AthleteGroupInsert = Database["public"]["Tables"]["athlete_groups"]["Insert"]
export type AthleteGroupUpdate = Database["public"]["Tables"]["athlete_groups"]["Update"]

// Legacy aliases (deprecated - use SessionPlan, SessionPlanExercise, SessionPlanSet instead)
export type ExercisePresetGroup = SessionPlan
export type ExercisePresetGroupInsert = SessionPlanInsert
export type ExercisePresetGroupUpdate = SessionPlanUpdate
export type ExercisePreset = SessionPlanExercise
export type ExercisePresetInsert = SessionPlanExerciseInsert
export type ExercisePresetUpdate = SessionPlanExerciseUpdate
export type ExercisePresetDetail = SessionPlanSet
export type ExerciseTrainingDetail = WorkoutLogSet
export type ExerciseTrainingSession = WorkoutLog
export type ExerciseTrainingSessionInsert = WorkoutLogInsert
export type ExerciseTrainingSessionUpdate = WorkoutLogUpdate
