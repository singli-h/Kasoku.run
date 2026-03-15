import type { WorkoutLogWithDetails } from "@/types/training"

export interface DashboardData {
  recentSessions: RecentSession[]
  stats: DashboardStats
  /** Pre-fetched data for the active (ongoing/assigned) workout for instant navigation */
  activeWorkout?: WorkoutLogWithDetails
}

export interface RecentSession {
  id: string
  title: string
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  date: Date
  notes?: string
  athlete?: {
    name: string
    avatar?: string
  }
}

export interface DashboardStats {
  totalSessions: number
  completedSessions: number
  upcomingSessions: number
  activeAthletes: number
}

export interface ActionCard {
  id: string
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'gray' | 'orange'
  href: string
  action?: () => void
}

export type SessionStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled'

export interface DashboardSectionProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

export interface CoachWeekDashboardData {
  /** Section 1: This Week aggregate stats */
  weekStats: {
    totalSessions: number
    completedSessions: number
    completionRate: number
    athletesNotTrained: number
    totalAthletes: number
    activePlans: number
  }
  weekLabel: string

  /** Section 2: Today's sessions grouped by event group */
  todayGroups: Array<{
    eventGroup: string
    completed: number
    total: number
  }>
  todayTotal: {
    completed: number
    total: number
  }

  /** Section 3: Active plans with phase context */
  activePlanDetails: Array<{
    id: number
    name: string
    currentPhase: string | null
    currentWeek: number
    totalWeeks: number
  }>
}