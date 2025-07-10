export interface DashboardData {
  recentSessions: RecentSession[]
  stats: DashboardStats
}

export interface RecentSession {
  id: number
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