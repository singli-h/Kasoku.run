export interface DashboardData {
  recentTasks: Task[]
  aiActivity: AIConversation[]
  stats: DashboardStats
}

export interface Task {
  id: string
  title: string
  status: 'todo' | 'in-progress' | 'completed'
  dueDate?: Date
  assignee?: User
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  firstName?: string
  lastName?: string
  email: string
  avatar?: string
  initials: string
}

export interface AIConversation {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  isUnread: boolean
  messageCount: number
}

export interface DashboardStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  activeConversations: number
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

export type TaskStatus = 'todo' | 'in-progress' | 'completed'

export interface DashboardSectionProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
} 