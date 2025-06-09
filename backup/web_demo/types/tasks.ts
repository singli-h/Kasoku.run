import type { Task } from './database'

// Configuration for task status display
export const TASK_STATUS_CONFIG = {
  'todo': {
    label: 'To Do',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    variant: 'secondary' as const,
    color: 'bg-gray-400 dark:bg-gray-600'
  },
  'in_progress': {
    label: 'In Progress',  
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    variant: 'default' as const,
    color: 'bg-blue-500'
  },
  'done': {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    variant: 'outline' as const,
    color: 'bg-green-500'
  },
  'blocked': {
    label: 'Blocked',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    variant: 'destructive' as const,
    color: 'bg-red-500'
  },
  'cancelled': {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    variant: 'outline' as const,
    color: 'bg-gray-500'
  }
} as const

// Configuration for task priority display
export const PRIORITY_CONFIG = {
  'high': {
    label: 'High',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    variant: 'destructive' as const,
    color: 'bg-red-500'
  },
  'medium': {
    label: 'Medium',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    variant: 'default' as const,
    color: 'bg-yellow-500'
  },
  'low': {
    label: 'Low',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    variant: 'outline' as const,
    color: 'bg-green-500'
  }
} as const

// UI-specific interfaces for forms and filters
export interface TaskFormData {
  title: string
  description: string
  assignee_id: number | null // Fixed: now number | null instead of string
  priority: 'high' | 'medium' | 'low'
  budget: string
  timeline: string
  workflow: string
  resources: string
  tags: string[]
}

export interface TaskFilters {
  status?: string[]
  priority?: string[]
  assignee_id?: number[]
  tags?: string[]
  search?: string
  created_after?: string
  created_before?: string
}

export interface TaskSort {
  field: 'updated_at' | 'created_at' | 'title' | 'priority' | 'status'
  direction: 'asc' | 'desc'
}

// Re-export database types for convenience
export type { Task }
export type TaskStatus = Task['status']
export type TaskPriority = Task['priority']

// Note: TaskWithRelations is defined in actions/tasks/task-actions.ts 