import { Plus, MessageCircle, Puzzle } from "lucide-react"
import type { ActionCard } from "../types/dashboard-types"

export const ACTION_CARDS: Omit<ActionCard, 'action'>[] = [
  {
    id: 'create-task',
    title: 'Create New Task',
    subtitle: 'Use AI Interviewer',
    icon: Plus,
    color: 'blue',
    href: '/tasks/create'
  },
  {
    id: 'ai-copilot',
    title: 'Ask AI Copilot',
    subtitle: 'Get instant help',
    icon: MessageCircle,
    color: 'gray',
    href: '/copilot'
  },
  {
    id: 'browser-extension',
    title: 'Browser Extension',
    subtitle: 'Install widget',
    icon: Puzzle,
    color: 'orange',
    href: '/extension'
  }
]

export const TASK_STATUS_CONFIG = {
  'todo': {
    label: 'To Do',
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
  }
} as const

export const DASHBOARD_CONFIG = {
  maxRecentTasks: 10,
  maxAIActivities: 5,
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