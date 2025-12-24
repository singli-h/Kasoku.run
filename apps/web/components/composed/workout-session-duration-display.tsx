/**
 * Session Duration Display
 * Reusable component for displaying workout session duration with consistent formatting
 */

"use client"

import React from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExerciseTrainingSessionWithDetails } from '@/types/training'

interface SessionDurationDisplayProps {
  session: ExerciseTrainingSessionWithDetails
  showIcon?: boolean
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
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

export function SessionDurationDisplay({ 
  session, 
  showIcon = true, 
  showLabel = true,
  size = 'md',
  className 
}: SessionDurationDisplayProps) {
  const duration = calculateSessionDuration(session)
  const sizeStyles = sizeConfig[size]

  return (
    <div className={cn(
      'flex items-center gap-1.5 text-muted-foreground',
      sizeStyles.container,
      className
    )}>
      {showIcon && (
        <Clock className={cn(sizeStyles.icon)} />
      )}
      {showLabel && (
        <span className={sizeStyles.label}>
          {duration}
        </span>
      )}
      {!showLabel && (
        <span className={sizeStyles.label}>
          {duration}
        </span>
      )}
    </div>
  )
}

// Utility function to calculate session duration
export function calculateSessionDuration(session: ExerciseTrainingSessionWithDetails): string {
  if (!session.session_plan?.session_plan_exercises) {
    return '0 min'
  }

  // Calculate total duration from exercise presets
  const totalDuration = session.session_plan.session_plan_exercises.reduce((total: number, preset: any) => {
    return total + (preset.duration_minutes || 0)
  }, 0)

  // If no duration is set, estimate based on exercise count
  if (totalDuration === 0) {
    const exerciseCount = session.session_plan.session_plan_exercises.length
    const estimatedMinutes = exerciseCount * 3 // Rough estimate: 3 minutes per exercise
    return `${estimatedMinutes} min`
  }

  // Format duration
  if (totalDuration < 60) {
    return `${totalDuration} min`
  } else {
    const hours = Math.floor(totalDuration / 60)
    const minutes = totalDuration % 60
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
}

// Utility function to get duration in minutes
export function getSessionDurationMinutes(session: ExerciseTrainingSessionWithDetails): number {
  if (!session.session_plan?.session_plan_exercises) {
    return 0
  }

  const totalDuration = session.session_plan.session_plan_exercises.reduce((total: number, preset: any) => {
    return total + (preset.duration_minutes || 0)
  }, 0)

  if (totalDuration === 0) {
    const exerciseCount = session.session_plan.session_plan_exercises.length
    return exerciseCount * 3 // Rough estimate: 3 minutes per exercise
  }

  return totalDuration
}

// Utility function to format duration from minutes
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }
}

export default SessionDurationDisplay
