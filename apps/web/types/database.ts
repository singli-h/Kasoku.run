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
      athlete_personal_bests: {
        Row: {
          id: number
          athlete_id: number
          exercise_id: number | null
          event_id: number | null
          value: number
          unit_id: number
          metadata: Json | null
          achieved_date: string
          session_id: number | null
          verified: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          athlete_id: number
          exercise_id?: number | null
          event_id?: number | null
          value: number
          unit_id: number
          metadata?: Json | null
          achieved_date?: string
          session_id?: number | null
          verified?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          athlete_id?: number
          exercise_id?: number | null
          event_id?: number | null
          value?: number
          unit_id?: number
          metadata?: Json | null
          achieved_date?: string
          session_id?: number | null
          verified?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
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
            foreignKeyName: "athlete_personal_bests_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
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
            foreignKeyName: "athlete_personal_bests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "exercise_training_sessions"
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
            isOneToOne: false
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
          target_intensity?: number | null
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
          target_intensity?: number | null
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
            foreignKeyName: "exercise_preset_groups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
          effort: number | null
          exercise_preset_id: number | null
          exercise_training_session_id: number | null
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
          completed?: boolean | null
          created_at?: string | null
          distance?: number | null
          effort?: number | null
          exercise_preset_id?: number | null
          exercise_training_session_id?: number | null
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
          completed?: boolean | null
          created_at?: string | null
          distance?: number | null
          effort?: number | null
          exercise_preset_id?: number | null
          exercise_training_session_id?: number | null
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
          session_status: Database["public"]["Enums"]["session_status"]
          updated_at: string | null
        }
        Insert: {
          athlete_group_id?: number | null
          athlete_id?: number | null
          created_at?: string | null
          date_time?: string | null
          description?: string | null
          exercise_preset_group_id?: number | null
          id?: number
          notes?: string | null
          session_mode?: string | null
          session_status: Database["public"]["Enums"]["session_status"]
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
          session_status?: Database["public"]["Enums"]["session_status"]
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
          description: string | null
          embedding: string | null
          exercise_type_id: number | null
          id: number
          is_archived: boolean | null
          name: string | null
          owner_user_id: number | null
          search_tsv: unknown | null
          unit_id: number | null
          video_url: string | null
          visibility:
            | Database["public"]["Enums"]["exercise_visibility_type"]
            | null
        }
        Insert: {
          description?: string | null
          embedding?: string | null
          exercise_type_id?: number | null
          id?: number
          is_archived?: boolean | null
          name?: string | null
          owner_user_id?: number | null
          search_tsv?: unknown | null
          unit_id?: number | null
          video_url?: string | null
          visibility?:
            | Database["public"]["Enums"]["exercise_visibility_type"]
            | null
        }
        Update: {
          description?: string | null
          embedding?: string | null
          exercise_type_id?: number | null
          id?: number
          is_archived?: boolean | null
          name?: string | null
          owner_user_id?: number | null
          search_tsv?: unknown | null
          unit_id?: number | null
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
          end_date?: string | null
          id?: number
          macrocycle_id?: number | null
          metadata?: Json | null
          name?: string | null
          start_date?: string | null
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
          intensity: number | null
          mesocycle_id: number | null
          name: string | null
          start_date: string | null
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
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_user_role_data: {
        Args: { _clerk_id: string }
        Returns: {
          athlete_group_id: number
          athlete_id: number
          coach_id: number
          role: string
          user_id: number
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      unuse: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
      session_status: ["assigned", "ongoing", "completed", "cancelled"],
    },
  },
} as const
// Convenience type aliases for tables (manually maintained)
export type Macrocycle = Tables<"macrocycles">
export type MacrocycleInsert = TablesInsert<"macrocycles">
export type MacrocycleUpdate = TablesUpdate<"macrocycles">

export type Mesocycle = Tables<"mesocycles">
export type MesocycleInsert = TablesInsert<"mesocycles">
export type MesocycleUpdate = TablesUpdate<"mesocycles">

export type Microcycle = Tables<"microcycles">
export type MicrocycleInsert = TablesInsert<"microcycles">
export type MicrocycleUpdate = TablesUpdate<"microcycles">

export type Exercise = Tables<"exercises">
export type ExerciseInsert = TablesInsert<"exercises">
export type ExerciseUpdate = TablesUpdate<"exercises">

export type ExerciseType = Tables<"exercise_types">

export type Unit = Tables<"units">

export type ExercisePresetGroup = Tables<"exercise_preset_groups">
export type ExercisePresetGroupInsert = TablesInsert<"exercise_preset_groups">
export type ExercisePresetGroupUpdate = TablesUpdate<"exercise_preset_groups">

export type ExercisePreset = Tables<"exercise_presets">
export type ExercisePresetInsert = TablesInsert<"exercise_presets">
export type ExercisePresetUpdate = TablesUpdate<"exercise_presets">

export type ExercisePresetDetail = Tables<"exercise_preset_details">

export type Athlete = Tables<"athletes">
export type AthleteInsert = TablesInsert<"athletes">
export type AthleteUpdate = TablesUpdate<"athletes">

export type AthleteGroup = Tables<"athlete_groups">
export type AthleteGroupInsert = TablesInsert<"athlete_groups">
export type AthleteGroupUpdate = TablesUpdate<"athlete_groups">

export type ExerciseTrainingDetail = Tables<"exercise_training_details">
