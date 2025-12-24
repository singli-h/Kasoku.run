/**
 * Session Exercise Count Display
 * Reusable component for displaying workout session exercise count with consistent formatting
 */

"use client"

import React from 'react'
import { Target, Dumbbell, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExerciseTrainingSessionWithDetails } from '@/types/training'

interface SessionExerciseCountProps {
  session: ExerciseTrainingSessionWithDetails
  showIcon?: boolean
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  iconType?: 'target' | 'dumbbell' | 'activity'
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

const iconConfig = {
  target: Target,
  dumbbell: Dumbbell,
  activity: Activity
}

export function SessionExerciseCount({ 
  session, 
  showIcon = true, 
  showLabel = true,
  size = 'md',
  iconType = 'target',
  className 
}: SessionExerciseCountProps) {
  const exerciseCount = getSessionExerciseCount(session)
  const sizeStyles = sizeConfig[size]
  const Icon = iconConfig[iconType]

  return (
    <div className={cn(
      'flex items-center gap-1.5 text-muted-foreground',
      sizeStyles.container,
      className
    )}>
      {showIcon && (
        <Icon className={cn(sizeStyles.icon)} />
      )}
      {showLabel && (
        <span className={sizeStyles.label}>
          {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
        </span>
      )}
      {!showLabel && (
        <span className={sizeStyles.label}>
          {exerciseCount}
        </span>
      )}
    </div>
  )
}

// Utility function to get session exercise count
export function getSessionExerciseCount(session: ExerciseTrainingSessionWithDetails): number {
  if (!session.session_plan?.session_plan_exercises) {
    return 0
  }

  return session.session_plan.session_plan_exercises.length
}

// Utility function to get exercise count by type
export function getExerciseCountByType(session: ExerciseTrainingSessionWithDetails) {
  if (!session.session_plan?.session_plan_exercises) {
    return {
      total: 0,
      byType: {}
    }
  }

  const byType: Record<string, number> = {}
  let total = 0

  session.session_plan.session_plan_exercises.forEach((preset: any) => {
    if (preset.exercise?.exercise_type?.name) {
      const typeName = preset.exercise.exercise_type.name
      byType[typeName] = (byType[typeName] || 0) + 1
      total++
    }
  })

  return { total, byType }
}

// Utility function to get exercise count summary
export function getExerciseCountSummary(session: ExerciseTrainingSessionWithDetails): string {
  const { total, byType } = getExerciseCountByType(session)
  
  if (total === 0) {
    return 'No exercises'
  }

  const typeCount = Object.keys(byType).length
  if (typeCount === 1) {
    const typeName = Object.keys(byType)[0]
    return `${total} ${typeName.toLowerCase()} exercise${total === 1 ? '' : 's'}`
  }

  return `${total} exercises across ${typeCount} types`
}

// Utility function to get exercise type breakdown
export function getExerciseTypeBreakdown(session: ExerciseTrainingSessionWithDetails): Array<{type: string, count: number}> {
  const { byType } = getExerciseCountByType(session)
  
  return Object.entries(byType)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
}

export default SessionExerciseCount
