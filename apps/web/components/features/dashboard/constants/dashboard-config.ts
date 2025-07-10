import { Dumbbell, Calendar, Users } from "lucide-react"
import type { ActionCard } from "../types/dashboard-types"

export const ACTION_CARDS: Omit<ActionCard, 'action'>[] = [
  {
    id: 'start-workout',
    title: 'Start Workout',
    subtitle: 'Begin training session',
    icon: Dumbbell,
    color: 'blue',
    href: '/workout'
  },
  {
    id: 'view-sessions',
    title: 'Training Sessions',
    subtitle: 'View your schedule',
    icon: Calendar,
    color: 'gray',
    href: '/sessions'
  },
  {
    id: 'manage-athletes',
    title: 'Athletes',
    subtitle: 'Manage your team',
    icon: Users,
    color: 'orange',
    href: '/athletes'
  }
]

export const SESSION_STATUS_CONFIG = {
  'pending': {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-800',
    variant: 'secondary' as const
  },
  'in-progress': {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-800',
    variant: 'default' as const
  },
  'completed': {
    label: 'Completed',
    className: 'bg-green-100 text-green-800',
    variant: 'outline' as const
  },
  'cancelled': {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800',
    variant: 'destructive' as const
  }
} as const

export const DASHBOARD_CONFIG = {
  maxRecentSessions: 10,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  skeletonCount: 3
} as const

export const CARD_COLORS = {
  blue: {
    background: 'bg-blue-600',
    hover: 'hover:bg-blue-700',
    text: 'text-white',
    icon: 'text-white'
  },
  gray: {
    background: 'bg-gray-100',
    hover: 'hover:bg-gray-200',
    text: 'text-gray-900',
    icon: 'text-gray-600'
  },
  orange: {
    background: 'bg-orange-500',
    hover: 'hover:bg-orange-600',
    text: 'text-white',
    icon: 'text-white'
  }
} as const 