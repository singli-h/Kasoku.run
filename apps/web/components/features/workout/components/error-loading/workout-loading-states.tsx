/**
 * Workout Loading States
 * Reusable loading components for different workout operations
 * with consistent styling and user feedback
 */

"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, Clock, Target, Play, Pause, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <Loader2 
      className={cn(
        'animate-spin text-muted-foreground',
        sizeClasses[size],
        className
      )} 
    />
  )
}

interface WorkoutLoadingCardProps {
  title: string
  description: string
  icon?: React.ReactNode
  showProgress?: boolean
  progress?: number
  className?: string
}

export function WorkoutLoadingCard({ 
  title, 
  description, 
  icon,
  showProgress = false,
  progress = 0,
  className 
}: WorkoutLoadingCardProps) {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          {icon || <LoadingSpinner size="lg" />}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          {description}
        </p>
        
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Loading...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface SessionLoadingSkeletonProps {
  count?: number
  className?: string
}

export function SessionLoadingSkeleton({ count = 3, className }: SessionLoadingSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="w-full">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-5 w-16" />
                </div>
                
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
                
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface WorkoutActionLoadingProps {
  action: 'starting' | 'saving' | 'completing' | 'pausing' | 'resuming'
  className?: string
}

export function WorkoutActionLoading({ action, className }: WorkoutActionLoadingProps) {
  const actionConfig = {
    starting: {
      title: 'Starting Workout',
      description: 'Preparing your session...',
      icon: <Play className="h-6 w-6 text-blue-600" />
    },
    saving: {
      title: 'Saving Progress',
      description: 'Saving your workout data...',
      icon: <Save className="h-6 w-6 text-green-600" />
    },
    completing: {
      title: 'Completing Workout',
      description: 'Finalizing your session...',
      icon: <Target className="h-6 w-6 text-green-600" />
    },
    pausing: {
      title: 'Pausing Workout',
      description: 'Pausing your session...',
      icon: <Pause className="h-6 w-6 text-yellow-600" />
    },
    resuming: {
      title: 'Resuming Workout',
      description: 'Resuming your session...',
      icon: <Play className="h-6 w-6 text-blue-600" />
    }
  }

  const config = actionConfig[action]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn('fixed inset-0 bg-black/50 flex items-center justify-center z-50', className)}
    >
      <Card className="w-full max-w-sm mx-4">
        <CardContent className="p-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            {config.icon}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{config.title}</h3>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
          
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface WorkoutPageLoadingProps {
  className?: string
}

export function WorkoutPageLoading({ className }: WorkoutPageLoadingProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Session selector skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <SessionLoadingSkeleton count={2} />
        </CardContent>
      </Card>

      {/* Quick stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default {
  LoadingSpinner,
  WorkoutLoadingCard,
  SessionLoadingSkeleton,
  WorkoutActionLoading,
  WorkoutPageLoading
}
