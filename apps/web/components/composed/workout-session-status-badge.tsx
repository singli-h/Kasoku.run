/**
 * Session Status Badge
 * Reusable component for displaying workout session status with consistent styling
 */

"use client"

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckCircle, Clock, Play, XCircle, AlertCircle } from 'lucide-react'

export type SessionStatus = 'assigned' | 'ongoing' | 'completed' | 'cancelled' | 'unknown'

interface SessionStatusBadgeProps {
  status: SessionStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const statusConfig = {
  assigned: {
    label: 'Assigned',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200',
    iconClassName: 'text-yellow-600'
  },
  ongoing: {
    label: 'Ongoing',
    icon: Play,
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200',
    iconClassName: 'text-blue-600'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200',
    iconClassName: 'text-green-600'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200',
    iconClassName: 'text-red-600'
  },
  unknown: {
    label: 'Unknown',
    icon: AlertCircle,
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200',
    iconClassName: 'text-gray-600'
  }
}

const sizeConfig = {
  sm: {
    badge: 'text-xs px-2 py-1',
    icon: 'h-3 w-3'
  },
  md: {
    badge: 'text-sm px-2.5 py-1.5',
    icon: 'h-4 w-4'
  },
  lg: {
    badge: 'text-base px-3 py-2',
    icon: 'h-5 w-5'
  }
}

export function SessionStatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true, 
  className 
}: SessionStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.unknown
  const sizeStyles = sizeConfig[size]
  const Icon = config.icon

  return (
    <Badge 
      className={cn(
        'inline-flex items-center gap-1.5 font-medium transition-colors',
        config.className,
        sizeStyles.badge,
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(sizeStyles.icon, config.iconClassName)} />
      )}
      {config.label}
    </Badge>
  )
}

// Utility function to get status color classes
export function getSessionStatusColor(status: SessionStatus): string {
  const config = statusConfig[status] || statusConfig.unknown
  return config.className
}

// Utility function to get status icon
export function getSessionStatusIcon(status: SessionStatus) {
  const config = statusConfig[status] || statusConfig.unknown
  return config.icon
}

export default SessionStatusBadge
