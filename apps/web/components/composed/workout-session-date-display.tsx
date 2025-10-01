/**
 * Session Date Display
 * Reusable component for displaying workout session dates with consistent formatting
 */

"use client"

import React from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExerciseTrainingSessionWithDetails } from '@/types/training'

interface SessionDateDisplayProps {
  session: ExerciseTrainingSessionWithDetails
  showIcon?: boolean
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  format?: 'short' | 'medium' | 'long' | 'relative'
  className?: string
}

const sizeConfig = {
  sm: {
    container: 'text-xs',
    icon: 'h-3 w-3',
    label: 'text-xs'
  },
  md: {
    container: 'text-sm',
    icon: 'h-4 w-4',
    label: 'text-sm'
  },
  lg: {
    container: 'text-base',
    icon: 'h-5 w-5',
    label: 'text-base'
  }
}

const formatConfig = {
  short: {
    weekday: 'short' as const,
    year: 'numeric' as const,
    month: 'short' as const,
    day: 'numeric' as const,
  },
  medium: {
    weekday: 'short' as const,
    year: 'numeric' as const,
    month: 'short' as const,
    day: 'numeric' as const,
    hour: '2-digit' as const,
    minute: '2-digit' as const,
  },
  long: {
    weekday: 'long' as const,
    year: 'numeric' as const,
    month: 'long' as const,
    day: 'numeric' as const,
    hour: '2-digit' as const,
    minute: '2-digit' as const,
  }
}

export function SessionDateDisplay({ 
  session, 
  showIcon = true, 
  showLabel = true,
  size = 'md',
  format = 'short',
  className 
}: SessionDateDisplayProps) {
  const dateString = formatSessionDate(session, format)
  const sizeStyles = sizeConfig[size]

  return (
    <div className={cn(
      'flex items-center gap-1.5 text-muted-foreground',
      sizeStyles.container,
      className
    )}>
      {showIcon && (
        <Calendar className={cn(sizeStyles.icon)} />
      )}
      {showLabel && (
        <span className={sizeStyles.label}>
          {dateString}
        </span>
      )}
      {!showLabel && (
        <span className={sizeStyles.label}>
          {dateString}
        </span>
      )}
    </div>
  )
}

// Utility function to format session date
export function formatSessionDate(
  session: ExerciseTrainingSessionWithDetails, 
  format: 'short' | 'medium' | 'long' | 'relative' = 'short'
): string {
  if (!(session as any).date_time) {
    return 'No date'
  }

  const date = new Date((session as any).date_time)

  if (format === 'relative') {
    return getRelativeDate(date)
  }

  const options = formatConfig[format]
  return date.toLocaleDateString('en-US', options)
}

// Utility function to get relative date
export function getRelativeDate(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

  if (diffInMinutes < 1) {
    return 'Just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `${weeks}w ago`
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30)
    return `${months}mo ago`
  } else {
    const years = Math.floor(diffInDays / 365)
    return `${years}y ago`
  }
}

// Utility function to check if date is today
export function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

// Utility function to check if date is yesterday
export function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date.toDateString() === yesterday.toDateString()
}

// Utility function to get date range label
export function getDateRangeLabel(startDate: Date, endDate: Date): string {
  const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  
  if (startDate.getFullYear() === endDate.getFullYear()) {
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${start} - ${endDate.getDate()}`
    }
    return `${start} - ${end}`
  }
  
  return `${start}, ${startDate.getFullYear()} - ${end}, ${endDate.getFullYear()}`
}

export default SessionDateDisplay
