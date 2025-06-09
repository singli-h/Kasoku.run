import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Task, TaskStatus, User } from "../types/dashboard-types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(user: User): string {
  if (user.initials) return user.initials
  
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  }
  
  if (user.firstName) {
    return user.firstName.charAt(0).toUpperCase()
  }
  
  return user.email.charAt(0).toUpperCase()
}

export function getDisplayName(user: User): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`
  }
  
  if (user.firstName) {
    return user.firstName
  }
  
  return user.email
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Just now'
  }
  
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }
  
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }
  
  return date.toLocaleDateString()
}

export function formatDueDate(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const dueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  if (dueDate.getTime() === today.getTime()) {
    return 'Due today'
  }
  
  if (dueDate.getTime() === tomorrow.getTime()) {
    return 'Due tomorrow'
  }
  
  if (dueDate < today) {
    const diffInDays = Math.floor((today.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000))
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} overdue`
  }
  
  return `Due ${date.toLocaleDateString()}`
}

export function getTaskStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'in-progress':
      return 'bg-blue-100 text-blue-800'
    case 'todo':
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getTaskStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'in-progress':
      return 'In Progress'
    case 'todo':
    default:
      return 'To Do'
  }
}

export function getTaskPriorityOrder(tasks: Task[]): Task[] {
  return tasks.sort((a, b) => {
    // Sort by status first (in-progress > todo > completed)
    const statusOrder = { 'in-progress': 0, 'todo': 1, 'completed': 2 }
    const statusComparison = statusOrder[a.status] - statusOrder[b.status]
    
    if (statusComparison !== 0) {
      return statusComparison
    }
    
    // Then by due date (earlier dates first)
    if (a.dueDate && b.dueDate) {
      return a.dueDate.getTime() - b.dueDate.getTime()
    }
    
    if (a.dueDate && !b.dueDate) return -1
    if (!a.dueDate && b.dueDate) return 1
    
    // Finally by created date (newer first)
    return b.createdAt.getTime() - a.createdAt.getTime()
  })
}

export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate) return false
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDate = new Date(task.dueDate.getFullYear(), task.dueDate.getMonth(), task.dueDate.getDate())
  
  return dueDate < today && task.status !== 'completed'
}

export function getAvatarUrl(user: User, size: number = 32): string {
  if (user.avatar) return user.avatar
  
  // Generate a deterministic color based on user ID
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500']
  const colorIndex = user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(getInitials(user))}&size=${size}&background=${colors[colorIndex].replace('bg-', '').replace('-500', '')}&color=fff`
} 