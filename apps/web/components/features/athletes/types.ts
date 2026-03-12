/**
 * Shared types for athlete management components
 */

// Enhanced athlete type for the UI
export interface AthleteWithDetails {
  id: number
  user_id: number | null
  athlete_group_id: number | null
  events: unknown
  experience: string | null
  height: number | null
  training_goals: string | null
  weight: number | null
  event_group?: string | null
  user?: {
    id: number
    first_name: string | null
    last_name: string | null
    email: string
    avatar_url: string | null
    birthdate: string | null
    sex: string | null
  }
  athlete_group?: {
    id: number
    group_name: string | null
    coach_id: number | null
    created_at: string | null
  } | null
}

export interface GroupWithCount {
  id: number
  group_name: string | null
  coach_id: number | null
  created_at: string | null
  athlete_count: number
}

export interface BulkOperationState {
  isOpen: boolean
  type: 'assign' | 'move' | 'remove' | null
  targetGroupId?: number
  // When set, overrides selectedAthletes - used for single-athlete operations from dropdown
  athleteIds?: number[]
}

export interface AthleteManagementData {
  athletes: AthleteWithDetails[]
  groups: GroupWithCount[]
}

export interface EventGroup {
  id: number
  coach_id: number
  name: string
  abbreviation: string
  created_at: string | null
}
