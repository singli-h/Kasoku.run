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

export interface CoachDashboardData {
  athletes: Array<{
    id: string
    name: string
    avatar_url: string | null
    lastWorkoutDate: Date | null
    status: 'active' | 'inactive'
  }>
  totalAthletes: number
  activePlans: number
  recentActivity: Array<{
    athleteName: string
    sessionName: string
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
    date: Date
  }>
} 